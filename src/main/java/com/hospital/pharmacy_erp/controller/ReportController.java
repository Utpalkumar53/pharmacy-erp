package com.hospital.pharmacy_erp.controller;

import com.hospital.pharmacy_erp.dto.GstReport;
import com.hospital.pharmacy_erp.service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    @Autowired
    private ReportService reportService;

    // 1. General Monthly Financial Report
    @GetMapping("/monthly-summary")
    public Map<String, Double> getSummary(@RequestParam int month, @RequestParam int year) {
        return reportService.getMonthlyReport(month, year);
    }

    // 2. Item-specific Sales Count
    // URL: /api/reports/item-sales/69e7c4...?month=4&year=2026
    @GetMapping("/item-sales/{medicineId}")
    public int getItemSales(@PathVariable String medicineId,
                            @RequestParam int month,
                            @RequestParam int year) {
        return reportService.getItemSalesCount(medicineId, month, year);
    }

    @GetMapping("/gst-summary")
    public ResponseEntity<GstReport> getGstReport(
            @RequestParam int month,
            @RequestParam int year) {
        return ResponseEntity.ok(reportService.generateGstReport(month, year));
    }
}