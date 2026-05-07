package com.hospital.pharmacy_erp.controller;

import com.hospital.pharmacy_erp.entity.StockTransaction;
import com.hospital.pharmacy_erp.service.TransactionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/transactions")
@CrossOrigin(origins = "http://localhost:3000")
public class TransactionController {

    @Autowired
    private TransactionService transactionService;

    @GetMapping
    public ResponseEntity<List<StockTransaction>> getHistory() {
        return ResponseEntity.ok(transactionService.getAllTransactions());
    }
}