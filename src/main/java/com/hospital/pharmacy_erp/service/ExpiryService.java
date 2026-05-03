package com.hospital.pharmacy_erp.service;

import com.hospital.pharmacy_erp.entity.Medicine;
import com.hospital.pharmacy_erp.repository.MedicineRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ExpiryService {

    @Autowired
    private MedicineRepository medicineRepository;

    public List<Medicine> getExpiredMedicines() {
        Date today = new Date();
        return medicineRepository.findAll().stream()
                .filter(m -> m.getExpiryDate() != null
                        && m.getExpiryDate().before(today)) // ✅ .before() works with Date
                .collect(Collectors.toList());
    }

    public List<Medicine> getExpiringInWindow(int startDays, int endDays) {
        Date today = new Date();

        Calendar cal = Calendar.getInstance();
        cal.setTime(today);
        cal.add(Calendar.DAY_OF_YEAR, startDays);
        Date startDate = cal.getTime();

        cal.setTime(today);
        cal.add(Calendar.DAY_OF_YEAR, endDays);
        Date endDate = cal.getTime();

        return medicineRepository.findAll().stream()
                .filter(m -> m.getExpiryDate() != null)
                .filter(m -> !m.getExpiryDate().before(startDate)  // ✅ .before() works
                        && m.getExpiryDate().before(endDate))
                .collect(Collectors.toList());
    }
}