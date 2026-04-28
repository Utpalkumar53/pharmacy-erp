package com.hospital.pharmacy_erp.service;

import com.hospital.pharmacy_erp.entity.Medicine;
import com.hospital.pharmacy_erp.entity.PurchaseOrder;
import com.hospital.pharmacy_erp.repository.MedicineRepository;
import com.hospital.pharmacy_erp.repository.PurchaseOrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;


    @Transactional // This ensures if medicine update fails, the order isn't saved either!
    @Service
    public class PurchaseOrderService {

        @Autowired
        private PurchaseOrderRepository purchaseOrderRepository;

        @Autowired
        private MedicineRepository medicineRepository;

        @Transactional
        public PurchaseOrder saveOrder(PurchaseOrder order) {
            // 1. Set the date AUTOMATICALLY (This fixes your GST Report crash)
            order.setPurchaseDate(LocalDateTime.now());

            // 2. Find the medicine
            Optional<Medicine> medicineOpt = medicineRepository.findById(order.getMedicineId());

            if (medicineOpt.isPresent()) {
                Medicine medicine = medicineOpt.get();

                // 3. Update the Stock (Inventory Inward)
                int newStock = medicine.getStockQuantity() + order.getQuantityPurchased();
                medicine.setStockQuantity(newStock);

                // 4. Save both
                medicineRepository.save(medicine);
                return purchaseOrderRepository.save(order);
            } else {
                throw new RuntimeException("Medicine not found with ID: " + order.getMedicineId());
            }
        }


    }
