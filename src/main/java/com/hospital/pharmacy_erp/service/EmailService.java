package com.hospital.pharmacy_erp.service;

import com.hospital.pharmacy_erp.entity.PharmacyProfile;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.io.File;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
public class EmailService {

    // ✅ Use DynamicMailService — reads from MongoDB, not hardcoded
    @Autowired
    private DynamicMailService dynamicMailService;

    public void sendBackupEmail(File backupFile) throws MessagingException {
        try {
            PharmacyProfile profile = dynamicMailService.getProfile();

            // Use backup recipient if set, otherwise use pharmacy email
            String recipient = profile.getBackupRecipientEmail() != null
                    && !profile.getBackupRecipientEmail().isEmpty()
                    ? profile.getBackupRecipientEmail()
                    : profile.getEmail();

            JavaMailSenderImpl mailSender = dynamicMailService.buildMailSender();
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);

            helper.setFrom(profile.getSmtpEmail());
            helper.setTo(recipient);
            helper.setSubject("Pharma-ERP Weekly Backup — " + LocalDate.now());
            helper.setText(
                    "Hello,\n\n" +
                            "Please find attached the weekly database backup for Pharma-ERP.\n\n" +
                            "File: " + backupFile.getName() + "\n" +
                            "Generated on: " + LocalDateTime.now() + "\n\n" +
                            "This is an automated email. Please store this file safely.\n\n" +
                            "— Pharma-ERP System"
            );
            helper.addAttachment(backupFile.getName(), backupFile);
            mailSender.send(message);

        } catch (Exception e) {
            throw new MessagingException("Failed to send backup email: " + e.getMessage());
        }
    }
}