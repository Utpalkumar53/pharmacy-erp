package com.hospital.pharmacy_erp.controller;

import com.hospital.pharmacy_erp.entity.Medicine;
import com.hospital.pharmacy_erp.repository.MedicineRepository;
import com.hospital.pharmacy_erp.service.MedicineService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/medicines")
@Validated
public class MedicineController {
    @Autowired
    private MedicineService medicineService;

    @GetMapping
    public ResponseEntity<List<Medicine>> getAllMedicines() {
        List<Medicine> list = medicineService.getAll();
        return new ResponseEntity<>(list, HttpStatus.OK);
    }

    @PostMapping("/bulk")
    public ResponseEntity<List<Medicine>> addBulk(@Valid @RequestBody List<Medicine> medicines) {
        List<Medicine> savedMedicines = medicineService.addBulkMedicines(medicines);
        return ResponseEntity.ok(medicineService.addBulkMedicines(medicines));
    }

    @PostMapping
    public ResponseEntity<Medicine> saveMedicine(@Valid @RequestBody Medicine medicine) {
        Medicine savedMedicine = medicineService.saveMedicine(medicine);
        return new ResponseEntity<>(medicineService.saveMedicine(medicine), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Medicine> updateMedicine(@RequestBody Medicine medicine) {
        Medicine updateed = medicineService.saveMedicine(medicine);
        return new ResponseEntity<>(updateed, HttpStatus.OK);
    }

    @GetMapping("/low-stock")
    public ResponseEntity<List<Medicine>> getLowStockMedicines() {
        List<Medicine> lowStock = medicineService.getLowStockItems(10);
        return new  ResponseEntity<>(lowStock, HttpStatus.OK);
    }
}
