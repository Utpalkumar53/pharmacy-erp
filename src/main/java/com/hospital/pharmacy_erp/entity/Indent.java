package com.hospital.pharmacy_erp.entity;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Document(collection = "indents")
public class Indent {
    @Id
    private String id;

    // ── NEW: Human-readable serial e.g. IND-2025-0042 ──
    private String indentNumber;

    private String wardName;
    private String requestedBy;
    private List<IndentItem> items;
    private LocalDateTime requestDate;

    // ── NEW: Track when it was actually issued ──
    private LocalDateTime issueDate;

    private String status; // PENDING, ISSUED, PARTIALLY_ISSUED, CANCELLED

    private String orderSource;
    private String referenceNote;
    private String enteredBy;

    // ── NEW: Who issued it (pharmacist/admin username) ──
    private String issuedBy;

    // ── NEW: Reason when cancelled ──
    private String cancellationReason;

    // ── NEW: Stock warning flag set at creation time ──
    private boolean hasStockWarning = false;
    private String stockWarningMessage;

    private boolean emergency = false;
    private String authorizedByDoctor;
}