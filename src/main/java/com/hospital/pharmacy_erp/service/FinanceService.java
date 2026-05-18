package com.hospital.pharmacy_erp.service;

import com.hospital.pharmacy_erp.entity.*;
import com.hospital.pharmacy_erp.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class FinanceService {

    @Autowired private SaleRepository saleRepository;
    @Autowired private PurchaseOrderRepository purchaseOrderRepository;
    @Autowired private ExpenseRepository expenseRepository;
    @Autowired private MedicineRepository medicineRepository;
    @Autowired private CustomerRepository customerRepository;
    @Autowired private PurchaseReturnRepository purchaseReturnRepository;

    // BUSINESS PROFIT & SAVINGS (Monthly)
    public Map<String, Double> getMonthlyFinancialOverview() {
        LocalDateTime firstDayOfMonth = LocalDate.now().withDayOfMonth(1).atStartOfDay();

        // 1. Gross Profit Calculation
        double totalGrossProfit = saleRepository.findAll().stream()
                .filter(s -> s.getSaleDate() != null && s.getSaleDate().isBefore(firstDayOfMonth))
                .flatMap(s -> s.getSaleItems().stream())
                .mapToDouble(item -> {
                    Medicine med = medicineRepository.findById(item.getMedicineId()).orElse(null);
                    double cost = (med != null) ? med.getCostPrice() : 0;
                    return (item.getUnitPrice() - cost) * item.getQuantity();
                }).sum();

        // 2. Total Shop Expenses
        double totalExpenses = expenseRepository.findAll().stream()
                .filter(e -> e.getExpenseDate() != null && e.getExpenseDate().isBefore(firstDayOfMonth))
                .mapToDouble(Expense::getAmount).sum();

        Map<String, Double> overview = new HashMap<>();
        overview.put("monthlyGrossProfit", round(totalGrossProfit));
        overview.put("monthlyExpenses", round(totalExpenses));
        overview.put("netSavings", round(totalGrossProfit - totalExpenses));
        return overview;
    }

    // GST INTELLIGENCE (For CA Report)
    public Map<String, Double> getGSTReport() {
        // Safe parsing of tax field
        double outputTax = saleRepository.findAll().stream()
                .mapToDouble(s -> {
                    Object tax = s.getTotalTax();
                    if (tax == null) return 0.0;
                    if (tax instanceof Number) return ((Number) tax).doubleValue();
                    try {
                        return Double.parseDouble(tax.toString());
                    } catch (Exception e) { return 0.0; }
                }).sum();

        double inputTaxCredit = purchaseOrderRepository.findAll().stream()
                .mapToDouble(PurchaseOrder::getTotalInputTax).sum();

        Map<String, Double> gstData = new HashMap<>();
        gstData.put("outputTax", round(outputTax));
        gstData.put("inputTaxCredit", round(inputTaxCredit));
        gstData.put("netGstPayable", round(outputTax - inputTaxCredit));
        return gstData;
    }


    // ... existing autowired repositories ...

    /**
     * Calculates the daily cash position: (Sales) - (Purchases + Expenses) for a specific date.
     */
    public double getDailyCashPosition(LocalDate date) {
        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.atTime(LocalTime.MAX);

        // 1. Sales today
        double totalSales = saleRepository.findAll().stream()
                .filter(s -> s.getSaleDate() != null &&
                        s.getSaleDate().isAfter(startOfDay) &&
                        s.getSaleDate().isBefore(endOfDay))
                .mapToDouble(Sale::getTotalAmount).sum();

        // 2. Purchases today
        double totalPurchases = purchaseOrderRepository.findAll().stream()
                .filter(p -> p.getPurchaseDate() != null &&
                        p.getPurchaseDate().isAfter(startOfDay) &&
                        p.getPurchaseDate().isBefore(endOfDay))
                .mapToDouble(PurchaseOrder::getTotalBillAmount).sum();

        // 3. Expenses today
        double totalExpenses = expenseRepository.findAll().stream()
                .filter(e -> e.getExpenseDate() != null &&
                        e.getExpenseDate().isAfter(startOfDay) &&
                        e.getExpenseDate().isBefore(endOfDay))
                .mapToDouble(Expense::getAmount).sum();

        // Final Ledger: Cash In - Cash Out
        return round(totalSales - (totalPurchases + totalExpenses));
    }

    // P&L for a specific month and year
    public Map<String, Double> getProfitAndLoss(int month, int year) {
        // Sales revenue
        double totalRevenue = saleRepository.findAll().stream()
                .filter(s -> s.getSaleDate() != null &&
                        s.getSaleDate().getMonthValue() == month &&
                        s.getSaleDate().getYear() == year)
                .mapToDouble(Sale::getTotalAmount).sum();

        // Cost of goods sold
        double totalCOGS = saleRepository.findAll().stream()
                .filter(s -> s.getSaleDate() != null &&
                        s.getSaleDate().getMonthValue() == month &&
                        s.getSaleDate().getYear() == year)
                .flatMap(s -> s.getSaleItems().stream())
                .mapToDouble(item -> {
                    Medicine med = medicineRepository.findById(item.getMedicineId()).orElse(null);
                    double cost = (med != null) ? med.getCostPrice() : 0;
                    return cost * item.getQuantity();
                }).sum();

        // Total purchases this month
        double totalPurchases = purchaseOrderRepository.findAll().stream()
                .filter(p -> p.getPurchaseDate() != null &&
                        p.getPurchaseDate().getMonthValue() == month &&
                        p.getPurchaseDate().getYear() == year)
                .mapToDouble(PurchaseOrder::getTotalBillAmount).sum();

        // Total expenses this month
        double totalExpenses = expenseRepository.findAll().stream()
                .filter(e -> e.getExpenseDate() != null &&
                        e.getExpenseDate().getMonthValue() == month &&
                        e.getExpenseDate().getYear() == year)
                .mapToDouble(Expense::getAmount).sum();

        // GST collected
        double totalGst = saleRepository.findAll().stream()
                .filter(s -> s.getSaleDate() != null &&
                        s.getSaleDate().getMonthValue() == month &&
                        s.getSaleDate().getYear() == year)
                .mapToDouble(s -> {
                    Object tax = s.getTotalTax();
                    if (tax == null) return 0.0;
                    if (tax instanceof Number) return ((Number) tax).doubleValue();
                    try { return Double.parseDouble(tax.toString()); }
                    catch (Exception e) { return 0.0; }
                }).sum();

        double grossProfit = totalRevenue - totalCOGS;
        double netProfit   = grossProfit - totalExpenses;

        Map<String, Double> pl = new HashMap<>();
        pl.put("totalRevenue",   round(totalRevenue));
        pl.put("totalCOGS",      round(totalCOGS));
        pl.put("grossProfit",    round(grossProfit));
        pl.put("totalExpenses",  round(totalExpenses));
        pl.put("totalPurchases", round(totalPurchases));
        pl.put("totalGst",       round(totalGst));
        pl.put("netProfit",      round(netProfit));
        pl.put("profitMargin",   totalRevenue > 0 ? round((grossProfit / totalRevenue) * 100) : 0.0);

        // Outstanding balance
        double totalOutstanding = customerRepository.findAll().stream()
                .mapToDouble(Customer::getOutstandingBalance)
                .sum();
        pl.put("totalOutstanding", round(totalOutstanding));

        return pl;
    }

    // Daily cash book for entire month
    public List<Map<String, Object>> getMonthlyCashBook(int month, int year) {
        List<Map<String, Object>> cashBook = new ArrayList<>();

        // Get all days in the month
        LocalDate start = LocalDate.of(year, month, 1);
        LocalDate end   = start.withDayOfMonth(start.lengthOfMonth());

        for (LocalDate date = start; !date.isAfter(end); date = date.plusDays(1)) {
            LocalDateTime startOfDay = date.atStartOfDay();
            LocalDateTime endOfDay   = date.atTime(LocalTime.MAX);

            double salesIn = saleRepository.findAll().stream()
                    .filter(s -> s.getSaleDate() != null &&
                            s.getSaleDate().isAfter(startOfDay) &&
                            s.getSaleDate().isBefore(endOfDay))
                    .mapToDouble(Sale::getTotalAmount).sum();

            double purchasesOut = purchaseOrderRepository.findAll().stream()
                    .filter(p -> p.getPurchaseDate() != null &&
                            p.getPurchaseDate().isAfter(startOfDay) &&
                            p.getPurchaseDate().isBefore(endOfDay))
                    .mapToDouble(PurchaseOrder::getTotalBillAmount).sum();

            double expensesOut = expenseRepository.findAll().stream()
                    .filter(e -> e.getExpenseDate() != null &&
                            e.getExpenseDate().isAfter(startOfDay) &&
                            e.getExpenseDate().isBefore(endOfDay))
                    .mapToDouble(Expense::getAmount).sum();

            // Only include days that had activity
            if (salesIn > 0 || purchasesOut > 0 || expensesOut > 0) {
                Map<String, Object> dayEntry = new HashMap<>();
                dayEntry.put("date",        date.toString());
                dayEntry.put("salesIn",     round(salesIn));
                dayEntry.put("purchasesOut",round(purchasesOut));
                dayEntry.put("expensesOut", round(expensesOut));
                dayEntry.put("netCash",     round(salesIn - purchasesOut - expensesOut));
                cashBook.add(dayEntry);
            }
        }
        return cashBook;
    }

    public Map<String, Object> getBalanceSheet() {
        LocalDate today = LocalDate.now();

        // ── ASSETS ────────────────────────────────────────────────────────────

        // 1. Inventory value (all medicines in stock × cost price)
        double inventoryValue = medicineRepository.findAll().stream()
                .filter(m -> m.getStockQuantity() > 0)
                .mapToDouble(m -> {
                    double price = m.getCostPrice() > 0 ? m.getCostPrice() : m.getMrp();
                    return price * m.getStockQuantity();
                }).sum();

        // 2. Customer receivables (udhaar outstanding)
        double customerReceivables = customerRepository.findAll().stream()
                .mapToDouble(Customer::getOutstandingBalance).sum();

        // 3. Total revenue collected (all time cash in)
        double totalRevenueCollected = saleRepository.findAll().stream()
                .filter(s -> !"CREDIT".equals(s.getPaymentMethod()))
                .mapToDouble(Sale::getTotalAmount).sum();

        // ── LIABILITIES ───────────────────────────────────────────────────────

        // 1. Total purchases (what was spent on stock)
        double totalPurchases = purchaseOrderRepository.findAll().stream()
                .mapToDouble(PurchaseOrder::getTotalBillAmount).sum();

        // 2. Total expenses (all time)
        double totalExpenses = expenseRepository.findAll().stream()
                .mapToDouble(Expense::getAmount).sum();

        // 3. GST payable (output - input)
        double outputGst = saleRepository.findAll().stream()
                .mapToDouble(s -> {
                    Object tax = s.getTotalTax();
                    if (tax == null) return 0.0;
                    if (tax instanceof Number) return ((Number) tax).doubleValue();
                    try { return Double.parseDouble(tax.toString()); }
                    catch (Exception e) { return 0.0; }
                }).sum();
        double inputGst = purchaseOrderRepository.findAll().stream()
                .mapToDouble(PurchaseOrder::getTotalInputTax).sum();
        double netGstPayable = Math.max(0, outputGst - inputGst);

        // 4. Supplier returns received value
        double supplierReturnValue = purchaseReturnRepository.findAll().stream()
                .mapToDouble(PurchaseReturn::getTotalReturnAmount).sum();

        // ── TOTALS ────────────────────────────────────────────────────────────
        double totalAssets      = round(inventoryValue + customerReceivables + totalRevenueCollected);
        double totalLiabilities = round(totalPurchases + totalExpenses + netGstPayable);
        double netWorth         = round(totalAssets - totalLiabilities);

        Map<String, Object> bs = new HashMap<>();

        // Assets
        bs.put("inventoryValue",        round(inventoryValue));
        bs.put("customerReceivables",   round(customerReceivables));
        bs.put("totalRevenueCollected", round(totalRevenueCollected));
        bs.put("totalAssets",           totalAssets);

        // Liabilities
        bs.put("totalPurchases",        round(totalPurchases));
        bs.put("totalExpenses",         round(totalExpenses));
        bs.put("netGstPayable",         round(netGstPayable));
        bs.put("supplierReturnValue",   round(supplierReturnValue));
        bs.put("totalLiabilities",      totalLiabilities);

        // Net
        bs.put("netWorth",              netWorth);
        bs.put("asOfDate",              today.toString());

        return bs;
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

}