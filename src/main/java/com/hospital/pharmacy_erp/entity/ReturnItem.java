package com.hospital.pharmacy_erp.entity;

import lombok.Data;

// helper class
@Data
public class ReturnItem {
    private String medicineId;
    private String medicineName;
    private int quantityReturned;
    private double unitPrice;
    private double subTotal;
}
