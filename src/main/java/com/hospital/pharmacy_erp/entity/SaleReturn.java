package com.hospital.pharmacy_erp.entity;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "sale_returns")
@Data
public class SaleReturn {


    @Id
    private String id;
    private String originalSaleId;
    private String customerName;
    private List<ReturnItem> returnedItems;
    private double totalRefundAmount;
    private LocalDateTime returnDate;
    private String reason;
    private String processedBy; // pharmacist name

}
