package com.hospital.pharmacy_erp.controller;

import com.hospital.pharmacy_erp.entity.PurchaseOrder;
import com.hospital.pharmacy_erp.service.PurchaseOrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/purchases")
@CrossOrigin(origins = "http://localhost:3000")
public class PurchaseController {

    @Autowired
    private PurchaseOrderService purchaseOrderService;

    // ✅ Matches frontend save handler (React calls: api.post('/purchases/receive'))
    @PostMapping("/receive")
    public ResponseEntity<PurchaseOrder> createPurchaseOrder(@RequestBody PurchaseOrder purchaseOrder){
        PurchaseOrder purchaseOrders = purchaseOrderService.saveOrder(purchaseOrder);
        return new ResponseEntity<>(purchaseOrders, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<PurchaseOrder>> getAllOrders() {
        return ResponseEntity.ok(purchaseOrderService.getAllOrders());
    }

    // ✅ Matches PurchaseHistory fetch handler (React calls: api.get('/purchases/history'))
    @GetMapping("/history")
    public ResponseEntity<List<PurchaseOrder>> getPurchaseHistory() {
        return ResponseEntity.ok(purchaseOrderService.getAllOrders());
    }
}