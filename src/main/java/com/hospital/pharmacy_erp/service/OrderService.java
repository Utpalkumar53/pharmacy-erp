package com.hospital.pharmacy_erp.service;

import com.hospital.pharmacy_erp.entity.Medicine;
import com.hospital.pharmacy_erp.entity.PharmacyProfile;
import com.hospital.pharmacy_erp.entity.Supplier;
import com.hospital.pharmacy_erp.repository.MedicineRepository;
import com.hospital.pharmacy_erp.repository.PharmacyRepository;
import com.hospital.pharmacy_erp.repository.SupplierRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@Service
public class OrderService {

    @Autowired
    private MedicineRepository medicineRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private PharmacyRepository pharmacyRepository;

    public Map<String, Object> prepareOrderData(String medicineId) {

        // ── Medicine ──────────────────────────────────────────────────────────
        Medicine med = medicineRepository.findById(medicineId)
                .orElseThrow(() -> new RuntimeException("Medicine not found"));

        if (med.getPreferredSupplierId() == null || med.getPreferredSupplierId().isEmpty()) {
            throw new RuntimeException("No supplier linked to " + med.getName()
                    + ". Please assign a preferred supplier in Inventory.");
        }

        // ── Supplier ──────────────────────────────────────────────────────────
        Supplier sup = supplierRepository.findById(med.getPreferredSupplierId())
                .orElseThrow(() -> new RuntimeException("Supplier details missing. Please check supplier records."));

        // ── Pharmacy Profile ──────────────────────────────────────────────────
        PharmacyProfile profile = pharmacyRepository.findAll()
                .stream().findFirst().orElse(null);

        // ── Suggested Qty ─────────────────────────────────────────────────────
        int suggestedQty = (med.getMinStockLevel() * 2) - med.getStockQuantity();
        int finalQty     = Math.max(suggestedQty, 10);

        // ── Order number & date ───────────────────────────────────────────────
        String orderDate   = LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
        String orderNumber = "ORD-"
                + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"))
                + "-" + (int)(Math.random() * 900 + 100);

        // ── Build response ────────────────────────────────────────────────────
        Map<String, Object> data = new HashMap<>();

        // Medicine
        data.put("medicineId",    med.getId());
        data.put("medicineName",  med.getName());
        data.put("currentStock",  med.getStockQuantity());
        data.put("minStockLevel", med.getMinStockLevel());
        data.put("suggestedQty",  finalQty);

        // Supplier
        data.put("supplierName",    sup.getName());
        data.put("contactPerson",   sup.getContactPerson());
        data.put("contactPhone",    sup.getContactPhone());
        data.put("email",           sup.getEmail());
        data.put("supplierAddress", sup.getAddress());
        data.put("supplierGst",     sup.getGstNumber());

        // Order meta
        data.put("orderNumber", orderNumber);
        data.put("orderDate",   orderDate);

        // Pharmacy profile for PDF letterhead
        if (profile != null) {
            data.put("pharmacyName",    profile.getPharmacyName());
            data.put("pharmacyAddress", profile.getAddress());
            data.put("pharmacyPhone",   profile.getContactNumber());
            data.put("pharmacyEmail",   profile.getEmail());
            data.put("pharmacyGst",     profile.getGstNumber());
            data.put("pharmacyLicense", profile.getLicenseNumber());
        } else {
            data.put("pharmacyName",    "Pharmacy");
            data.put("pharmacyAddress", "");
            data.put("pharmacyPhone",   "");
            data.put("pharmacyEmail",   "");
            data.put("pharmacyGst",     "");
            data.put("pharmacyLicense", "");
        }

        return data;
    }
}