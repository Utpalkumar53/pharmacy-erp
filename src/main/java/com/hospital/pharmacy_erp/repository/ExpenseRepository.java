package com.hospital.pharmacy_erp.repository;

import com.hospital.pharmacy_erp.entity.Expense;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Date;
import java.util.List;

public interface ExpenseRepository extends MongoRepository<Expense, String> {

}
