package com.hospital.pharmacy_erp.repository;

import com.hospital.pharmacy_erp.entity.StockTransaction;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TransactionRepository extends MongoRepository<StockTransaction, String> {
    // Fetch all transactions sorted by newest first
    List<StockTransaction> findAllByOrderByTimestampDesc();

    // Optional: Fetch history for a specific medicine
    List<StockTransaction> findByMedicineNameIgnoreCaseOrderByTimestampDesc(String medicineName);
}