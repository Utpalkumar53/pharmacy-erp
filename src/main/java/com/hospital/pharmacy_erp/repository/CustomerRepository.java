package com.hospital.pharmacy_erp.repository;

import com.hospital.pharmacy_erp.entity.Customer;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface CustomerRepository extends MongoRepository<Customer, String> {
    List<Customer> findByNameContainingIgnoreCaseOrPhoneContaining(String name, String phone);
}
