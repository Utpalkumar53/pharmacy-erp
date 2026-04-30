package com.hospital.pharmacy_erp.controller;

import com.hospital.pharmacy_erp.entity.PurchaseOrder;
import com.hospital.pharmacy_erp.service.PurchaseOrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/purchases")
public class PurchaseController {

    @Autowired
    private PurchaseOrderService purchaseOrderService;

   @PostMapping("/receive") // Added path to match the logic of receiving stock
   public ResponseEntity<PurchaseOrder> createPurchaseOrder(@RequestBody PurchaseOrder purchaseOrder){
       PurchaseOrder purchaseOrders = purchaseOrderService.saveOrder(purchaseOrder);
       return new ResponseEntity<>(purchaseOrders, HttpStatus.CREATED);
   }
}
