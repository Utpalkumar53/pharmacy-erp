package com.hospital.pharmacy_erp.repository;

import com.hospital.pharmacy_erp.entity.ActivityLog;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.repository.CrudRepository;

import java.util.List;

public interface ActivityLogRepository extends MongoRepository<ActivityLog,String> {
    List<ActivityLog> findByUsername(String username);
}
