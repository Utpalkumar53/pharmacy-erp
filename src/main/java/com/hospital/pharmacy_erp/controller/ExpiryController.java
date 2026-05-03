package com.hospital.pharmacy_erp.controller;

import com.hospital.pharmacy_erp.entity.Medicine;
import com.hospital.pharmacy_erp.service.ExpiryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/inventory/expiry")
@CrossOrigin(origins = "http://localhost:3000")
public class ExpiryController {

    @Autowired
    private ExpiryService expiryService;

    @GetMapping("/alerts")
    public Map<String, List<Medicine>> getExpiryAlerts() {
        return Map.of(
                "EXPIRED", expiryService.getExpiredMedicines(),
                "EXPIRING_30_DAYS", expiryService.getExpiringInWindow(0,30),
                "EXPIRING_60_DAYS", expiryService.getExpiringInWindow(31,60),
                "EXPIRING_90_DAYS", expiryService.getExpiringInWindow(61,90)
        );
    }
}