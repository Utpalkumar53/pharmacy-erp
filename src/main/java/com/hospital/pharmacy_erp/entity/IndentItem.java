package com.hospital.pharmacy_erp.entity; // Must match your folder structure

import lombok.Data;

@Data
public class IndentItem {
    private String medicineId;
    private String medicineName;
    private int quantityRequested;
    private int quantityIssued;
    private double unitPriceAtIssue; // NEW: Capture the price here
    private double totalValue;       // NEW: quantityIssued * unitPriceAtIssue
}