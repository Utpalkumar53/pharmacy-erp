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

    @Autowired
    private TransactionService transactionService; // Injecting the Stock Ledger Service

    // ✅ Save single medicine (Auto-sets stock to 0 by default)
    public Medicine saveMedicine(Medicine medicine) {
        // Force initial catalog stock quantity to 0
        medicine.setStockQuantity(0);

        Medicine saved = medicineRepository.save(medicine);

        // Bypassed automatic PURCHASE_ADD ledger logging here.
        // Stock increases are now exclusively managed via Purchase Orders.
        return saved;
    }

    // ✅ Save bulk medicines (Auto-sets stock to 0 by default)
    public List<Medicine> addBulkMedicines(List<Medicine> medicines) {
        if (medicines == null || medicines.isEmpty()) {
            throw new RuntimeException("Cannot add an empty list of medicines");
        }

        // Force all bulk uploaded catalog items to start with 0 stock
        for (Medicine med : medicines) {
            med.setStockQuantity(0);
        }

        List<Medicine> savedList = medicineRepository.saveAll(medicines);

        // Bypassed bulk PURCHASE_ADD ledger logging.
        // Initial catalog entries are initialized cleanly with 0 stock.
        return savedList;
    }

    // ✅ Update medicine (Computes and Syncs Stock Difference & Handles Rack Number)
    public Medicine updateMedicine(String id, Medicine medicineDetails) {
        Medicine existingMedicine = medicineRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Medicine not found with ID: " + id));

        int oldStock = existingMedicine.getStockQuantity();
        int newStock = medicineDetails.getStockQuantity();
        int stockDifference = newStock - oldStock;

        // Update basic details
        existingMedicine.setName(medicineDetails.getName());
        existingMedicine.setBatchNo(medicineDetails.getBatchNo());
        existingMedicine.setExpiryDate(medicineDetails.getExpiryDate());

        // Update target details
        existingMedicine.setStockQuantity(newStock);
        existingMedicine.setMrp(medicineDetails.getMrp());
        existingMedicine.setHsnCode(medicineDetails.getHsnCode());
        existingMedicine.setGstPercentage(medicineDetails.getGstPercentage());
        existingMedicine.setCostPrice(medicineDetails.getCostPrice());
        existingMedicine.setRackLocation(medicineDetails.getRackLocation()); // ✅ Saved Rack Number
        existingMedicine.setCategory(medicineDetails.getCategory()); // ✅ Must exist

        Medicine updated = medicineRepository.save(existingMedicine);

        // If your father changed the physical box count (Manual Edit/Correction), log the change
        if (stockDifference != 0) {
            transactionService.logTransaction(
                    updated.getName(),
                    updated.getBatchNo(),
                    "STOCK_CORRECTION",
                    stockDifference, // Can be positive (found stock) or negative (damaged/lost)
                    newStock,
                    "MANUAL_EDIT"
            );
        }

        return updated;
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

        // Log to ledger that stock went down to absolute zero due to deletion
        transactionService.logTransaction(
                medicine.getName(),
                medicine.getBatchNo(),
                "MANUAL_DELETE",
                -medicine.getStockQuantity(),
                0,
                "ITEM_DELETED"
        );

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

    public List<Medicine> searchMedicines(String query) {
        if (query == null || query.isEmpty()) return new ArrayList<>();

        String lowerQuery = query.toLowerCase();
        return medicineRepository.findAll().stream()
                .filter(m -> (m.getName() != null && m.getName().toLowerCase().contains(lowerQuery)) ||
                        (m.getBatchNo() != null && m.getBatchNo().toLowerCase().contains(lowerQuery)))
                .collect(Collectors.toList());
    }

    public Medicine findByNameAndBatch(String name, String batchNo) {
        return medicineRepository.findAll().stream()
                .filter(m -> m.getName().equalsIgnoreCase(name) && m.getBatchNo().equalsIgnoreCase(batchNo))
                .findFirst()
                .orElse(null);
    }

    @Transactional
    public void updatePriceByName(String name, double newMrp) {
        List<Medicine> batches = medicineRepository.findAll().stream()
                .filter(m -> m.getName().equalsIgnoreCase(name))
                .collect(Collectors.toList());

        if (batches.isEmpty()) {
            throw new RuntimeException("No medicine found with name: " + name);
        }

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

    public List<Medicine> getSmartBatchSelection(String medicineName, boolean allowNearExpiryOverride) {
        List<Medicine> allBatches = medicineRepository.findByNameAndStockQuantityGreaterThanOrderByExpiryDateAsc(medicineName, 0);

        if (allowNearExpiryOverride) {
            return allBatches;
        }

        Date today = new Date();
        Calendar cal = Calendar.getInstance();
        cal.setTime(today);
        cal.add(Calendar.DAY_OF_YEAR, 60);
        Date sixtyDaysFromNow = cal.getTime();

        return allBatches.stream().filter(m -> {
            boolean isNearExpiry = m.getExpiryDate() != null && m.getExpiryDate().before(sixtyDaysFromNow);
            boolean isAboveEmergencyStock = m.getStockQuantity() >= 20;

            return isAboveEmergencyStock || isNearExpiry;
        }).collect(Collectors.toList());
    }
}