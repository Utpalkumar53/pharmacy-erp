package com.hospital.pharmacy_erp.controller;

import com.hospital.pharmacy_erp.entity.Sale;
import com.hospital.pharmacy_erp.entity.SaleItem;
import com.hospital.pharmacy_erp.repository.SaleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/analytics")
@CrossOrigin(origins = "http://localhost:3000")
public class AnalyticsController {

    @Autowired
    private SaleRepository saleRepository;

    @GetMapping("/revenue-weekly")
    public ResponseEntity<List<Map<String, Object>>> getWeeklyRevenue() {
        List<Sale> sales = saleRepository.findAll();
        Map<String, Double> revenueByDate = new TreeMap<>(); // Sorted by date

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd MMM");

        // Group revenue by day
        for (Sale sale : sales) {
            if (sale.getSaleDate() != null) {
                String formattedDate = sale.getSaleDate().format(formatter);
                revenueByDate.put(formattedDate,
                        revenueByDate.getOrDefault(formattedDate, 0.0) + sale.getTotalAmount());
            }
        }

        List<Map<String, Object>> result = new ArrayList<>();
        revenueByDate.forEach((date, total) -> {
            Map<String, Object> map = new HashMap<>();
            map.put("date", date);
            map.put("revenue", total);
            result.add(map);
        });

        // Return last 7 days of sales
        if (result.size() > 7) {
            return ResponseEntity.ok(result.subList(result.size() - 7, result.size()));
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/top-medicines")
    public ResponseEntity<List<Map<String, Object>>> getTopMedicines() {
        List<Sale> sales = saleRepository.findAll();
        Map<String, Integer> productCounts = new HashMap<>();

        // Count quantities sold for each product
        for (Sale sale : sales) {
            if (sale.getSaleItems() != null) {
                for (SaleItem item : sale.getSaleItems()) {
                    productCounts.put(item.getMedicineName(),
                            productCounts.getOrDefault(item.getMedicineName(), 0) + item.getQuantity());
                }
            }
        }

        // Sort and get top 5 products
        List<Map<String, Object>> result = productCounts.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .limit(5)
                .map(entry -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("name", entry.getKey());
                    map.put("sales", entry.getValue());
                    return map;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }
}