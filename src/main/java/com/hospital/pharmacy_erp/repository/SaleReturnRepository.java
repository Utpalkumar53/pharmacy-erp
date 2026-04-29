package com.hospital.pharmacy_erp.repository;

import com.hospital.pharmacy_erp.entity.SaleReturn;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface SaleReturnRepository extends MongoRepository<SaleReturn,String> {
}
