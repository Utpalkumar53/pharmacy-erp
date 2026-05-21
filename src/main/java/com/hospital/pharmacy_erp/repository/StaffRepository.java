package com.hospital.pharmacy_erp.repository;

import com.hospital.pharmacy_erp.entity.Staff;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface StaffRepository extends MongoRepository<Staff, String> {
    Optional<Staff> findByUsername(String username);
}