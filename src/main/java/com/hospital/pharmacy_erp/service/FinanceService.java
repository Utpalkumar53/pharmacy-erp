package com.hospital.pharmacy_erp.service;

import com.hospital.pharmacy_erp.entity.Expense;
import com.hospital.pharmacy_erp.entity.PurchaseOrder;
import com.hospital.pharmacy_erp.entity.Sale;
import com.hospital.pharmacy_erp.repository.ExpenseRepository;
import com.hospital.pharmacy_erp.repository.PurchaseOrderRepository;
import com.hospital.pharmacy_erp.repository.SaleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Service
public class FinanceService {

    @Autowired
    private SaleRepository saleRepository;

    @Autowired
    private PurchaseOrderRepository purchaseOrderRepository;

    @Autowired
    private ExpenseRepository expenseRepository;

    public double getDailyCashPosition(LocalDate date) {
        // Define the start and end of the day
        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.atTime(LocalTime.MAX);

        // 1. Get all sales for today and sum them up
        List<Sale> dailySales = saleRepository.findAll().stream()
                .filter(s -> s.getSaleDate() != null &&
                        s.getSaleDate().isAfter(startOfDay) &&
                        s.getSaleDate().isBefore(endOfDay))
                .toList();
        double totalSales = dailySales.stream().mapToDouble(Sale::getSubTotalAmount).sum();

        // 2. Get all purchases for today and sum them up
        // Note: Check your PurchaseOrder entity for the date field name (purchaseDate or orderDate)
        List<PurchaseOrder> dailyPurchases = purchaseOrderRepository.findAll().stream()
                .filter(p -> p.getPurchaseDate() != null &&
                        p.getPurchaseDate().
                        isAfter(startOfDay) &&
                        p.getPurchaseDate()
                        .isBefore(endOfDay))
                .toList();
        double totalPurchases = dailyPurchases.stream()
                .mapToDouble(p -> p.getQuantityPurchased() * p.getUnitCostPrice())
                .sum();

        //3 Tota Expense of day mislenious
        double totalExpenses = expenseRepository.findAll().stream()
                .filter(e -> e.getExpenseDate() != null &&
                                    e.getExpenseDate() != null &&
                                    e.getExpenseDate().isAfter(startOfDay) &&
                                    e.getExpenseDate().isBefore(endOfDay))
                .mapToDouble(Expense::getAmount).sum();

        // Ledger Formula: Sales - (Purchases + Expenses)
        return totalSales - (totalPurchases + totalExpenses);
    }
}