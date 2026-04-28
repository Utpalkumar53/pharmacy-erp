package com.hospital.pharmacy_erp.repository;

import com.hospital.pharmacy_erp.entity.Customer;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface CustomerRepository extends MongoRepository<Customer, String> {
}
