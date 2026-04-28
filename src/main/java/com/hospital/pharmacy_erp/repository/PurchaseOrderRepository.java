package com.hospital.pharmacy_erp.repository;

import com.hospital.pharmacy_erp.entity.PurchaseOrder;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface PurchaseOrderRepository extends MongoRepository<PurchaseOrder,String> {
    List<PurchaseOrder> findBySupplierIdOrderByPurchaseDateDesc(String supplierId);
}
