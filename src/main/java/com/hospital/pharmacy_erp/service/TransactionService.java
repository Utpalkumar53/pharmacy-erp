package com.hospital.pharmacy_erp.service;

import com.hospital.pharmacy_erp.entity.StockTransaction;
import com.hospital.pharmacy_erp.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import java.util.Date;
import java.util.List;

@Service
public class TransactionService {

    @Autowired
    private TransactionRepository transactionRepository;

    public void logTransaction(String medName, String batchNo, String type, int qtyChanged, int remainingStock, String refNo) {
        StockTransaction tx = new StockTransaction();
        tx.setMedicineName(medName);
        tx.setBatchNo(batchNo);
        tx.setTransactionType(type);
        tx.setQuantityChanged(qtyChanged);
        tx.setRemainingStock(remainingStock);
        tx.setReferenceNo(refNo);
        tx.setTimestamp(new Date());

        // Capture logged-in user
        try {
            String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
            tx.setPerformedBy(currentUser);
        } catch (Exception e) {
            tx.setPerformedBy("SYSTEM");
        }

        transactionRepository.save(tx);
    }

    public List<StockTransaction> getAllTransactions() {
        return transactionRepository.findAllByOrderByTimestampDesc();
    }
}