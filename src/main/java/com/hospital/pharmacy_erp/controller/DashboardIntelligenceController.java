package com.hospital.pharmacy_erp.controller;

import com.hospital.pharmacy_erp.entity.*;
import com.hospital.pharmacy_erp.repository.*;
import com.hospital.pharmacy_erp.service.FinanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

import static java.lang.Math.round;

@RestController
@RequestMapping("/api/intelligence")
@CrossOrigin(origins = "http://localhost:3000")
public class DashboardIntelligenceController {

    @Autowired private MedicineRepository medicineRepository;
    @Autowired private ActivityLogRepository activityLogRepository;
    @Autowired private SaleRepository saleRepository;
    @Autowired private PurchaseReturnRepository purchaseReturnRepository;
    @Autowired private CustomerRepository customerRepository;

    // ✅ Injected the FinanceService we updated
    @Autowired private FinanceService financeService;

    /**
     * Helper method — converts ANY date type (Date, String, LocalDateTime) to LocalDate safely.
     * Only one copy of this method is needed.
     */
    private LocalDate toLocalDate(Object dateObj) {
        if (dateObj == null) return null;
        try {
            if (dateObj instanceof Date) {
                return ((Date) dateObj).toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
            }
            if (dateObj instanceof LocalDate) {
                return (LocalDate) dateObj;
            }
            if (dateObj instanceof LocalDateTime) {
                return ((LocalDateTime) dateObj).toLocalDate();
            }
            if (dateObj instanceof String) {
                String s = (String) dateObj;
                if (s.matches("\\d{4}-\\d{2}-\\d{2}.*")) {
                    return LocalDate.parse(s.substring(0, 10));
                }
                if (s.matches("\\d{2}/\\d{2}/\\d{4}")) {
                    String[] parts = s.split("/");
                    return LocalDate.of(Integer.parseInt(parts[2]), Integer.parseInt(parts[1]), Integer.parseInt(parts[0]));
                }
            }
        } catch (Exception e) {
            System.err.println("[toLocalDate] Error parsing date: " + dateObj);
        }
        return null;
    }

    @GetMapping("/alerts")
    public ResponseEntity<?> getAlerts() {
        List<Medicine> allMedicines = medicineRepository.findAll();
        LocalDate today = LocalDate.now();

        long expiry30 = allMedicines.stream()
                .filter(m -> m.getExpiryDate() != null)
                .filter(m -> {
                    LocalDate expiry = toLocalDate(m.getExpiryDate());
                    return expiry != null && !expiry.isBefore(today) && expiry.isBefore(today.plusDays(30));
                }).count();

        long expiry60 = allMedicines.stream()
                .filter(m -> m.getExpiryDate() != null)
                .filter(m -> {
                    LocalDate expiry = toLocalDate(m.getExpiryDate());
                    return expiry != null && expiry.isAfter(today.plusDays(30)) && expiry.isBefore(today.plusDays(60));
                }).count();

        long expiry90 = allMedicines.stream()
                .filter(m -> m.getExpiryDate() != null)
                .filter(m -> {
                    LocalDate expiry = toLocalDate(m.getExpiryDate());
                    return expiry != null && expiry.isAfter(today.plusDays(60)) && expiry.isBefore(today.plusDays(90));
                }).count();

        long lowStockCount = allMedicines.stream()
                .filter(m -> m.getStockQuantity() <= m.getMinStockLevel())
                .count();

        long pendingSupplierReturns = purchaseReturnRepository.countByStatus("PENDING");

        return ResponseEntity.ok(Map.of(
                "expiry30", expiry30,
                "expiry60", expiry60,
                "expiry90", expiry90,
                "lowStockCount", lowStockCount,
                "pendingSupplierReturns", pendingSupplierReturns
        ));
    }

    @GetMapping("/recent-activity")
    public ResponseEntity<?> getRecentActivity() {
        return ResponseEntity.ok(
                activityLogRepository.findAll(Sort.by(Sort.Direction.DESC, "timestamp"))
                        .stream().limit(5).collect(Collectors.toList())
        );
    }

    @GetMapping("/finance-summary")
    public ResponseEntity<?> getFinanceSummary() {
        // --- 1. DATA COLLECTION ---
        List<Medicine> allMedicines = medicineRepository.findAll();
        List<PurchaseReturn> allReturns = purchaseReturnRepository.findAll();
        List<Customer> allCustomers = customerRepository.findAll();

        double deadStockLoss    = 0.0;
        double totalOutstanding = 0.0;
        LocalDate today         = LocalDate.now();

        // --- 2. DEAD STOCK CALCULATION ---
        for (Medicine med : allMedicines) {
            if (med.getExpiryDate() == null || med.getStockQuantity() <= 0) continue;
            LocalDate expiry = toLocalDate(med.getExpiryDate());
            if (expiry != null && expiry.isBefore(today)) {
                double priceToUse = med.getCostPrice() > 0 ? med.getCostPrice() : med.getMrp();
                deadStockLoss += priceToUse * med.getStockQuantity();
            }
        }

        // --- 3. KHATA / MARKET CREDIT ---
        totalOutstanding = allCustomers.stream()
                .mapToDouble(Customer::getOutstandingBalance).sum();

        // --- 4. USE SAME P&L LOGIC AS FINANCE PAGE ---
        int currentMonth = LocalDate.now().getMonthValue();
        int currentYear  = LocalDate.now().getYear();
        Map<String, Double> plData    = financeService.getProfitAndLoss(currentMonth, currentYear);
        Map<String, Double> gstReport = financeService.getGSTReport();

        // --- 5. CONSTRUCT FINAL RESPONSE ---
        Map<String, Object> response = new HashMap<>();

        // ✅ These now use identical calculation as Finance & Accounts page
        response.put("totalRevenue",     plData.get("totalRevenue"));
        response.put("netProfit",        plData.get("netProfit"));
        response.put("profitMargin",     plData.get("profitMargin"));
        response.put("totalExpenses",    plData.get("totalExpenses"));
        response.put("netSavings",       plData.get("netProfit"));

        // GST
        response.put("taxToPay",         gstReport.get("netGstPayable"));
        response.put("inputTaxCredit",   gstReport.get("inputTaxCredit"));
        response.put("outputTax",        gstReport.get("outputTax"));

        // Other metrics
        response.put("deadStockLoss",    round(deadStockLoss));
        response.put("totalOutstanding", round(totalOutstanding));
        response.put("totalReturnValue", allReturns.stream()
                .mapToDouble(PurchaseReturn::getTotalReturnAmount).sum());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/debug-expiry")
    public ResponseEntity<?> debugExpiry() {
        List<Medicine> all = medicineRepository.findAll();
        LocalDate today = LocalDate.now();
        List<Map<String, Object>> result = new ArrayList<>();

        for (Medicine med : all) {
            Map<String, Object> info = new HashMap<>();
            info.put("name", med.getName());
            info.put("stock", med.getStockQuantity());
            info.put("costPrice", med.getCostPrice());
            info.put("expiryRawValue", med.getExpiryDate());
            info.put("expiryType", med.getExpiryDate() != null ? med.getExpiryDate().getClass().getName() : "NULL");
            info.put("today", today.toString());
            result.add(info);
        }
        return ResponseEntity.ok(result);
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}