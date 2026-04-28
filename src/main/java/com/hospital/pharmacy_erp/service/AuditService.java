package com.hospital.pharmacy_erp.service;

import com.hospital.pharmacy_erp.entity.ActivityLog;
import com.hospital.pharmacy_erp.repository.ActivityLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.PathVariable;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AuditService {
    @Autowired
    private ActivityLogRepository activityLogRepository;

    public void  log(String username, String action, String details) {
        ActivityLog log = new ActivityLog();
        log.setUsername(username);
        log.setAction(action);
        log.setDetails(details);
        log.setTimestamp(LocalDateTime.now());
        activityLogRepository.save(log);
    }

    public List<ActivityLog> getAll() {
        return activityLogRepository.findAll();
    }

    public List<ActivityLog> getLogsByUsername(String username) {

        return activityLogRepository.findByUsername(username);
    }
}
