package com.hospital.pharmacy_erp.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "sales")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Sale {
    @Id
    private String id;
    private String customerId;
    private String customerName;
    private String customerPhone;
    private List<SaleItem> saleItems;
    private double totalAmount;
    private double totalTax;
    private double subTotalAmount;
    private String paymentMethod;
    private LocalDateTime saleDate;
    private String billedBy;

    // NEW: Flag to allow selling from the safety stock
    private boolean emergencySale = false;
}