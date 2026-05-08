package com.hospital.pharmacy_erp.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.io.File;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
public class EmailService {

    // ✅ No @Autowired — constructor injection instead
    private final JavaMailSender mailSender;

    @Value("${backup.email.recipient}")
    private String recipientEmail;

    // ✅ Spring automatically injects JavaMailSender here
    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendBackupEmail(File backupFile) throws MessagingException {

        MimeMessage message = mailSender.createMimeMessage();

        MimeMessageHelper helper = new MimeMessageHelper(message, true);

        helper.setTo(recipientEmail);
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
    }
}