package com.hospital.pharmacy_erp.service;

import jakarta.mail.MessagingException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.IOException;

@Component
public class BackupScheduler {

    private static final Logger logger = LoggerFactory.getLogger(BackupScheduler.class);

    // ✅ Constructor injection
    private final BackupService backupService;
    private final EmailService emailService;

    public BackupScheduler(BackupService backupService, EmailService emailService) {
        this.backupService = backupService;
        this.emailService = emailService;
    }

    @Scheduled(cron = "0 0 10 * * SUN")
    public void weeklyBackup() {
        logger.info("Starting weekly backup...");
        try {
            File backupFile = backupService.createBackup();
            emailService.sendBackupEmail(backupFile);
            logger.info("Weekly backup completed: {}", backupFile.getName());
        } catch (IOException e) {
            logger.error("Backup failed — file error: {}", e.getMessage());
        } catch (MessagingException e) {
            logger.error("Backup failed — email error: {}", e.getMessage());
        }
    }
}