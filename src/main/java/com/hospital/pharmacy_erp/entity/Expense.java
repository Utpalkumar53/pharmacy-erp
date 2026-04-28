package com.hospital.pharmacy_erp.entity;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Document(collection = "expenses")
@Data
public class Expense {
    @Id
    private String id;
    private String description; // e.g., "Samosas for staff", "Van Fuel"
    private double amount;
    private String category;    // FOOD, TRANSPORT, UTILITY, RENT
    private LocalDateTime expenseDate;
    private String addedBy;     // Admin username
}