package com.hospital.pharmacy_erp.entity;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Document(collection = "pharmacy_profile")
public class PharmacyProfile {
    @Id
    private String id;
    private String pharmacyName;
    private String address;
    private String contactNumber;
    private String email;
    private String gstNumber;
    private String licenseNumber;
}