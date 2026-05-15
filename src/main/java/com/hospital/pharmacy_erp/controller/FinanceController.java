package com.hospital.pharmacy_erp.controller;

import com.hospital.pharmacy_erp.service.FinanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/finance")
@CrossOrigin(origins = "http://localhost:3000")
public class FinanceController {

    @Autowired
    private FinanceService financeService;

    @GetMapping("/daily-cash")
    public ResponseEntity<Double> getDailyCash(
            @RequestParam("date")
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(financeService.getDailyCashPosition(date));
    }

    @GetMapping("/monthly-overview")
    public ResponseEntity<?> getMonthlyOverview() {
        return ResponseEntity.ok(financeService.getMonthlyFinancialOverview());
    }

    // P&L for specific month/year
    @GetMapping("/profit-loss")
    public ResponseEntity<?> getProfitLoss(
            @RequestParam int month,
            @RequestParam int year) {
        return ResponseEntity.ok(financeService.getProfitAndLoss(month, year));
    }

    // Daily cash book for full month
    @GetMapping("/cash-book")
    public ResponseEntity<?> getCashBook(
            @RequestParam int month,
            @RequestParam int year) {
        return ResponseEntity.ok(financeService.getMonthlyCashBook(month, year));
    }
}