package com.hospital.pharmacy_erp.dto;

import lombok.Data;
import java.util.Map;

@Data
public class GstReport {
    private String month;
    private int year;
    private double counterSalesTotal;
    private double hospitalNormalIndentTotal;
    private double hospitalEmergencyIndentTotal;

    private double totalSalesValue;
    private double totalPurchaseValue;

    // Breakdown by percentage (5%, 12%, 18%, etc.)
    private Map<Double, Double> collectedGstByRate;
    private Map<Double, Double> paidGstByRate;

    private double totalCollectedGst; // Output Tax
    private double totalPaidGst;      // Input Tax Credit (ITC)
    private double netGstPayable;     // What to pay to Gov
}