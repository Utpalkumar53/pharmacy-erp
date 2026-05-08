package com.hospital.pharmacy_erp.controller;

import com.hospital.pharmacy_erp.service.BackupService;
import com.hospital.pharmacy_erp.service.EmailService;
import jakarta.mail.MessagingException;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.File;
import java.io.IOException;

@RestController
@RequestMapping("/api/backup")
@CrossOrigin(origins = "http://localhost:3000")
public class BackupController {

    // ✅ Constructor injection — no @Autowired
    private final BackupService backupService;
    private final EmailService emailService;

    public BackupController(BackupService backupService, EmailService emailService) {
        this.backupService = backupService;
        this.emailService = emailService;
    }

    @GetMapping("/download")
    public ResponseEntity<Resource> downloadBackup() {
        try {
            File backupFile = backupService.createBackup();
            Resource resource = new FileSystemResource(backupFile);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"" + backupFile.getName() + "\"")
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .contentLength(backupFile.length())
                    .body(resource);

        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/send-email")
    public ResponseEntity<String> sendBackupEmail() {
        try {
            // Generate the PDF for the email
            File pdfFile = backupService.createPdfReport();
            emailService.sendBackupEmail(pdfFile);

            // Also keep the JSON on the disk for safety
            backupService.createBackup();

            return ResponseEntity.ok("PDF Report sent to email successfully!");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Failed: " + e.getMessage());
        }
    }

    @GetMapping("/sales/excel")
    public ResponseEntity<Resource> downloadSalesExcel() {
        try {
            File file = backupService.createSalesExcelReport();
            Resource resource = new FileSystemResource(file);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getName() + "\"")
                    .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .body(resource);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}