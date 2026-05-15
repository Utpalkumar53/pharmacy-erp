package com.hospital.pharmacy_erp.entity;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

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

    private String bankName;
    private String bankAccountNumber;
    private String bankIfscCode;
    private String bankBranch;
    private int lowStockThreshold = 20;
    private String financialYearStart = "2026-04-01";
    private String invoiceFooterText;
    private String invoiceTerms;
    private List<String> unitMaster;
    private List<String> categoryMaster;
}