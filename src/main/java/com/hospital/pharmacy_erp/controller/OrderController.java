package com.hospital.pharmacy_erp.controller;

import com.hospital.pharmacy_erp.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "http://localhost:3000")
public class OrderController {

    @Autowired
    private OrderService orderService;

    @GetMapping("/prepare/{medicineId}")
    public ResponseEntity<?> prepareOrder(@PathVariable String medicineId) {
        try {
            return ResponseEntity.ok(orderService.prepareOrderData(medicineId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}