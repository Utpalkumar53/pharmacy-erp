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
    private String referenceInvoiceNo;
    private LocalDateTime returnDate;
    private List<ReturnItem> items;
    private double totalReturnAmount;
    private String reason;
    private String processedBy;

    // ✅ ADD THIS
    private String status; // values: "PENDING", "APPROVED", "REJECTED"
}