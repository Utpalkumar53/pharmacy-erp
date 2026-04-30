package com.hospital.pharmacy_erp.service;

import com.hospital.pharmacy_erp.entity.Medicine;
import com.hospital.pharmacy_erp.repository.MedicineRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ExpiryService {

    @Autowired
    private MedicineRepository medicineRepository;

    // 1. Get medicines already expired
    public List<Medicine> getExpiredMedicines() {
        return medicineRepository.findAll().stream()
                .filter(m -> m.getExpiryDate() != null && m.getExpiryDate().isBefore(LocalDate.now()))
                .collect(Collectors.toList());
    }

    // 2. Get medicines expiring within 'X' days (e.g., 30 or 60 days)
    public List<Medicine> getExpiringSoon(int days) {
        LocalDate thresholdDate = LocalDate.now().plusDays(days);
        return medicineRepository.findAll().stream()
                .filter(m -> m.getExpiryDate() != null &&
                        m.getExpiryDate().isAfter(LocalDate.now()) &&
                        m.getExpiryDate().isBefore(thresholdDate))
                .collect(Collectors.toList());
    }
}