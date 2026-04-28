package com.hospital.pharmacy_erp.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Document(collection = "indents")
public class Indent {
    @Id
    private String id;
    private String wardName; // ICU, Emergency, OPD, etc.
    private String requestedBy; // Nurse/Doctor name
    private List<IndentItem> items;
    private LocalDateTime requestDate;
    private String status; // PENDING, ISSUED, CANCELLED
    private String orderSource; // NURSE_APP, DOCTOR_VERBAL, PHYSICAL_REGISTER
    private String referenceNote; // "Emergency - Dr. Sharma's order"
    private String enteredBy; // Who actually typed it into the ERP
    private boolean emergency = false;
    private String authorizedByDoctor;

}

