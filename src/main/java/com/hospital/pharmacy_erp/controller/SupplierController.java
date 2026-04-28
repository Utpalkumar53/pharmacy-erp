package com.hospital.pharmacy_erp.controller;

import com.hospital.pharmacy_erp.entity.Supplier;
import com.hospital.pharmacy_erp.service.SupplierService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/suppliers")
public class SupplierController {

    @Autowired
    private SupplierService supplierService;

    @GetMapping
    public ResponseEntity<List<Supplier>> getAllSuppliers() {
        List<Supplier> supplierList = supplierService.getAllSuppliers();
        return new ResponseEntity<>(supplierList, HttpStatus.OK);
    }

    @PostMapping
    public ResponseEntity<Supplier> saveSupplier(@RequestBody Supplier supplier) {
        Supplier savedSupplier = supplierService.saveSupplier(supplier);
        return new ResponseEntity<>(savedSupplier, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Supplier> updateSupplier(@PathVariable String id, @RequestBody Supplier supplier) {
        List<Supplier> all = supplierService.getAllSuppliers();
        supplier.setId(id);
        Supplier updatedSupplier = supplierService.saveSupplier(supplier);
        return new ResponseEntity<>(updatedSupplier, HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteSupplier(@PathVariable String id) {
        boolean isDeleted = supplierService.deleteSupplier(id);
        if (isDeleted) {
            return new ResponseEntity<>("Supplier deleted successfully",HttpStatus.NO_CONTENT);
        }else  {
            return new ResponseEntity<>("Supplier Not Found",HttpStatus.NOT_FOUND);
        }
    }
}
