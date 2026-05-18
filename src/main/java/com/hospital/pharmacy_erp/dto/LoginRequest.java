package com.hospital.pharmacy_erp.dto;
import lombok.Data;

@Data
public class LoginRequest {
    private String username;
    private String password;
}