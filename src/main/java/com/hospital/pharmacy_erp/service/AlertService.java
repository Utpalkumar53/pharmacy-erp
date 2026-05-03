package com.hospital.pharmacy_erp.service;

import com.hospital.pharmacy_erp.entity.Medicine;
import com.hospital.pharmacy_erp.repository.MedicineRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AlertService {

    @Autowired
    private MedicineRepository medicineRepository;

    public List<Medicine> getExpiredList() {
        Date today = new Date();
        return medicineRepository.findAll().stream()
                .filter(m -> m.getExpiryDate() != null
                        && m.getExpiryDate().before(today)) // ✅
                .collect(Collectors.toList());
    }

    public List<Medicine> getReorderList() {
        return medicineRepository.findAll().stream()
                .filter(m -> m.getStockQuantity() < m.getMinStockLevel())
                .collect(Collectors.toList());
    }
}