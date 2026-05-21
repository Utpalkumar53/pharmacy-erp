package com.hospital.pharmacy_erp.service;

import com.hospital.pharmacy_erp.config.EncryptionUtil;
import com.hospital.pharmacy_erp.entity.PharmacyProfile;
import com.hospital.pharmacy_erp.repository.PharmacyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import jakarta.mail.internet.MimeMessage;
import java.util.List;
import java.util.Properties;

@Service
public class DynamicMailService {

    @Autowired
    private PharmacyRepository pharmacyRepository;

    @Autowired
    private EncryptionUtil encryptionUtil;

    public JavaMailSenderImpl buildMailSender() {
        PharmacyProfile profile = getProfile();

        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
        mailSender.setHost(profile.getSmtpHost() != null ? profile.getSmtpHost() : "smtp.gmail.com");
        mailSender.setPort(profile.getSmtpPort() != 0 ? profile.getSmtpPort() : 587);
        mailSender.setUsername(profile.getSmtpEmail());
        mailSender.setPassword(encryptionUtil.decrypt(profile.getSmtpAppPassword()));

        Properties props = mailSender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.smtp.starttls.required", "true");

        return mailSender;
    }

    public PharmacyProfile getProfile() {
        List<PharmacyProfile> profiles = pharmacyRepository.findAll();
        if (profiles.isEmpty())
            throw new RuntimeException("Pharmacy profile not configured");
        PharmacyProfile profile = profiles.get(0);
        if (profile.getSmtpEmail() == null || profile.getSmtpAppPassword() == null)
            throw new RuntimeException("SMTP email not configured in Settings");
        return profile;
    }

    public void sendEmail(String toEmail, String subject, String htmlBody) {
        try {
            JavaMailSenderImpl mailSender = buildMailSender();
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);
            helper.setFrom(getProfile().getSmtpEmail());
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(message);
        } catch (Exception e) {
            throw new RuntimeException("Failed to send email: " + e.getMessage());
        }
    }

    public boolean testConnection() {
        try {
            buildMailSender().testConnection();
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}