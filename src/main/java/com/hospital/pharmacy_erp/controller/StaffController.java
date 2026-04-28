package com.hospital.pharmacy_erp.controller;

import com.hospital.pharmacy_erp.entity.Attendance;
import com.hospital.pharmacy_erp.entity.Staff;
import com.hospital.pharmacy_erp.service.StaffService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/staff")
public class StaffController {

    @Autowired
    private StaffService staffService;

    // 1. Register a new Staff member
    @PostMapping
    public ResponseEntity<Staff> createStaff(@Valid @RequestBody Staff staff) {
        return new ResponseEntity<>(staffService.addStaff(staff), HttpStatus.CREATED);
    }

    // 2. Get all staff (To see who is active)
    @GetMapping
    public List<Staff> getAllStaff() {
        return staffService.getAllStaff();
    }

    // 3. Check-In (Clock-In)
    // URL: POST /api/staff/attendance/check-in/STAFF_ID
    @PostMapping("/attendance/check-in/{id}")
    public ResponseEntity<Attendance> checkIn(@PathVariable String id) {
        return new ResponseEntity<>(staffService.clockIn(id), HttpStatus.CREATED);
    }

    // 4. Check-Out (Clock-Out)
    @PutMapping("/attendance/check-out/{id}")
    public ResponseEntity<Attendance> checkOut(@PathVariable String id) {
        return new ResponseEntity<>(staffService.clockOut(id), HttpStatus.OK);
    }
    @GetMapping("/salary-report/{id}")
    public ResponseEntity<Map<String, Object>> getSalaryReport(
            @PathVariable String id,
            @RequestParam int month,
            @RequestParam int year) {
        return ResponseEntity.ok(staffService.calculateMonthlySalary(id, month, year));
    }
}