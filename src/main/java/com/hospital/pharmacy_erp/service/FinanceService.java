package com.hospital.pharmacy_erp.service;

import com.hospital.pharmacy_erp.entity.*;
import com.hospital.pharmacy_erp.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Service
public class FinanceService {

    @Autowired private SaleRepository saleRepository;
    @Autowired private PurchaseOrderRepository purchaseOrderRepository;
    @Autowired private ExpenseRepository expenseRepository;

    public double getDailyCashPosition(LocalDate date) {
        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.atTime(LocalTime.MAX);

        // 1. Sales today
        double totalSales = saleRepository.findAll().stream()
                .filter(s -> s.getSaleDate() != null &&
                        s.getSaleDate().isAfter(startOfDay) &&
                        s.getSaleDate().isBefore(endOfDay))
                .mapToDouble(Sale::getTotalAmount).sum(); // Using TotalAmount (incl. tax)

        // 2. Purchases today (Fixed the variable name error here)
        List<PurchaseOrder> dailyPurchases = purchaseOrderRepository.findAll().stream()
                .filter(p -> p.getPurchaseDate() != null &&
                        p.getPurchaseDate().isAfter(startOfDay) &&
                        p.getPurchaseDate().isBefore(endOfDay))
                .toList();

        // FIXED: Changed monthlyPurchases to dailyPurchases
        double totalPurchases = dailyPurchases.stream()
                .mapToDouble(PurchaseOrder::getTotalBillAmount).sum();

        // 3. Expenses today
        double totalExpenses = expenseRepository.findAll().stream()
                .filter(e -> e.getExpenseDate() != null &&
                        e.getExpenseDate().isAfter(startOfDay) &&
                        e.getExpenseDate().isBefore(endOfDay))
                .mapToDouble(Expense::getAmount).sum();

        // Ledger: What came in - What went out
        return round(totalSales - (totalPurchases + totalExpenses));
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}