package com.hospital.pharmacy_erp.controller;

import com.hospital.pharmacy_erp.entity.Medicine;
import com.hospital.pharmacy_erp.service.ExpiryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/inventory/expiry")
public class ExpiryController {

    @Autowired
    private ExpiryService expiryService;

    @GetMapping("/alerts")
    public Map<String, List<Medicine>> getExpiryAlerts() {
        return Map.of(
                "EXPIRED", expiryService.getExpiredMedicines(),
                "EXPIRING_30_DAYS", expiryService.getExpiringSoon(30),
                "EXPIRING_60_DAYS", expiryService.getExpiringSoon(60)
        );
    }
}