package com.hospital.pharmacy_erp.controller;

import com.hospital.pharmacy_erp.entity.ActivityLog;
import com.hospital.pharmacy_erp.entity.Medicine;
import com.hospital.pharmacy_erp.service.AuditService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/log")
public class AuditController {
    @Autowired
    private AuditService auditService;

    @GetMapping
    public ResponseEntity<List<ActivityLog>> getAllLogs() {
        List<ActivityLog> logs = auditService.getAll();
        return new ResponseEntity<>(logs, HttpStatus.OK);
    }

    @GetMapping("/{username}")
    public ResponseEntity<List<ActivityLog>> getLogsByUser(@PathVariable String username) {
        List<ActivityLog> logs = auditService.getLogsByUsername(username);
        return new ResponseEntity<>(logs, HttpStatus.OK);
    }
}
