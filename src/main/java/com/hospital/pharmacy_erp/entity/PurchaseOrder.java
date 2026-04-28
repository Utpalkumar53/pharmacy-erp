package com.hospital.pharmacy_erp.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "purchase_orders")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class PurchaseOrder {
    @Id
    private String id;
    private String supplierId;
    private String medicineId;
    private int quantityPurchased;
    private double unitCostPrice;
    private LocalDateTime purchaseDate;
}
