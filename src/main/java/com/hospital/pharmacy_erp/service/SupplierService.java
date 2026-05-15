package com.hospital.pharmacy_erp.service;

import com.hospital.pharmacy_erp.entity.Supplier;
import com.hospital.pharmacy_erp.repository.SupplierRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SupplierService {

    @Autowired
    private SupplierRepository supplierRepository;

    public Supplier saveSupplier(Supplier supplier) {
        return supplierRepository.save(supplier);
    }

    public List<Supplier> getAllSuppliers() {
        return supplierRepository.findAll();
    }

    public boolean deleteSupplier(String id) {
        if (supplierRepository.existsById(id)) {
            supplierRepository.deleteById(id);
            return true;
        }
        return false; // Tells the Controller that nothing was found to delete
    }

    // Inside SupplierService.java

    public Supplier getOrCreateSupplierByName(String name) {
        return supplierRepository.findAll().stream()
                .filter(s -> s.getName().equalsIgnoreCase(name))
                .findFirst()
                .orElseGet(() -> {
                    // If supplier doesn't exist, create a new "Loose" profile
                    Supplier newSup = new Supplier();
                    newSup.setName(name);
                    newSup.setContactPhone("N/A"); // Father can edit this later in Supplier screen
                    newSup.setEmail("N/A");
                    return supplierRepository.save(newSup);
                });
    }
}
