package com.hospital.pharmacy_erp.service;

import com.hospital.pharmacy_erp.entity.Medicine;
import com.hospital.pharmacy_erp.repository.MedicineRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class AlertService {

    @Autowired
    private MedicineRepository medicineRepository;

    // List all medicines that are already expired
    public List<Medicine> getExpiredList() {
        return medicineRepository.findAll().stream()
                .filter(m -> m.getExpiryDate() != null && m.getExpiryDate().isBefore(LocalDate.now()))
                .toList();
    }

    // List medicines reaching threshold (Safety Stock)
    public List<Medicine> getReorderList() {
        return medicineRepository.findAll().stream()
                .filter(m -> m.getStockQuantity() < m.getMinStockLevel())
                .toList();
    }
}