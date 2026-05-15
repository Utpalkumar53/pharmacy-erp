package com.hospital.pharmacy_erp.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Document(collection = "attendance")
@NoArgsConstructor
@AllArgsConstructor
public class Attendance {
    @Id
    private String id;

    private String staffId;
    private String staffName;
    private LocalDate date;

    @JsonFormat(pattern = "HH:mm:ss")
    private LocalTime checkInTime;

    @JsonFormat(pattern = "HH:mm:ss")
    private LocalTime checkOutTime;
    private String status; // PRESENT, ABSENT, LEAVE
}