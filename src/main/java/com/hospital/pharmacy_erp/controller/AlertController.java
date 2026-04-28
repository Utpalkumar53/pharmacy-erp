package com.hospital.pharmacy_erp.controller;

import com.hospital.pharmacy_erp.entity.Medicine;
import com.hospital.pharmacy_erp.service.MedicineService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/alerts")
public class AlertController {

    @Autowired
    private MedicineService medicineService;

    @GetMapping("/low-stock")
    public ResponseEntity<List<Medicine>> getLowStockMedicines(int threshold) {
        List<Medicine> list = medicineService.getLowStockItems(threshold);
        return new ResponseEntity<>(HttpStatus.OK);
    }

    @GetMapping("/near-expiry")
    public ResponseEntity<List<Medicine>> getNearExpiryMedicines(int days) {
        List<Medicine> list = medicineService.getNearExpiryMedicines(days);
        return new ResponseEntity<>(HttpStatus.OK);
    }
}
