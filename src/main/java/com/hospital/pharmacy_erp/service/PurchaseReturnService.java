package com.hospital.pharmacy_erp.service;

import com.hospital.pharmacy_erp.entity.*;
import com.hospital.pharmacy_erp.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class PurchaseReturnService {

    @Autowired
    private PurchaseReturnRepository returnRepository;
    @Autowired
    private MedicineRepository medicineRepository;
    @Autowired
    private TransactionService transactionService;

    @Transactional
    public PurchaseReturn processReturn(PurchaseReturn returnOrder) {
        returnOrder.setReturnDate(LocalDateTime.now());
        double grandTotal = 0;

        for (ReturnItem item : returnOrder.getItems()) {
            // 1. Find the medicine batch by ID (since your helper has medicineId)
            Medicine med = medicineRepository.findById(item.getMedicineId())
                    .orElseThrow(() -> new RuntimeException("Medicine not found: " + item.getMedicineName()));

            // 2. Validate if we actually have enough stock to return
            if (med.getStockQuantity() < item.getQuantityReturned()) {
                throw new RuntimeException("Insufficient stock to return " + item.getMedicineName());
            }

            // 3. Deduct the stock
            int oldStock = med.getStockQuantity();
            int newStock = oldStock - item.getQuantityReturned();
            med.setStockQuantity(newStock);
            medicineRepository.save(med);

            // 4. Log to your Stock Ledger (PURCHASE_RETURN type)
            transactionService.logTransaction(
                    med.getName(),
                    med.getBatchNo(),
                    "PURCHASE_RETURN",
                    -item.getQuantityReturned(), // Negative shift for ledger
                    newStock,
                    "Return for Inv: " + returnOrder.getReferenceInvoiceNo()
            );

            grandTotal += item.getSubTotal();
        }

        returnOrder.setTotalReturnAmount(grandTotal);
        return returnRepository.save(returnOrder);
    }

    // ✅ Add this method to resolve the error
    public List<PurchaseReturn> getAllReturns() {
        return returnRepository.findAll();
    }
}