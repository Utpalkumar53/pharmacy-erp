package com.hospital.pharmacy_erp.service;

import com.hospital.pharmacy_erp.entity.Attendance;
import com.hospital.pharmacy_erp.entity.Staff;
import com.hospital.pharmacy_erp.repository.AttendanceRepository;
import com.hospital.pharmacy_erp.repository.StaffRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class StaffService {

    @Autowired
    private StaffRepository staffRepository;

    @Autowired
    private AttendanceRepository attendanceRepository;

    public Staff addStaff(Staff staff) {
        staff.setJoiningDate(LocalDate.now());
        return staffRepository.save(staff);
    }

    public List<Staff> getAllStaff() {
        return staffRepository.findAll();
    }

    public Attendance clockIn(String staffId) {
        Staff staff = staffRepository.findById(staffId)
                .orElseThrow(() -> new RuntimeException("Staff member not found with ID: " + staffId));

        LocalDate today = LocalDate.now();

        // Check if already clocked in today
        boolean exists = attendanceRepository.findAll().stream()
                .anyMatch(a -> a.getStaffId().equals(staffId) && a.getDate().equals(today));

        if (exists) {
            throw new RuntimeException("Error: Staff already clocked in for today!");
        }

        Attendance attendance = new Attendance();
        attendance.setStaffId(staffId);
        attendance.setStaffName(staff.getName()); // Automatically get name from DB
        attendance.setDate(today);
        attendance.setCheckInTime(LocalTime.now());
        attendance.setStatus("PRESENT");

        return attendanceRepository.save(attendance);
    }

    public Attendance clockOut(String staffId) {
        LocalDate today = LocalDate.now();

        // Find today's attendance record that hasn't been checked out yet
        Attendance attendance = attendanceRepository.findAll().stream()
                .filter(a -> a.getStaffId().equals(staffId) && a.getDate().equals(today) && a.getCheckOutTime() == null)
                .findFirst()
                .orElseThrow(() -> new RuntimeException("No active check-in found for today."));

        attendance.setCheckOutTime(LocalTime.now());
        return attendanceRepository.save(attendance);
    }

    public Map<String, Object> calculateMonthlySalary(String staffId, int month, int year) {
        Staff staff = staffRepository.findById(staffId)
                .orElseThrow(() -> new RuntimeException("Staff member not found"));

        // 1. Get all attendance records for this staff in the specific month/year
        List<Attendance> monthlyRecords = attendanceRepository.findAll().stream()
                .filter(a -> a.getStaffId().equals(staffId) &&
                        a.getDate().getMonthValue() == month &&
                        a.getDate().getYear() == year &&
                        "PRESENT".equals(a.getStatus()))
                .toList();

        int daysPresent = monthlyRecords.size();
        int totalDaysInMonth = LocalDate.of(year, month, 1).lengthOfMonth();

        // 2. Math: (Monthly Salary / Total Days) * Days Present
        double perDaySalary = staff.getMonthlySalary() / totalDaysInMonth;
        double finalPay = perDaySalary * daysPresent;

        // 3. Prepare the Report
        Map<String, Object> report = new HashMap<>();
        report.put("staffName", staff.getName());
        report.put("role", staff.getRole());
        report.put("totalDaysInMonth", totalDaysInMonth);
        report.put("daysPresent", daysPresent);
        report.put("baseMonthlySalary", staff.getMonthlySalary());
        report.put("finalPayableAmount", Math.round(finalPay * 100.0) / 100.0); // Rounded to 2 decimals

        return report;
    }

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