package com.hospital.pharmacy_erp.controller;

import com.hospital.pharmacy_erp.entity.Medicine;
import com.hospital.pharmacy_erp.service.MedicineService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/medicines")
@CrossOrigin(origins = "http://localhost:3000")
@Validated
public class MedicineController {

    @Autowired
    private MedicineService medicineService;

    @GetMapping
    public ResponseEntity<List<Medicine>> getAllMedicines(@RequestParam(required = false) String search) {
        // Check if the search parameter exists in the URL (e.g., /api/medicines?search=azi)
        if (search != null && !search.isEmpty()) {
            return ResponseEntity.ok(medicineService.searchMedicines(search));
        }
        // Otherwise, return everything as usual
        return new ResponseEntity<>(medicineService.getAll(), HttpStatus.OK);
    }

    @PostMapping("/bulk")
    public ResponseEntity<List<Medicine>> addBulk(@Valid @RequestBody List<Medicine> medicines) {
        // FIXED: Only call the service once
        List<Medicine> savedMedicines = medicineService.addBulkMedicines(medicines);
        return ResponseEntity.ok(savedMedicines);
    }

    @PostMapping
    public ResponseEntity<Medicine> saveMedicine(@Valid @RequestBody Medicine medicine) {
        // FIXED: Only call the service once
        Medicine savedMedicine = medicineService.saveMedicine(medicine);
        return new ResponseEntity<>(savedMedicine, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Medicine> updateMedicine(@PathVariable String id, @RequestBody Medicine details) {
        Medicine updated = medicineService.updateMedicine(id, details);
        return new ResponseEntity<>(updated, HttpStatus.OK);
    }

    // Inside MedicineController.java

    @GetMapping("/check-batch")
    public ResponseEntity<Medicine> checkBatch(
            @RequestParam String name,
            @RequestParam String batchNo) {

        // Calls the method you just added to MedicineService
        Medicine medicine = medicineService.findByNameAndBatch(name, batchNo);

        if (medicine != null) {
            return ResponseEntity.ok(medicine);
        }
        return ResponseEntity.noContent().build(); // Returns 204 if batch doesn't exist
    }

    @PutMapping("/bulk-update-by-name")
    public ResponseEntity<Map<String, String>> bulkUpdateByName(
            @RequestParam String name,
            @RequestParam(required = false) Double newPrice,
            @RequestParam(required = false) Integer newGst) {

        medicineService.updateBulkDetailsByName(name, newPrice, newGst);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Successfully updated all batches of " + name);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/low-stock")
    public ResponseEntity<List<Medicine>> getLowStockMedicines() {
        // Setting threshold to 10 for low stock alerts
        return new ResponseEntity<>(medicineService.getLowStockItems(10), HttpStatus.OK);
    }

    @GetMapping("/suggest-batches")
    public ResponseEntity<List<Medicine>> suggestBatches(
            @RequestParam String name,
            @RequestParam(defaultValue = "false") boolean override) {

        // This calls the "Smart Selection" logic we added to the Service
        List<Medicine> suggestions = medicineService.getSmartBatchSelection(name, override);
        return ResponseEntity.ok(suggestions);
    }

    @GetMapping("/near-expiry")
    public ResponseEntity<List<Medicine>> getNearExpiry(@RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(medicineService.getNearExpiryMedicines(days));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteMedicine(@PathVariable String id) {
        medicineService.deleteMedicine(id);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Medicine deleted successfully");
        return new ResponseEntity<>(response, HttpStatus.OK);
    }
}