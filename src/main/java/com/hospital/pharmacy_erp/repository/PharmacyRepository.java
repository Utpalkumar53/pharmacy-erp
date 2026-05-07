package com.hospital.pharmacy_erp.repository;

import com.hospital.pharmacy_erp.entity.PharmacyProfile;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PharmacyRepository extends MongoRepository<PharmacyProfile, String> {
    // No extra methods needed for now since we use findAll()
    // and save() which are built-in.
}