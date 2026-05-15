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
    @Autowired private MedicineRepository medicineRepository;
    @Autowired private IndentRepository indentRepository;
    @Autowired private SaleReturnRepository saleReturnRepository;

    public Map<String, Double> getMonthlyReport(int month, int year) {
        double counterSales = saleRepository.findAll().stream()
                .filter(s -> s.getSaleDate().getMonthValue() == month && s.getSaleDate().getYear() == year)
                .mapToDouble(Sale::getTotalAmount).sum();

        double totalRefunds = saleReturnRepository.findAll().stream()
                .filter(r -> r.getReturnDate().getMonthValue() == month && r.getReturnDate().getYear() == year)
                .mapToDouble(SaleReturn::getTotalRefundAmount).sum();

        double hospitalConsumption = indentRepository.findAll().stream()
                .filter(i -> "ISSUED".equals(i.getStatus()) &&
                        i.getRequestDate().getMonthValue() == month &&
                        i.getRequestDate().getYear() == year)
                .flatMap(i -> i.getItems().stream())
                .mapToDouble(IndentItem::getTotalValue).sum();

        // FIXED: Using the new getTotalBillAmount field
        double totalPurchases = purchaseOrderRepository.findAll().stream()
                .filter(p -> p.getPurchaseDate() != null &&
                        p.getPurchaseDate().getMonthValue() == month &&
                        p.getPurchaseDate().getYear() == year)
                .mapToDouble(PurchaseOrder::getTotalBillAmount).sum();

        Map<String, Double> report = new HashMap<>();
        double netCounterSales = counterSales - totalRefunds;

        report.put("CounterSales", round(netCounterSales));
        report.put("HospitalInternalUsage", round(hospitalConsumption));
        report.put("TotalRevenueValue", round(netCounterSales + hospitalConsumption));
        report.put("NetProfit", round((netCounterSales + hospitalConsumption) - totalPurchases));

        return report;
    }

    public GstReport generateGstReport(int month, int year) {
        // null safe
        List<Sale> monthlySales = saleRepository.findAll().stream()
                .filter(s -> s.getSaleDate() != null &&
                        s.getSaleDate().getMonthValue() == month &&
                        s.getSaleDate().getYear() == year)
                .toList();

        // Monthly indents — add null check
        List<Indent> monthlyIndents = indentRepository.findAll().stream()
                .filter(i -> i.getRequestDate() != null &&
                        "ISSUED".equals(i.getStatus()) &&
                        i.getRequestDate().getMonthValue() == month &&
                        i.getRequestDate().getYear() == year)
                .toList();

        // Monthly purchases — add null check
        List<PurchaseOrder> monthlyPurchases = purchaseOrderRepository.findAll().stream()
                .filter(p -> p.getPurchaseDate() != null &&
                        p.getPurchaseDate().getMonthValue() == month &&
                        p.getPurchaseDate().getYear() == year)
                .toList();

        // Monthly returns — add null check
        List<SaleReturn> monthlyReturns = saleReturnRepository.findAll().stream()
                .filter(r -> r.getReturnDate() != null &&
                        r.getReturnDate().getMonthValue() == month &&
                        r.getReturnDate().getYear() == year)
                .toList();

        double totalRefunds = monthlyReturns.stream().mapToDouble(SaleReturn::getTotalRefundAmount).sum();

        GstReport report = new GstReport();
        report.setMonth(Month.of(month).name());
        report.setYear(year);

        double rawCounterSales = monthlySales.stream().mapToDouble(Sale::getTotalAmount).sum();
        double netCounterSales = rawCounterSales - totalRefunds;
        double totalCollectedGst = monthlySales.stream()
                .mapToDouble(s -> {
                    Object tax = s.getTotalTax();
                    if (tax == null) return 0.0;
                    if (tax instanceof Number) return ((Number) tax).doubleValue();
                    try { return Double.parseDouble(tax.toString()); }
                    catch (Exception e) { return 0.0; }
                }).sum();

        double hospitalNormalUsage = monthlyIndents.stream()
                .filter(i -> !i.isEmergency())
                .flatMap(i -> i.getItems().stream())
                .mapToDouble(IndentItem::getTotalValue).sum();

        double hospitalEmergencyUsage = monthlyIndents.stream()
                .filter(i -> i.isEmergency())
                .flatMap(i -> i.getItems().stream())
                .mapToDouble(IndentItem::getTotalValue).sum();

        // GST collected from sales — FIXED: iterate every item not just first
        Map<Double, Double> collectedMap = new HashMap<>();
        for (Sale sale : monthlySales) {
            if (sale.getSaleItems() == null || sale.getSaleItems().isEmpty()) continue;

            double saleTotalTax = sale.getTotalTax(); // use the STORED tax value
            if (saleTotalTax <= 0) continue;

            // Calculate each item's proportion of the total sale value
            double saleTotalValue = sale.getSaleItems().stream()
                    .mapToDouble(i -> i.getUnitPrice() * i.getQuantity())
                    .sum();

            for (SaleItem item : sale.getSaleItems()) {
                Medicine med = medicineRepository.findById(item.getMedicineId()).orElse(null);

                // Get rate — default to 0 if medicine not found or rate not set
                double rate = (med != null && med.getGstPercentage() > 0)
                        ? Math.round(med.getGstPercentage() * 10.0) / 10.0
                        : 0.0;  // ← REMOVE the skip, use 0.0 as the rate bucket

                double itemValue    = item.getUnitPrice() * item.getQuantity();
                double itemTaxShare = saleTotalValue > 0
                        ? round(saleTotalTax * (itemValue / saleTotalValue))
                        : 0.0;

                // Only add if there's actual tax to assign
                if (itemTaxShare > 0) {
                    collectedMap.put(rate,
                            round(collectedMap.getOrDefault(rate, 0.0) + itemTaxShare));
                }
            }
        }

        // FIXED: Using the new aggregated purchase fields
        Map<Double, Double> paidMap = new HashMap<>();
        double totalPurchaseVal = 0.0;
        double totalPaidGst = 0.0;

        for (PurchaseOrder po : monthlyPurchases) {
            totalPurchaseVal += po.getTotalBillAmount() - po.getTotalInputTax(); // Base value
            totalPaidGst += po.getTotalInputTax();

            // Map tax by rate from items
            if(po.getItems() != null) {
                for (PurchaseItem item : po.getItems()) {
                    double rate = item.getGstPercentage();
                    paidMap.put(rate, round(paidMap.getOrDefault(rate, 0.0) + item.getTaxAmount()));
                }
            }
        }

        report.setCounterSalesTotal(round(netCounterSales));
        report.setHospitalNormalIndentTotal(round(hospitalNormalUsage));
        report.setHospitalEmergencyIndentTotal(round(hospitalEmergencyUsage));
        report.setTotalSalesValue(round(netCounterSales + hospitalNormalUsage + hospitalEmergencyUsage));
        report.setTotalCollectedGst(round(totalCollectedGst));
        report.setCollectedGstByRate(collectedMap);
        report.setTotalPurchaseValue(round(totalPurchaseVal));
        report.setTotalPaidGst(round(totalPaidGst));
        report.setPaidGstByRate(paidMap);
        report.setNetGstPayable(round(report.getTotalCollectedGst() - report.getTotalPaidGst()));

        return report;
    }

    public int getItemSalesCount(String medicineId, int month, int year) {
        return saleRepository.findAll().stream()
                .filter(s -> s.getSaleDate().getMonthValue() == month && s.getSaleDate().getYear() == year)
                .flatMap(s -> s.getSaleItems().stream())
                .filter(item -> item.getMedicineId().equals(medicineId))
                .mapToInt(SaleItem::getQuantity).sum();
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}