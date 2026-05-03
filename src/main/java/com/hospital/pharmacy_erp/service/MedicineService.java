package com.hospital.pharmacy_erp.service;

import com.hospital.pharmacy_erp.entity.Medicine;
import com.hospital.pharmacy_erp.repository.MedicineRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class MedicineService {

    @Autowired
    private MedicineRepository medicineRepository;

    @Autowired
    private AuditService auditService;

    // ✅ Save single medicine
    public Medicine saveMedicine(Medicine medicine) {
        return medicineRepository.save(medicine);
    }

    // ✅ Save bulk medicines
    public List<Medicine> addBulkMedicines(List<Medicine> medicines) {
        if (medicines == null || medicines.isEmpty()) {
            throw new RuntimeException("Cannot add an empty list of medicines");
        }
        return medicineRepository.saveAll(medicines);
    }

    // ✅ Updated logic to fix Stock and Price saving issues
    public Medicine updateMedicine(String id, Medicine medicineDetails) {
        Medicine existingMedicine = medicineRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Medicine not found with ID: " + id));

        // Update basic details
        existingMedicine.setName(medicineDetails.getName());
        existingMedicine.setBatchNo(medicineDetails.getBatchNo());
        existingMedicine.setExpiryDate(medicineDetails.getExpiryDate());

        // CRITICAL FIX: Adding the missing fields
        existingMedicine.setStockQuantity(medicineDetails.getStockQuantity());
        existingMedicine.setMrp(medicineDetails.getMrp());
        existingMedicine.setHsnCode(medicineDetails.getHsnCode());
        existingMedicine.setGstPercentage(medicineDetails.getGstPercentage());
        existingMedicine.setCostPrice(medicineDetails.getCostPrice());

        return medicineRepository.save(existingMedicine);
    }

    // ✅ Get all medicines
    public List<Medicine> getAll() {
        return medicineRepository.findAll();
    }

    // ✅ Delete medicine with audit log
    public void deleteMedicine(String id) {
        Medicine medicine = medicineRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(
                        "Medicine not found with ID: " + id));

        medicineRepository.delete(medicine);

        String currentUser = SecurityContextHolder.getContext()
                .getAuthentication().getName();
        if (auditService != null) {
            auditService.log(currentUser, "DELETE_MEDICINE",
                    "Deleted medicine: " + medicine.getName());
        }
    }

    // ✅ Low stock check
    public List<Medicine> getLowStockItems(int threshold) {
        return medicineRepository.findAll().stream()
                .filter(m -> m.getStockQuantity() <= threshold)
                .collect(Collectors.toList());
    }

    // ✅ SINGLE expiry method using java.util.Date
    // Removed duplicate getExpiringMedicines() which used Instant
    // getNearExpiryMedicines() and getExpiringMedicines() were doing
    // same thing — kept only one clean version
    public List<Medicine> getNearExpiryMedicines(int days) {
        Date today = new Date();
        Calendar cal = Calendar.getInstance();
        cal.setTime(today);
        cal.add(Calendar.DAY_OF_YEAR, days);
        Date futureDate = cal.getTime();

        return medicineRepository.findAll().stream()
                .filter(m -> m.getExpiryDate() != null)
                .filter(m -> m.getExpiryDate().after(today)
                        && m.getExpiryDate().before(futureDate))
                .collect(Collectors.toList());
    }

    // Inside MedicineService.java

    public List<Medicine> searchMedicines(String query) {
        if (query == null || query.isEmpty()) return new ArrayList<>();

        String lowerQuery = query.toLowerCase();
        return medicineRepository.findAll().stream()
                .filter(m -> (m.getName() != null && m.getName().toLowerCase().contains(lowerQuery)) ||
                        (m.getBatchNo() != null && m.getBatchNo().toLowerCase().contains(lowerQuery)))
                .collect(Collectors.toList());
    }

    // Add this method to MedicineService.java
    public Medicine findByNameAndBatch(String name, String batchNo) {
        return medicineRepository.findAll().stream()
                .filter(m -> m.getName().equalsIgnoreCase(name) && m.getBatchNo().equalsIgnoreCase(batchNo))
                .findFirst()
                .orElse(null);
    }

    // this will handle update by name
    // Inside MedicineService.java

    @Transactional // Ensures all updates happen or none do
    public void updatePriceByName(String name, double newMrp) {
        // Find every record that matches the name (Calpol, Azithromycin, etc.)
        List<Medicine> batches = medicineRepository.findAll().stream()
                .filter(m -> m.getName().equalsIgnoreCase(name))
                .collect(Collectors.toList());

        if (batches.isEmpty()) {
            throw new RuntimeException("No medicine found with name: " + name);
        }

        // Update the MRP for every single batch found
        for (Medicine med : batches) {
            med.setMrp(newMrp);
            medicineRepository.save(med);
        }
    }
    @Transactional
    public void updateBulkDetailsByName(String name, Double newMrp, Integer newGst) {
        List<Medicine> medicines = medicineRepository.findAll().stream()
                .filter(m -> m.getName().equalsIgnoreCase(name))
                .collect(Collectors.toList());

        for (Medicine med : medicines) {
            if (newMrp != null) med.setMrp(newMrp);
            if (newGst != null) med.setGstPercentage(newGst);
            medicineRepository.save(med);
        }
    }
}