package com.hospital.pharmacy_erp.repository;

import com.hospital.pharmacy_erp.entity.PurchaseReturn;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PurchaseReturnRepository extends MongoRepository<PurchaseReturn, String> {
}