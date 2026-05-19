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
import java.time.Year;
import java.util.List;

@Service
public class IndentService {

    @Autowired
    private IndentRepository indentRepository;

    @Autowired
    private MedicineRepository medicineRepository;

    // ─────────────────────────────────────────────────────────────────────────
    // CREATE INDENT
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional
    public Indent createIndent(Indent indent, String currentUser, String role) {
        indent.setRequestDate(LocalDateTime.now());
        indent.setEnteredBy(currentUser);

        // 1. Emergency requires doctor name
        if (indent.isEmergency() &&
                (indent.getAuthorizedByDoctor() == null || indent.getAuthorizedByDoctor().trim().isEmpty())) {
            throw new RuntimeException("Emergency indents require a Doctor's name for authorization.");
        }

        // 2. Manual back-entry — only ADMIN or PHARMACIST
        boolean isManualEntry = "PHYSICAL_REGISTER".equals(indent.getOrderSource())
                || "DOCTOR_VERBAL".equals(indent.getOrderSource());

        if (isManualEntry) {
            String userRole = role != null ? role.toUpperCase() : "";
            if (userRole.equals("ROLE_ADMIN") || userRole.equals("ROLE_PHARMACIST")) {
                indent.setIndentNumber(generateIndentNumber());
                return processImmediateIssue(indent, currentUser);
            } else {
                throw new RuntimeException("Nurses cannot perform manual back-entries.");
            }
        }

        // 3. Fill medicine names + run stock WARNING (not a hard block for nurses)
        StringBuilder warnings = new StringBuilder();
        for (IndentItem item : indent.getItems()) {
            medicineRepository.findById(item.getMedicineId()).ifPresent(med -> {
                item.setMedicineName(med.getName());
                item.setBatchNo(med.getBatchNo());
                item.setItemStatus("PENDING");

                // Soft warning — don't block, just flag
                if (med.getStockQuantity() < item.getQuantityRequested()) {
                    warnings.append(med.getName())
                            .append(" (available: ").append(med.getStockQuantity())
                            .append(", requested: ").append(item.getQuantityRequested()).append("); ");
                }
            });
        }

        if (warnings.length() > 0) {
            indent.setHasStockWarning(true);
            indent.setStockWarningMessage("Low stock for: " + warnings.toString().trim());
        }

        indent.setStatus("PENDING");
        indent.setIndentNumber(generateIndentNumber());
        return indentRepository.save(indent);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ISSUE INDENT  (supports partial issuing)
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional
    public Indent issueIndent(String indentId, String issuedByUsername) {
        Indent indent = indentRepository.findById(indentId)
                .orElseThrow(() -> new RuntimeException("Indent not found"));

        if ("ISSUED".equals(indent.getStatus())) {
            throw new RuntimeException("This indent has already been issued.");
        }
        if ("CANCELLED".equals(indent.getStatus())) {
            throw new RuntimeException("Cannot issue a cancelled indent.");
        }

        boolean anyIssued  = false;
        boolean anyPending = false;

        for (IndentItem item : indent.getItems()) {
            Medicine med = medicineRepository.findById(item.getMedicineId())
                    .orElseThrow(() -> new RuntimeException("Medicine not found: " + item.getMedicineId()));

            // Always refresh name + batch from DB
            item.setMedicineName(med.getName());
            item.setBatchNo(med.getBatchNo());
            item.setUnitPriceAtIssue(med.getMrp());

            int requested    = item.getQuantityRequested();
            int currentStock = med.getStockQuantity();

            // How much can we actually give?
            // For emergency: ignore safety stock floor
            // For normal: keep minStockLevel reserved
            int safeFloor  = indent.isEmergency() ? 0 : med.getMinStockLevel();
            int available  = Math.max(0, currentStock - safeFloor);
            int toIssue    = Math.min(requested, available);  // ← PARTIAL ISSUE LOGIC

            item.setQuantityIssued(toIssue);
            item.setQuantityPending(requested - toIssue);
            item.setTotalValue(toIssue * med.getMrp());

            if (toIssue == requested) {
                item.setItemStatus("FULL");
                anyIssued = true;
            } else if (toIssue > 0) {
                item.setItemStatus("PARTIAL");
                anyIssued  = true;
                anyPending = true;
            } else {
                item.setItemStatus("PENDING");
                anyPending = true;
            }

            // Deduct stock
            med.setStockQuantity(currentStock - toIssue);
            medicineRepository.save(med);
        }

        // Set overall indent status
        if (anyIssued && anyPending) {
            indent.setStatus("PARTIALLY_ISSUED");
        } else if (anyIssued) {
            indent.setStatus("ISSUED");
        }
        // If nothing was issued at all (zero stock for everything), stay PENDING

        indent.setIssuedBy(issuedByUsername);
        indent.setIssueDate(LocalDateTime.now());
        return indentRepository.save(indent);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CANCEL INDENT  (with reason)
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional
    public Indent cancelIndent(String indentId, String reason, String cancelledByUsername) {
        Indent indent = indentRepository.findById(indentId)
                .orElseThrow(() -> new RuntimeException("Indent not found"));

        if ("ISSUED".equals(indent.getStatus())) {
            throw new RuntimeException("Cannot cancel an already issued indent.");
        }

        indent.setStatus("CANCELLED");
        indent.setCancellationReason(reason != null ? reason : "No reason provided");
        // Reuse issuedBy field to record who cancelled, or add cancelledBy field
        indent.setIssuedBy(cancelledByUsername);
        return indentRepository.save(indent);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // IMMEDIATE ISSUE  (for manual back-entry)
    // ─────────────────────────────────────────────────────────────────────────
    private Indent processImmediateIssue(Indent indent, String issuedByUsername) {
        for (IndentItem item : indent.getItems()) {
            Medicine med = medicineRepository.findById(item.getMedicineId())
                    .orElseThrow(() -> new RuntimeException("Medicine not found: " + item.getMedicineId()));

            item.setMedicineName(med.getName());
            item.setBatchNo(med.getBatchNo());
            item.setUnitPriceAtIssue(med.getMrp());
            item.setTotalValue(item.getQuantityRequested() * med.getMrp());

            int remaining = med.getStockQuantity() - item.getQuantityRequested();
            if (remaining < med.getMinStockLevel() && !indent.isEmergency()) {
                throw new RuntimeException("Low Stock: Cannot back-enter below safety limit for " + med.getName());
            }

            med.setStockQuantity(Math.max(0, remaining));
            item.setQuantityIssued(item.getQuantityRequested());
            item.setQuantityPending(0);
            item.setItemStatus("FULL");
            medicineRepository.save(med);
        }

        indent.setStatus("ISSUED");
        indent.setIssuedBy(issuedByUsername);
        indent.setIssueDate(LocalDateTime.now());
        return indentRepository.save(indent);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SERIAL NUMBER GENERATOR  → IND-2025-0042
    // ─────────────────────────────────────────────────────────────────────────
    private String generateIndentNumber() {
        int year = Year.now().getValue();
        String prefix = "IND-" + year + "-";

        // Count indents created this year to get next sequence
        long count = indentRepository.findAll().stream()
                .filter(i -> i.getIndentNumber() != null && i.getIndentNumber().startsWith(prefix))
                .count();

        return prefix + String.format("%04d", count + 1);
    }
}