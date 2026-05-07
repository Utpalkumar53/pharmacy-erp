package com.hospital.pharmacy_erp.controller;

import com.hospital.pharmacy_erp.entity.SaleReturn;
import com.hospital.pharmacy_erp.entity.ReturnItem;
import com.hospital.pharmacy_erp.repository.SaleReturnRepository;
import com.hospital.pharmacy_erp.service.SaleReturnService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/returns")
public class SaleReturnController {

    @Autowired
    private SaleReturnService returnService;
    @Autowired
    private SaleReturnRepository returnRepository;

    @PostMapping("/process/{saleId}")
    public SaleReturn createReturn(
            @PathVariable String saleId,
            @RequestBody List<ReturnItem> items,
            @RequestParam String reason,
            @RequestParam String pharmacist) {

        return returnService.processReturn(saleId, items, reason, pharmacist);
    }

    // SaleReturnController.java
    @GetMapping("/sale-returns")
    public ResponseEntity<List<SaleReturn>> getAllReturns() {
        return ResponseEntity.ok(returnRepository.findAll(Sort.by(Sort.Direction.DESC, "returnDate")));
    }
}