package com.hospital.pharmacy_erp.entity;

import lombok.Data;

@Data
public class PurchaseItem {
    private String medicineId;
    private String medicineName;
    private int quantity;
    private double unitCostPrice;
    private double gstPercentage; // To calculate Input Tax Credit
    private double taxAmount;     // Calculated automatically
    private double lineTotal;     // quantity * cost + tax
}