package com.hospital.pharmacy_erp.controller;

import com.hospital.pharmacy_erp.entity.PharmacyProfile;
import com.hospital.pharmacy_erp.repository.PharmacyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/profile")
@CrossOrigin(origins = "http://localhost:3000")
public class PharmacyController {

    @Autowired
    private PharmacyRepository pharmacyRepository;

    @GetMapping
    public PharmacyProfile getProfile() {
        List<PharmacyProfile> profiles = pharmacyRepository.findAll();
        return profiles.isEmpty() ? new PharmacyProfile() : profiles.get(0);
    }

    @PostMapping
    public PharmacyProfile updateProfile(@RequestBody PharmacyProfile profile) {
        // Find existing or create new
        List<PharmacyProfile> profiles = pharmacyRepository.findAll();
        if (!profiles.isEmpty()) {
            profile.setId(profiles.get(0).getId());
        }
        return pharmacyRepository.save(profile);
    }
}