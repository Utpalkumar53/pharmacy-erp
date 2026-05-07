package com.hospital.pharmacy_erp.entity;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Document(collection = "purchase_returns")
public class PurchaseReturn {
    @Id
    private String id;
    private String supplierName;
    private String referenceInvoiceNo; // The supplier's original bill number
    private LocalDateTime returnDate;
    private List<ReturnItem> items;    // Using your existing helper class
    private double totalReturnAmount;
    private String reason;             // e.g., "Expired" or "Damaged Stock"
    private String processedBy;
}