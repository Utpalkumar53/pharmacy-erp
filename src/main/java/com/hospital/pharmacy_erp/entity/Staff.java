package com.hospital.pharmacy_erp.entity;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;

@Document(collection = "staff")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Staff {

    @Id
    private String id;

    @NotBlank
    private String name;

    @NotBlank
    private String role;

    @NotBlank
    private String phone;

    @DecimalMin(value = "0.0", message = "Salary cannot be negative")
    private double monthlySalary;

    private LocalDate joiningDate;
    private boolean active = true;
}
