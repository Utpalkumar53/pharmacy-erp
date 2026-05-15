// src/main/java/com/hospital/pharmacy_erp/controller/AuthController.java
package com.hospital.pharmacy_erp.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class AuthController {

    @GetMapping("/auth/verify")
    public ResponseEntity<?> verifyToken(Authentication authentication) {
        if (authentication != null && authentication.isAuthenticated()) {
            return ResponseEntity.ok(Map.of(
                    "valid", true,
                    "username", authentication.getName()
            ));
        }
        return ResponseEntity.status(401).body(Map.of("valid", false));
    }
}