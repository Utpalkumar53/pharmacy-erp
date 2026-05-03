package com.hospital.pharmacy_erp.controller;

import com.hospital.pharmacy_erp.entity.Medicine;
import com.hospital.pharmacy_erp.service.MedicineService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/alerts")
public class AlertController {

    @Autowired
    private MedicineService medicineService;

    @GetMapping("/low-stock")
    public ResponseEntity<List<Medicine>> getLowStockMedicines(
            @RequestParam(defaultValue = "20") int threshold) {
        List<Medicine> list = medicineService.getLowStockItems(threshold);
        return new ResponseEntity<>(list, HttpStatus.OK); // ✅ added list
    }

    @GetMapping("/near-expiry")
    public ResponseEntity<List<Medicine>> getNearExpiryMedicines(
            @RequestParam(defaultValue = "30") int days) {
        List<Medicine> list = medicineService.getNearExpiryMedicines(days);
        return new ResponseEntity<>(list, HttpStatus.OK); // ✅ added list
    }
}