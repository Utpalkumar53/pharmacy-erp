package com.hospital.pharmacy_erp.service;

import com.hospital.pharmacy_erp.entity.Attendance;
import com.hospital.pharmacy_erp.entity.Staff;
import com.hospital.pharmacy_erp.entity.User;
import com.hospital.pharmacy_erp.enums.Role;
import com.hospital.pharmacy_erp.repository.AttendanceRepository;
import com.hospital.pharmacy_erp.repository.StaffRepository;
import com.hospital.pharmacy_erp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class StaffService {

    @Autowired private StaffRepository staffRepository;
    @Autowired private AttendanceRepository attendanceRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    // ── Role string → system Role enum ───────────────────────────────────────
    private Role mapRoleToEnum(String role) {
        if (role == null) return Role.EMPLOYEE;
        return switch (role.toUpperCase()) {
            case "MANAGER"    -> Role.ADMIN;
            case "PHARMACIST" -> Role.PHARMACIST;
            case "NURSE"      -> Role.NURSE;
            default           -> Role.EMPLOYEE;
        };
    }

    // ── Generate username from name ───────────────────────────────────────────
    private String generateUsername(String name) {
        return name.trim().toLowerCase().replaceAll("\\s+", "_");
    }

    // ── Add Staff + auto-create User account ─────────────────────────────────
    public Staff addStaff(Staff staff) {
        staff.setJoiningDate(LocalDate.now());

        String username = generateUsername(staff.getName());
        String finalUsername = username;
        int counter = 1;
        while (userRepository.findByUsername(finalUsername).isPresent()) {
            finalUsername = username + "_" + counter++;
        }

        staff.setUsername(finalUsername);
        Staff saved = staffRepository.save(staff);

        if (userRepository.findByUsername(finalUsername).isEmpty()) {
            User user = new User();
            user.setUsername(finalUsername);
            user.setPassword(passwordEncoder.encode(finalUsername));
            user.setRoles(List.of(mapRoleToEnum(staff.getRole())));
            user.setActive(true);
            userRepository.save(user);
        }

        return saved;
    }

    // ── Update Staff + sync User role ─────────────────────────────────────────
    public Staff updateStaff(String id, Staff updated) {
        Staff existing = staffRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Staff not found"));

        existing.setName(updated.getName());
        existing.setRole(updated.getRole());
        existing.setPhone(updated.getPhone());
        existing.setMonthlySalary(updated.getMonthlySalary());
        existing.setActive(updated.isActive());
        // username is NOT changed on update

        Staff saved = staffRepository.save(existing);

        // Sync role in User account
        if (existing.getUsername() != null) {
            userRepository.findByUsername(existing.getUsername()).ifPresent(user -> {
                user.setRoles(List.of(mapRoleToEnum(updated.getRole())));
                userRepository.save(user);
            });
        }

        return saved;
    }

    public List<Staff> getAllStaff() {
        return staffRepository.findAll();
    }

    // ── Clock In by staffId ───────────────────────────────────────────────────
    public Attendance clockIn(String staffId) {
        Staff staff = staffRepository.findById(staffId)
                .orElseThrow(() -> new RuntimeException("Staff not found: " + staffId));

        LocalDate today = LocalDate.now();
        boolean exists = attendanceRepository.findAll().stream()
                .anyMatch(a -> a.getStaffId().equals(staffId) && a.getDate().equals(today));
        if (exists) throw new RuntimeException("Already clocked in today!");

        Attendance att = new Attendance();
        att.setStaffId(staffId);
        att.setStaffName(staff.getName());
        att.setDate(today);
        att.setCheckInTime(LocalTime.now());
        att.setStatus("PRESENT");
        return attendanceRepository.save(att);
    }

    // ── Clock Out by staffId ──────────────────────────────────────────────────
    public Attendance clockOut(String staffId) {
        LocalDate today = LocalDate.now();
        Attendance att = attendanceRepository.findAll().stream()
                .filter(a -> a.getStaffId().equals(staffId)
                        && a.getDate().equals(today)
                        && a.getCheckOutTime() == null)
                .findFirst()
                .orElseThrow(() -> new RuntimeException("No active clock-in found."));
        att.setCheckOutTime(LocalTime.now());
        return attendanceRepository.save(att);
    }

    // ── Get today's attendance for logged-in user ─────────────────────────────
    public Attendance getMyTodayAttendance(String username) {
        Staff staff = staffRepository.findByUsername(username).orElse(null);
        if (staff == null) return null;

        LocalDate today = LocalDate.now();
        return attendanceRepository.findAll().stream()
                .filter(a -> a.getStaffId().equals(staff.getId())
                        && a.getDate().equals(today))
                .findFirst()
                .orElse(null);
    }

    // ── Get monthly attendance for logged-in user ─────────────────────────────
    public List<Attendance> getMyMonthAttendance(String username, int month, int year) {
        Staff staff = staffRepository.findByUsername(username).orElse(null);
        if (staff == null) return List.of();

        return attendanceRepository.findAll().stream()
                .filter(a -> a.getStaffId().equals(staff.getId())
                        && a.getDate().getMonthValue() == month
                        && a.getDate().getYear() == year)
                .toList();
    }

    // ── Salary report for logged-in user ──────────────────────────────────────
    public Map<String, Object> getMySalaryReport(String username, int month, int year) {
        Staff staff = staffRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Staff record not found for: " + username));
        return calculateMonthlySalary(staff.getId(), month, year);
    }

    // ── Salary report by staffId (admin use) ──────────────────────────────────
    public Map<String, Object> calculateMonthlySalary(String staffId, int month, int year) {
        Staff staff = staffRepository.findById(staffId)
                .orElseThrow(() -> new RuntimeException("Staff not found"));

        List<Attendance> records = attendanceRepository.findAll().stream()
                .filter(a -> a.getStaffId().equals(staffId)
                        && a.getDate().getMonthValue() == month
                        && a.getDate().getYear() == year
                        && "PRESENT".equals(a.getStatus()))
                .toList();

        int daysPresent = records.size();
        int totalDays   = LocalDate.of(year, month, 1).lengthOfMonth();
        double perDay   = staff.getMonthlySalary() / totalDays;
        double finalPay = Math.round(perDay * daysPresent * 100.0) / 100.0;

        Map<String, Object> report = new HashMap<>();
        report.put("staffName",          staff.getName());
        report.put("role",               staff.getRole());
        report.put("totalDaysInMonth",   totalDays);
        report.put("daysPresent",        daysPresent);
        report.put("baseMonthlySalary",  staff.getMonthlySalary());
        report.put("finalPayableAmount", finalPay);
        return report;
    }

    // ── Today's attendance (all staff, for admin dashboard) ───────────────────
    public List<Attendance> getTodayAttendance() {
        LocalDate today = LocalDate.now();
        return attendanceRepository.findAll().stream()
                .filter(a -> a.getDate().equals(today))
                .toList();
    }

    public List<Attendance> getStaffAttendance(String staffId) {
        return attendanceRepository.findAll().stream()
                .filter(a -> a.getStaffId().equals(staffId))
                .toList();
    }
}