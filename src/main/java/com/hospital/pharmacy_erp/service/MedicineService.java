package com.hospital.pharmacy_erp.service;

import com.hospital.pharmacy_erp.entity.ActivityLog;
import com.hospital.pharmacy_erp.entity.Medicine;
import com.hospital.pharmacy_erp.repository.MedicineRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class MedicineService {

    @Autowired
    private MedicineRepository medicineRepository;
    @Autowired
    private AuditService auditService;
//    @Autowired
//    private AuditService auditService;

    // Save or Update
    public Medicine saveMedicine(Medicine medicine) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        if (medicine.getId() != null && medicineRepository.existsById(medicine.getId())) {
            Medicine updatedMedicine = medicineRepository.save(medicine);
//            auditService.log(currentUser,"UPDATED_MEDICINE","Updated details for medicine "+updatedMedicine.getName()); //WE DOIT VIA ASPECT
            return updatedMedicine;
        } else {
            Medicine savedMedicine = medicineRepository.save(medicine);
//            auditService.log(currentUser, "ADD_MEDICINE", "Added/Updated: " + savedMedicine.getName());
            return savedMedicine;
        }
    }

    public Medicine updateMedicine(String id, Medicine medicineDetails) {
        // 1. Fetch the REAL existing record by the URL ID
        Medicine existingMedicine = medicineRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Medicine not found with ID: " + id));

        // 2. ONLY update the fields provided in the request
        // This preserves the ID, stockQuantity, and costPrice automatically
        existingMedicine.setName(medicineDetails.getName());
        existingMedicine.setExpiryDate(medicineDetails.getExpiryDate());
        existingMedicine.setBatchNo(medicineDetails.getBatchNo());

        // 3. Save the EXISTING object (which has the correct ID)
        return medicineRepository.save(existingMedicine);
    }

    public List<Medicine> addBulkMedicines(List<Medicine> medicines) {
        // Optional: Add logic here to check for duplicates by Name + BatchNo
        return medicineRepository.saveAll(medicines);
    }

    // Fetch all records
    public List<Medicine> getAll() {
        return medicineRepository.findAll();
    }

    // Delete logic
    public void deleteMedicine(String id) {
        Medicine medicine = medicineRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Medicine not found with ID: " + id));

        medicineRepository.delete(medicine);

        // Get current user from Security Context
        String currentUser = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication().getName();

        // HANDLE ERROR: Only call auditService if it is NOT NULL
        if (auditService != null) {
            auditService.log(currentUser, "DELETE_MEDICINE", "Deleted medicine: " + medicine.getName());
        } else {
            // Fallback: Log to console so you still have a record during development
            System.out.println("AUDIT LOG (Local): User [" + currentUser + "] deleted " + medicine.getName());
        }
    }

    // DSA Practice: Using Streams to find low stock
    public List<Medicine> getLowStockItems(int threshold) {
        List<Medicine> allMedicines = medicineRepository.findAll();
        return allMedicines.stream()
                .filter(m -> m.getStockQuantity() <= threshold)
                .toList();
    }

    // Expiry Alert
    public List<Medicine> getNearExpiryMedicines(int days) {
        LocalDate limitDate = LocalDate.now().plusDays(days); // find medicine expiring b/w today and the next X days
        return medicineRepository.findAll().stream().filter(m -> m.getExpiryDate() != null &&
                        m.getExpiryDate().isAfter(LocalDate.now()) &&
                        m.getExpiryDate().isBefore(limitDate))
                .toList();
    }
}