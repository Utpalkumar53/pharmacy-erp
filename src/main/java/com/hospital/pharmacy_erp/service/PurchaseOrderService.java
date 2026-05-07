package com.hospital.pharmacy_erp.service;

import com.hospital.pharmacy_erp.entity.*;
import com.hospital.pharmacy_erp.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;

@Service
public class PurchaseOrderService {

    @Autowired private PurchaseOrderRepository purchaseOrderRepository;
    @Autowired private MedicineRepository medicineRepository;
    @Autowired private TransactionRepository stockTransactionRepository;

    @Transactional
    public PurchaseOrder saveOrder(PurchaseOrder order) {
        order.setPurchaseDate(LocalDateTime.now());
        double totalBill = 0;
        double totalTax  = 0;

        for (PurchaseItem item : order.getItems()) {

            Medicine med = medicineRepository.findAll().stream()
                    .filter(m -> m.getName().equalsIgnoreCase(item.getMedicineName()) &&
                            m.getBatchNo().equalsIgnoreCase(item.getBatchNo()))
                    .findFirst()
                    .orElse(null);

            int stockAfter;

            if (med != null) {
                // OPTION A: Existing batch — update stock, cost, MRP, and rack position
                med.setStockQuantity(med.getStockQuantity() + item.getQuantity());
                med.setCostPrice(item.getUnitCostPrice());
                if (item.getSellingPrice() > 0) {
                    med.setMrp(item.getSellingPrice()); // MRP = selling price, not cost
                }
                // ✅ Keep the physical shelf mapping updated if provided in the purchase order
                if (item.getRackNumber() != null && !item.getRackNumber().trim().isEmpty()) {
                    med.setRackLocation(item.getRackNumber());
                }
                medicineRepository.save(med);
                item.setMedicineId(med.getId());
                stockAfter = med.getStockQuantity();

            } else {
                // OPTION B: New batch — create inventory record
                Medicine newMed = new Medicine();
                newMed.setName(item.getMedicineName());
                newMed.setBatchNo(item.getBatchNo());
                newMed.setExpiryDate(item.getExpiryDate());
                newMed.setStockQuantity(item.getQuantity());
                newMed.setCostPrice(item.getUnitCostPrice());
                newMed.setMrp(item.getSellingPrice() > 0   // MRP = selling price
                        ? item.getSellingPrice()
                        : item.getUnitCostPrice());         // fallback if not provided
                newMed.setHsnCode(item.getHsnCode() != null ? item.getHsnCode() : "NA");

                // ✅ Explicitly cast 'double' GST from PurchaseItem to 'int' for Medicine
                newMed.setGstPercentage((int) item.getGstPercentage());

                // ✅ FIX: Extract the rack number from the purchase invoice and assign it to the new catalog item
                newMed.setRackLocation(item.getRackNumber() != null ? item.getRackNumber() : "N/A");

                Medicine savedNewMed = medicineRepository.save(newMed);
                item.setMedicineId(savedNewMed.getId());
                stockAfter = item.getQuantity();
            }

            // Log to stock ledger
            StockTransaction log = new StockTransaction();
            log.setMedicineName(item.getMedicineName());
            log.setBatchNo(item.getBatchNo());
            log.setTransactionType("PURCHASE_ADD");
            log.setQuantityChanged(+item.getQuantity());   // positive = stock in
            log.setRemainingStock(stockAfter);
            log.setReferenceNo(order.getInvoiceNumber());
            log.setTimestamp(new Date());
            log.setPerformedBy(order.getReceivedBy() != null ? order.getReceivedBy() : "system");
            stockTransactionRepository.save(log);

            // Calculations
            double lineSubTotal = item.getQuantity() * item.getUnitCostPrice();
            double lineTax      = lineSubTotal * (item.getGstPercentage() / 100);
            item.setTaxAmount(round(lineTax));
            item.setLineTotal(round(lineSubTotal + lineTax));
            totalBill += item.getLineTotal();
            totalTax  += item.getTaxAmount();
        }

        order.setTotalBillAmount(round(totalBill));
        order.setTotalInputTax(round(totalTax));
        return purchaseOrderRepository.save(order);
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    public List<PurchaseOrder> getAllOrders() {
        return purchaseOrderRepository.findAll();
    }
}