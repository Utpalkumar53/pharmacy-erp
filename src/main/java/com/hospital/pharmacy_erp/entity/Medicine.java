package com.hospital.pharmacy_erp.entity;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;

@Document(collection = "medicines")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Medicine {
    @Id
    private String id;

    @NotBlank(message = "Medicine name cannot be empty")
    private String name; // Note: Ensure your Service uses .getName() instead of .getMedicineName()

    private String batchNo;

    @Min(value = 0, message = "Stock cannot be negative")
    private int stockQuantity;

    private int minStockLevel = 20;

    @DecimalMin(value = "0.1", message = "MRP must be greater than zero")
    private double mrp;

    // NEW FIELD: This fixed the "Cannot resolve method setCostPrice" error
    private double costPrice;

    private LocalDate expiryDate;
    private String category;
    private String supplierId;
    private String rackLocation;

    @NotBlank(message = "HSN Code is required for GST compliance")
    private String hsnCode;

    private double gstPercentage;
    private LocalDate addedDate;
}