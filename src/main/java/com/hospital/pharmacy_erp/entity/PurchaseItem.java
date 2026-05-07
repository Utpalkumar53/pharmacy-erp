package com.hospital.pharmacy_erp.entity;

import lombok.Data;

@Data
public class PurchaseItem {
    private String medicineId;
    private String medicineName;
    private int quantity;
    private double unitCostPrice;
    private double sellingPrice;    // ← ADD THIS
    private double gstPercentage;
    private double taxAmount;
    private double lineTotal;
    private String batchNo;
    private String hsnCode;
    private java.util.Date expiryDate;
    private String rackNumber; // ✅ Added to capture location from the purchase form
}