package com.hospital.pharmacy_erp.repository;

import com.hospital.pharmacy_erp.entity.Supplier;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface SupplierRepository extends MongoRepository<Supplier, String> {
    List<Supplier> findByGstNumber(String gstNumber);
}
