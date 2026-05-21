package com.hospital.pharmacy_erp.controller;

import com.hospital.pharmacy_erp.config.EncryptionUtil;
import com.hospital.pharmacy_erp.entity.PharmacyProfile;
import com.hospital.pharmacy_erp.repository.PharmacyRepository;
import com.hospital.pharmacy_erp.service.DynamicMailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/profile")
@CrossOrigin(origins = "http://localhost:3000")
public class PharmacyController {

    @Autowired
    private PharmacyRepository pharmacyRepository;

    @Autowired
    private EncryptionUtil encryptionUtil;

    @Autowired
    private DynamicMailService dynamicMailService;

    // ── GET profile ───────────────────────────────────────────────────────
    public PharmacyProfile getProfile() {
        List<PharmacyProfile> profiles = pharmacyRepository.findAll();
        if (profiles.isEmpty())
            throw new RuntimeException("Pharmacy profile not configured");

        PharmacyProfile profile = profiles.get(0);

        if (profile.getSmtpEmail() == null || profile.getSmtpEmail().isEmpty())
            throw new RuntimeException("Configure SMTP in Email Settings first.");

        if (profile.getSmtpAppPassword() == null || profile.getSmtpAppPassword().isEmpty())
            throw new RuntimeException("Configure SMTP in Email Settings first.");

        return profile;
    }

    // ── SAVE full profile ─────────────────────────────────────────────────
    @PostMapping
    public PharmacyProfile updateProfile(@RequestBody PharmacyProfile profile) {
        List<PharmacyProfile> profiles = pharmacyRepository.findAll();
        if (!profiles.isEmpty()) {
            profile.setId(profiles.get(0).getId());
            // ── Preserve existing SMTP fields — don't overwrite with nulls ──
            PharmacyProfile existing = profiles.get(0);
            if (profile.getSmtpEmail() == null)
                profile.setSmtpEmail(existing.getSmtpEmail());
            if (profile.getSmtpAppPassword() == null)
                profile.setSmtpAppPassword(existing.getSmtpAppPassword());
            if (profile.getSmtpHost() == null)
                profile.setSmtpHost(existing.getSmtpHost());
            if (profile.getSmtpPort() == 0)
                profile.setSmtpPort(existing.getSmtpPort());
            if (profile.getBackupRecipientEmail() == null)
                profile.setBackupRecipientEmail(existing.getBackupRecipientEmail());
        }
        return pharmacyRepository.save(profile);
    }

    // ── SAVE SMTP config only ─────────────────────────────────────────────
    @PostMapping("/smtp")
    public ResponseEntity<?> saveSmtpConfig(@RequestBody Map<String, String> body) {
        try {
            List<PharmacyProfile> profiles = pharmacyRepository.findAll();
            PharmacyProfile profile = profiles.isEmpty() ? new PharmacyProfile() : profiles.get(0);

            profile.setSmtpEmail(body.get("smtpEmail"));
            profile.setSmtpAppPassword(encryptionUtil.encrypt(body.get("smtpAppPassword")));
            profile.setSmtpHost(body.getOrDefault("smtpHost", "smtp.gmail.com"));
            profile.setSmtpPort(Integer.parseInt(body.getOrDefault("smtpPort", "587")));
            profile.setBackupRecipientEmail(body.get("backupRecipientEmail"));

            pharmacyRepository.save(profile);
            return ResponseEntity.ok(Map.of("message", "SMTP config saved successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── TEST SMTP connection ──────────────────────────────────────────────
    @PostMapping("/smtp/test")
    public ResponseEntity<?> testSmtp() {
        try {
            boolean ok = dynamicMailService.testConnection();
            if (ok)
                return ResponseEntity.ok(Map.of("message", "Connection successful!"));
            else
                return ResponseEntity.badRequest().body(Map.of("error", "Connection failed"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

}
