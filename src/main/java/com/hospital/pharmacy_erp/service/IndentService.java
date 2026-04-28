package com.hospital.pharmacy_erp.service;

import com.hospital.pharmacy_erp.entity.Indent;
import com.hospital.pharmacy_erp.entity.IndentItem;
import com.hospital.pharmacy_erp.entity.Medicine;
import com.hospital.pharmacy_erp.repository.IndentRepository;
import com.hospital.pharmacy_erp.repository.MedicineRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class IndentService {
    @Autowired
    private IndentRepository indentRepository;

    @Autowired
    private MedicineRepository medicineRepository;

    // --- MODIFIED: Added Doctor Authorization Logic ---
    @Transactional
    public Indent createIndent(Indent indent, String currentUser, String role) {
        indent.setRequestDate(LocalDateTime.now());
        indent.setEnteredBy(currentUser);

        // 1. EMERGENCY DOCTOR CHECK
        // If it's an emergency, we REQUIRE a doctor's name regardless of who enters it
        if (indent.isEmergency() && (indent.getAuthorizedByDoctor() == null || indent.getAuthorizedByDoctor().trim().isEmpty())) {
            throw new RuntimeException("Access Denied: Emergency indents require a Doctor's name for authorization!");
        }

        // 2. Identify manual back-entries
        boolean isManualEntry = "PHYSICAL_REGISTER".equals(indent.getOrderSource()) ||
                "DOCTOR_VERBAL".equals(indent.getOrderSource());

        if (isManualEntry) {
            String userRole = (role != null) ? role.toUpperCase() : "";

            if (userRole.equals("ROLE_ADMIN") || userRole.equals("ROLE_PHARMACIST")) {
                return processImmediateIssue(indent);
            } else {
                throw new RuntimeException("Access Denied: Nurses cannot perform manual back-entries!");
            }
        }

        for (IndentItem item : indent.getItems()) {
            medicineRepository.findById(item.getMedicineId()).ifPresent(med -> {
                item.setMedicineName(med.getName());
            });
        }

        indent.setStatus("PENDING");
        return indentRepository.save(indent);
    }

    @Transactional
    public Indent issueIndent(String indentId) {
        Indent indent = indentRepository.findById(indentId)
                .orElseThrow(() -> new RuntimeException("Indent not found"));

        if ("ISSUED".equals(indent.getStatus())) {
            throw new RuntimeException("This indent has already been issued!");
        }

        for (IndentItem item : indent.getItems()) {
            Medicine med = medicineRepository.findById(item.getMedicineId())
                    .orElseThrow(() -> new RuntimeException("Medicine not found"));

            // --- THE MISSING FIX IS HERE ---
            item.setMedicineName(med.getName()); // Overwrites "Paracetamol" with real name
            item.setUnitPriceAtIssue(med.getMrp());
            item.setTotalValue(item.getQuantityRequested() * med.getMrp());
            // -------------------------------

            int requested = item.getQuantityRequested();
            int currentStock = med.getStockQuantity();
            int remaining = currentStock - requested;

            if (remaining < 0) {
                throw new RuntimeException("Insufficient stock for: " + med.getName());
            }

            if (remaining < med.getMinStockLevel() && !indent.isEmergency()) {
                throw new RuntimeException("Safety Limit Reached: " + med.getName() +
                        " is reserved for emergencies.");
            }

            med.setStockQuantity(remaining);
            item.setQuantityIssued(requested);
            medicineRepository.save(med);
        }

        indent.setStatus("ISSUED");
        return indentRepository.save(indent);
    }
    private Indent processImmediateIssue(Indent indent) {
        // ... (Your existing processImmediateIssue logic remains the same)
        for (IndentItem item : indent.getItems()) {
            Medicine med = medicineRepository.findById(item.getMedicineId())
                    .orElseThrow(() -> new RuntimeException("Medicine not found"));

            // FORCE the correct name from the Database to prevent the "Dolo vs Azithromycin" error
            item.setMedicineName(med.getName());
            item.setUnitPriceAtIssue(med.getMrp());
            item.setTotalValue(item.getQuantityRequested() * med.getMrp());

            // Apply safety stock check here too if needed
            int remaining = med.getStockQuantity() - item.getQuantityRequested();
            if (remaining < med.getMinStockLevel() && !indent.isEmergency()) {
                throw new RuntimeException("Low Stock: Cannot issue manual entry for non-emergency below safety limit.");
            }

            med.setStockQuantity(remaining);
            item.setQuantityIssued(item.getQuantityRequested());
            medicineRepository.save(med);
        }
        indent.setStatus("ISSUED");
        return indentRepository.save(indent);
    }
}