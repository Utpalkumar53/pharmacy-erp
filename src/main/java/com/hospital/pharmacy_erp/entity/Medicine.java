package com.hospital.pharmacy_erp.entity;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.util.Date;

@Data
@Document(collection = "medicines")
public class Medicine {
    @Id
    private String id;
    private String name;
    private String batchNo;
    private int stockQuantity = 0; // ✅ Defaults to 0 now
    private double mrp;
    private double costPrice;
    private Date expiryDate;
    private int minStockLevel = 10;
    private String hsnCode;
    private int gstPercentage = 12;

    @Field("rackNumber") // Explicitly map to MongoDB document field
    private String rackLocation;    // ✅ NEW FIELD: To track physical location in the shop
    private String category;
}