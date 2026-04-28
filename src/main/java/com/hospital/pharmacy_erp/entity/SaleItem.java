package com.hospital.pharmacy_erp.entity;

import lombok.Data;

@Data
public class SaleItem {
    private String medicineId;
    private String medicineName;
    private int quantity;
    private double unitPrice; // MRP at time of sale
    private double subTotal;  // quantity * unitPrice
    private String hsnCode; // Capture at time of sale
}
