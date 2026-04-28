package com.hospital.pharmacy_erp.controller;

import com.hospital.pharmacy_erp.entity.User;
import com.hospital.pharmacy_erp.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/public")
public class PublicController {

    @Autowired
    private UserService userService;

    // Health Check - Good for Microservices later!
    @GetMapping("/health-check")
    public String healthCheck() {
        return "Pharmacy ERP is up and running!";
    }

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody User user) {
        boolean isSaved = userService.saveNewUser(user);
        if (isSaved) {
            return new ResponseEntity<>("User created successfully", HttpStatus.CREATED);
        } else {
            return new ResponseEntity<>("Failed to create user. Username might be taken.", HttpStatus.BAD_REQUEST);
        }
    }
}