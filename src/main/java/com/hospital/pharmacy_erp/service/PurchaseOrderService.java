package com.hospital.pharmacy_erp.service;

import com.hospital.pharmacy_erp.entity.*;
import com.hospital.pharmacy_erp.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;

@Service
public class PurchaseOrderService {

    @Autowired private PurchaseOrderRepository purchaseOrderRepository;
    @Autowired private MedicineRepository medicineRepository;

    @Transactional
    public PurchaseOrder saveOrder(PurchaseOrder order) {
        order.setPurchaseDate(LocalDateTime.now());
        double totalBill = 0;
        double totalTax = 0;

        for (PurchaseItem item : order.getItems()) {
            Medicine med = medicineRepository.findById(item.getMedicineId())
                    .orElseThrow(() -> new RuntimeException("Medicine not found: " + item.getMedicineId()));

            // 1. Update Stock
            med.setStockQuantity(med.getStockQuantity() + item.getQuantity());

            // 2. Update Cost Price in Medicine (Important for pricing)
            med.setCostPrice(item.getUnitCostPrice());
            medicineRepository.save(med);

            // 3. Calculate Math for this line
            double lineSubTotal = item.getQuantity() * item.getUnitCostPrice();
            double lineTax = lineSubTotal * (item.getGstPercentage() / 100);

            item.setMedicineName(med.getName()); // Ensure name is correct
            item.setTaxAmount(round(lineTax));
            item.setLineTotal(round(lineSubTotal + lineTax));

            totalBill += item.getLineTotal();
            totalTax += item.getTaxAmount();
        }

        order.setTotalBillAmount(round(totalBill));
        order.setTotalInputTax(round(totalTax));

        return purchaseOrderRepository.save(order);
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}