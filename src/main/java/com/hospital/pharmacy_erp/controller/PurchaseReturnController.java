package com.hospital.pharmacy_erp.controller;

import com.hospital.pharmacy_erp.entity.PurchaseReturn;
import com.hospital.pharmacy_erp.service.PurchaseReturnService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/returns")
@CrossOrigin(origins = "http://localhost:3000")
public class PurchaseReturnController {

    @Autowired
    private PurchaseReturnService returnService;

    @PostMapping("/process")
    public ResponseEntity<PurchaseReturn> processReturn(@RequestBody PurchaseReturn returnOrder) {
        return ResponseEntity.ok(returnService.processReturn(returnOrder));
    }

    @GetMapping("/history")
    public ResponseEntity<List<PurchaseReturn>> getReturnHistory() {
        // Note: You'll need to add 'getAllReturns' or similar to your PurchaseReturnService
        return ResponseEntity.ok(returnService.getAllReturns());
    }
}