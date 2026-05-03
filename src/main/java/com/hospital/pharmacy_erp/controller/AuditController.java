package com.hospital.pharmacy_erp.controller;

import com.hospital.pharmacy_erp.entity.ActivityLog;
import com.hospital.pharmacy_erp.entity.Medicine;
import com.hospital.pharmacy_erp.service.AuditService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/log")
@CrossOrigin(origins = "http://localhost:3000")
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
