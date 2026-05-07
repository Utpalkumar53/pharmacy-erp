package com.hospital.pharmacy_erp.repository;

import com.hospital.pharmacy_erp.entity.Medicine;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;


public interface MedicineRepository extends MongoRepository<Medicine, String> {

    List<Medicine> findByCategory(String category);

    List<Medicine> findByStockQuantityLessThan(int threshold);

    List<Medicine> findByRackLocation(String rackLocation);

    // find all batches of a medicine, only those in stock, sorted by earliest expiry first
    List<Medicine> findByNameAndStockQuantityGreaterThanOrderByExpiryDateAsc(String name, int minStock);
}
