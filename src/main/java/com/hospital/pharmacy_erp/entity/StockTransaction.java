package com.hospital.pharmacy_erp.entity;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.Date;

@Data
@Document(collection = "stock_transactions")
public class StockTransaction {
    @Id
    private String id;
    private String medicineName;
    private String batchNo;
    private String transactionType; // "SALE", "PURCHASE_ADD", "MANUAL_UPDATE", "RETURN"
    private int quantityChanged;    // e.g., -5 for Sale, +50 for Purchase
    private int remainingStock;     // Stock level *after* this transaction completed
    private String referenceNo;     // Invoice ID or Purchase Order ID
    private Date timestamp;
    private String performedBy;     // Username of the person who did it
}