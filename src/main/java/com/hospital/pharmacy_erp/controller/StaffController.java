package com.hospital.pharmacy_erp.controller;

import com.hospital.pharmacy_erp.entity.Attendance;
import com.hospital.pharmacy_erp.entity.Staff;
import com.hospital.pharmacy_erp.repository.StaffRepository;
import com.hospital.pharmacy_erp.repository.UserRepository;
import com.hospital.pharmacy_erp.service.StaffService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/staff")
public class StaffController {

    @Autowired private StaffService staffService;
    @Autowired private StaffRepository staffRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    // ── Admin: Create staff + auto-create user ────────────────────────────────
    @PostMapping
    public ResponseEntity<Staff> createStaff(@Valid @RequestBody Staff staff) {
        return new ResponseEntity<>(staffService.addStaff(staff), HttpStatus.CREATED);
    }

    // ── Admin: Update staff + sync user role ──────────────────────────────────
    @PutMapping("/{id}")
    public ResponseEntity<Staff> updateStaff(
            @PathVariable String id,
            @RequestBody Staff staff) {
        return ResponseEntity.ok(staffService.updateStaff(id, staff));
    }

    // ── Admin: Get all staff ──────────────────────────────────────────────────
    @GetMapping
    public List<Staff> getAllStaff() {
        return staffService.getAllStaff();
    }

    // ── Admin: Delete staff ───────────────────────────────────────────────────
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteStaff(@PathVariable String id) {
        staffRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    // ── Admin: Clock In / Out by staffId ─────────────────────────────────────
    @PostMapping("/attendance/check-in/{id}")
    public ResponseEntity<Attendance> checkIn(@PathVariable String id) {
        return new ResponseEntity<>(staffService.clockIn(id), HttpStatus.CREATED);
    }

    @PutMapping("/attendance/check-out/{id}")
    public ResponseEntity<Attendance> checkOut(@PathVariable String id) {
        return new ResponseEntity<>(staffService.clockOut(id), HttpStatus.OK);
    }

    // ── Admin: Today's all attendance ─────────────────────────────────────────
    @GetMapping("/attendance/today")
    public ResponseEntity<List<Attendance>> getTodayAttendance() {
        return ResponseEntity.ok(staffService.getTodayAttendance());
    }

    // ── Admin: Get attendance by staffId ─────────────────────────────────────
    @GetMapping("/attendance/{id}")
    public ResponseEntity<List<Attendance>> getStaffAttendance(@PathVariable String id) {
        return ResponseEntity.ok(staffService.getStaffAttendance(id));
    }

    // ── Admin: Salary report by staffId ──────────────────────────────────────
    @GetMapping("/salary-report/{id}")
    public ResponseEntity<Map<String, Object>> getSalaryReport(
            @PathVariable String id,
            @RequestParam int month,
            @RequestParam int year) {
        return ResponseEntity.ok(staffService.calculateMonthlySalary(id, month, year));
    }

    // ── Self: My today's attendance ───────────────────────────────────────────
    @GetMapping("/attendance/my/today")
    public ResponseEntity<?> getMyTodayAttendance(Authentication auth) {
        try {
            Attendance att = staffService.getMyTodayAttendance(auth.getName());
            return ResponseEntity.ok(att);
        } catch (Exception e) {
            return ResponseEntity.ok(null);
        }
    }

    // ── Self: My monthly attendance ───────────────────────────────────────────
    @GetMapping("/attendance/my/month")
    public ResponseEntity<List<Attendance>> getMyMonthAttendance(
            Authentication auth,
            @RequestParam int month,
            @RequestParam int year) {
        try {
            return ResponseEntity.ok(
                    staffService.getMyMonthAttendance(auth.getName(), month, year));
        } catch (Exception e) {
            return ResponseEntity.ok(List.of());
        }
    }

    // ── Self: My salary report ────────────────────────────────────────────────
    @GetMapping("/salary-report/my")
    public ResponseEntity<?> getMySalaryReport(
            Authentication auth,
            @RequestParam int month,
            @RequestParam int year) {
        try {
            return ResponseEntity.ok(
                    staffService.getMySalaryReport(auth.getName(), month, year));
        } catch (Exception e) {
            return ResponseEntity.ok(null);
        }
    }

    // ── Self: Clock In own attendance ─────────────────────────────────────────
    @PostMapping("/attendance/my/check-in")
    public ResponseEntity<?> myCheckIn(Authentication auth) {
        return staffRepository.findByUsername(auth.getName())
                .map(staff -> new ResponseEntity<>(
                        (Object) staffService.clockIn(staff.getId()), HttpStatus.CREATED))
                .orElse(ResponseEntity.status(404).build());
    }

    // ── Self: Clock Out own attendance ────────────────────────────────────────
    @PutMapping("/attendance/my/check-out")
    public ResponseEntity<?> myCheckOut(Authentication auth) {
        return staffRepository.findByUsername(auth.getName())
                .map(staff -> new ResponseEntity<>(
                        (Object) staffService.clockOut(staff.getId()), HttpStatus.OK))
                .orElse(ResponseEntity.status(404).build());
    }

    // ── Self: Change password ─────────────────────────────────────────────────
    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(
            Authentication auth,
            @RequestBody Map<String, String> body) {
        String currentPassword = body.get("currentPassword");
        String newPassword     = body.get("newPassword");

        if (newPassword == null || newPassword.length() < 4) {
            return ResponseEntity.badRequest().body("Password must be at least 4 characters.");
        }

        return userRepository.findByUsername(auth.getName())
                .map(user -> {
                    if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
                        return ResponseEntity.status(403).body("Current password is incorrect.");
                    }
                    user.setPassword(passwordEncoder.encode(newPassword));
                    userRepository.save(user);
                    return ResponseEntity.ok("Password changed successfully.");
                })
                .orElse(ResponseEntity.status(404).body("User not found."));
    }
}