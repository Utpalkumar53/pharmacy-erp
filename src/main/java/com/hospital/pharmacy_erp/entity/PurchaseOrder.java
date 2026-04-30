package com.hospital.pharmacy_erp.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "purchase_orders")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class PurchaseOrder {
    @Id
    private String id;
    private String supplierId;
    private String supplierName;
    private String invoiceNumber; // The bill number from the supplier
    private List<PurchaseItem> items; // Multiple medicines in one bill
    private double totalBillAmount;
    private double totalInputTax;    // This is the GST your father PAID
    private LocalDateTime purchaseDate;
    private String receivedBy;
}