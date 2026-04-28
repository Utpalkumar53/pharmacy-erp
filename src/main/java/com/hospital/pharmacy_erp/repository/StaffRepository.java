package com.hospital.pharmacy_erp.repository;

import com.hospital.pharmacy_erp.entity.Staff;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface StaffRepository extends MongoRepository<Staff, String> {

}
