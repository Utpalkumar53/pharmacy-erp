package com.hospital.pharmacy_erp.service;

import com.hospital.pharmacy_erp.dto.GstReport;
import com.hospital.pharmacy_erp.entity.*;
import com.hospital.pharmacy_erp.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Month;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ReportService {

    @Autowired private SaleRepository saleRepository;
    @Autowired private PurchaseOrderRepository purchaseOrderRepository;
    @Autowired private ExpenseRepository expenseRepository;
    @Autowired private MedicineRepository medicineRepository;
    @Autowired private IndentRepository indentRepository;

    // --- FINANCIAL SUMMARY REPORT (Keep as is, it's correct) ---
    public Map<String, Double> getMonthlyReport(int month, int year) {
        double counterSales = saleRepository.findAll().stream()
                .filter(s -> s.getSaleDate().getMonthValue() == month && s.getSaleDate().getYear() == year)
                .mapToDouble(Sale::getTotalAmount).sum();

        double hospitalConsumption = indentRepository.findAll().stream()
                .filter(i -> "ISSUED".equals(i.getStatus()) &&
                        i.getRequestDate().getMonthValue() == month &&
                        i.getRequestDate().getYear() == year)
                .flatMap(i -> i.getItems().stream())
                .mapToDouble(item -> item.getTotalValue()).sum(); // Use captured totalValue

        Map<String, Double> report = new HashMap<>();
        report.put("CounterSales", round(counterSales));
        report.put("HospitalInternalUsage", round(hospitalConsumption));
        report.put("TotalRevenueValue", round(counterSales + hospitalConsumption));

        double totalPurchases = purchaseOrderRepository.findAll().stream()
                .filter(p -> p.getPurchaseDate() != null && p.getPurchaseDate().getMonthValue() == month)
                .mapToDouble(p -> p.getQuantityPurchased() * p.getUnitCostPrice()).sum();

        report.put("NetProfit", round((counterSales + hospitalConsumption) - totalPurchases));
        return report;
    }

    // --- MODIFIED: AUDIT-READY GST REPORT ---
    public GstReport generateGstReport(int month, int year) {
        // 1. Fetch Data
        List<Sale> monthlySales = saleRepository.findAll().stream()
                .filter(s -> s.getSaleDate().getMonthValue() == month && s.getSaleDate().getYear() == year)
                .toList();

        List<Indent> monthlyIndents = indentRepository.findAll().stream()
                .filter(i -> "ISSUED".equals(i.getStatus()) &&
                        i.getRequestDate().getMonthValue() == month &&
                        i.getRequestDate().getYear() == year)
                .toList();

        List<PurchaseOrder> monthlyPurchases = purchaseOrderRepository.findAll().stream()
                .filter(p -> p.getPurchaseDate() != null &&
                        p.getPurchaseDate().getMonthValue() == month &&
                        p.getPurchaseDate().getYear() == year)
                .toList();

        GstReport report = new GstReport();
        report.setMonth(Month.of(month).name());
        report.setYear(year);

        // 2. DETAILED REVENUE CALCULATION
        // A. Counter Sales (Actual Cash/Credit from customers)
        double counterSalesTotal = monthlySales.stream().mapToDouble(Sale::getTotalAmount).sum();
        double totalCollectedGst = monthlySales.stream().mapToDouble(Sale::getTotalTax).sum();

        // B. Hospital Normal Indents (Non-emergency ward usage)
        double hospitalNormalUsage = monthlyIndents.stream()
                .filter(i -> !i.isEmergency())
                .flatMap(i -> i.getItems().stream())
                .mapToDouble(IndentItem::getTotalValue)
                .sum();

        // C. Hospital Emergency Indents (Life-saving/Doctor authorized usage)
        double hospitalEmergencyUsage = monthlyIndents.stream()
                .filter(i -> i.isEmergency())
                .flatMap(i -> i.getItems().stream())
                .mapToDouble(IndentItem::getTotalValue)
                .sum();

        // 3. GST MAP CALCULATION
        Map<Double, Double> collectedMap = new HashMap<>();
        for (Sale sale : monthlySales) {
            if (!sale.getSaleItems().isEmpty()) {
                Medicine med = medicineRepository.findById(sale.getSaleItems().get(0).getMedicineId()).orElse(null);
                if (med != null) {
                    double rate = Math.round(med.getGstPercentage() * 10.0) / 10.0;
                    collectedMap.put(rate, round(collectedMap.getOrDefault(rate, 0.0) + sale.getTotalTax()));
                }
            }
        }

        // 4. PURCHASE CALCULATION (Input Tax)
        Map<Double, Double> paidMap = new HashMap<>();
        double totalPurchaseVal = 0.0;

        for (PurchaseOrder po : monthlyPurchases) {
            Medicine med = medicineRepository.findById(po.getMedicineId()).orElse(null);
            if (med != null) {
                double rate = med.getGstPercentage();
                double subTotal = po.getQuantityPurchased() * po.getUnitCostPrice();
                double taxPaid = subTotal * (rate / 100);

                totalPurchaseVal += subTotal;
                paidMap.put(rate, round(paidMap.getOrDefault(rate, 0.0) + taxPaid));
            }
        }

        // 5. Final Assembly & Breakdown
        double totalPaidGst = paidMap.values().stream().mapToDouble(Double::doubleValue).sum();

        // Set the specific buckets for clarity
        report.setCounterSalesTotal(round(counterSalesTotal));
        report.setHospitalNormalIndentTotal(round(hospitalNormalUsage));
        report.setHospitalEmergencyIndentTotal(round(hospitalEmergencyUsage));

        // Gross Total (Logical Balance)
        report.setTotalSalesValue(round(counterSalesTotal + hospitalNormalUsage + hospitalEmergencyUsage));

        report.setTotalCollectedGst(round(totalCollectedGst));
        report.setCollectedGstByRate(collectedMap);
        report.setTotalPurchaseValue(round(totalPurchaseVal));
        report.setTotalPaidGst(round(totalPaidGst));
        report.setPaidGstByRate(paidMap);
        report.setNetGstPayable(round(report.getTotalCollectedGst() - report.getTotalPaidGst()));

        return report;
    }
    // Add this back into ReportService.java
    public int getItemSalesCount(String medicineId, int month, int year) {
        return saleRepository.findAll().stream()
                .filter(s -> s.getSaleDate().getMonthValue() == month && s.getSaleDate().getYear() == year)
                .flatMap(s -> s.getSaleItems().stream())
                .filter(item -> item.getMedicineId().equals(medicineId))
                .mapToInt(SaleItem::getQuantity)
                .sum();
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}