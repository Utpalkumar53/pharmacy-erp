package com.hospital.pharmacy_erp.repository;

import com.hospital.pharmacy_erp.entity.Sale;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface SaleRepository extends MongoRepository<Sale,String> {

    List<Sale> findByBilledBy(String billedBy);
}
