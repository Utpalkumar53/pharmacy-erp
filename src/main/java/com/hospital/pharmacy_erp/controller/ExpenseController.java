package com.hospital.pharmacy_erp.controller;

import com.hospital.pharmacy_erp.entity.Expense;
import com.hospital.pharmacy_erp.repository.ExpenseRepository;
import com.hospital.pharmacy_erp.service.FinanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/expenses")
public class ExpenseController {

    @Autowired
    private ExpenseRepository expenseRepository; // Direct use for simplicity, or use an ExpenseService

    @GetMapping
    public ResponseEntity<List<Expense>> getAllExpenses() {
        return ResponseEntity.ok(expenseRepository.findAll());
    }

    @PostMapping
    public ResponseEntity<Expense> addExpense(@RequestBody Expense expense) {
        expense.setExpenseDate(LocalDateTime.now());
        // Get current admin user from security context
        String admin = SecurityContextHolder.getContext().getAuthentication().getName();
        expense.setAddedBy(admin);

        Expense saved = expenseRepository.save(expense);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteExpense(@PathVariable String id) {
        expenseRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/monthly-total")
    public ResponseEntity<Double> getMonthlyTotal(
            @RequestParam int month,
            @RequestParam int year) {
        double total = expenseRepository.findAll().stream()
                .filter(e -> e.getExpenseDate() != null &&
                        e.getExpenseDate().getMonthValue() == month &&
                        e.getExpenseDate().getYear() == year)
                .mapToDouble(Expense::getAmount).sum();
        return ResponseEntity.ok(Math.round(total * 100.0) / 100.0);
    }
}
