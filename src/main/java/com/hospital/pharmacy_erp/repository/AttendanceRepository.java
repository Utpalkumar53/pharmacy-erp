package com.hospital.pharmacy_erp.repository;

import com.hospital.pharmacy_erp.entity.Attendance;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface AttendanceRepository extends MongoRepository<Attendance, String> {
}
