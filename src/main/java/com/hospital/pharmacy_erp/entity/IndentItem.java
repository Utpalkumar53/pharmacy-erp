package com.hospital.pharmacy_erp.entity;

import lombok.Data;

@Data
public class IndentItem {
    private String medicineId;
    private String medicineName;

    // ── NEW: batch info for regulatory compliance ──
    private String batchNo;

    private int quantityRequested;
    private int quantityIssued;       // may be less than requested in partial issue

    // ── NEW: explicitly track what couldn't be issued ──
    private int quantityPending;

    private double unitPriceAtIssue;
    private double totalValue;

    // ── NEW: item-level status ──
    private String itemStatus; // FULL, PARTIAL, PENDING
}