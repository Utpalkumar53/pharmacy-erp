package com.hospital.pharmacy_erp.repository;

import com.hospital.pharmacy_erp.entity.Indent;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface IndentRepository extends MongoRepository<Indent, String> {
}
