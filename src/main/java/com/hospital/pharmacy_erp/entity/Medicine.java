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
    private int stockQuantity = 0;
    private double mrp;
    private double costPrice;
    private Date expiryDate;
    private int minStockLevel = 20;
    private String hsnCode;
    private int gstPercentage = 12;

    @Field("rackNumber")
    private String rackLocation;
    private String category;

    // ✅ FIXED: Using these names so they match your Service methods exactly
    @Field("supplierId")
    private String supplierId;
    private String supplierName;

    public String getPreferredSupplierId() {
        return supplierId != null ? supplierId : preferredSupplierId;
    }

    public void setPreferredSupplierId(String id) {
        this.supplierId = id;
        this.preferredSupplierId = id;
    }

    private String preferredSupplierId; // catches old docs
}