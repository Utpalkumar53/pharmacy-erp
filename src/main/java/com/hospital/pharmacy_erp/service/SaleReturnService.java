package com.hospital.pharmacy_erp.service;

import com.hospital.pharmacy_erp.entity.*;
import com.hospital.pharmacy_erp.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class SaleReturnService {

    @Autowired
    private SaleRepository saleRepository;
    @Autowired
    private SaleReturnRepository returnRepository;
    @Autowired
    private MedicineRepository medicineRepository;
    @Autowired
    private CustomerRepository customerRepository;
    @Autowired
    private TransactionService transactionService;

    @Transactional
    public SaleReturn processReturn(String saleId, List<ReturnItem> itemsToReturn, String reason, String pharmacist) {
        // 1. Find Original Sale
        Sale originalSale = saleRepository.findById(saleId)
                .orElseThrow(() -> new RuntimeException("Original Sale not found"));

        double refundTotal = 0.0;

        //2. Process Items and Restore Stock
        for (ReturnItem item : itemsToReturn) {
            // Find the item in the original sale to get the TRUE price paid
            SaleItem originalItem = originalSale.getSaleItems().stream()
                    .filter(si -> si.getMedicineId().equals(item.getMedicineId()))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Medicine not found in original sale"));

            Medicine med = medicineRepository.findById(item.getMedicineId()).orElse(null);
            if (med != null) {
                int newStock = med.getStockQuantity() + item.getQuantityReturned();
                med.setStockQuantity(newStock);
                medicineRepository.save(med);

                item.setMedicineName(med.getName());
                item.setUnitPrice(originalItem.getUnitPrice());
                item.setSubTotal(item.getQuantityReturned() * originalItem.getUnitPrice());
                refundTotal += item.getSubTotal();

                // ✅ Log to Stock Ledger
                transactionService.logTransaction(
                        med.getName(),
                        med.getBatchNo(),
                        "SALE_RETURN",
                        +item.getQuantityReturned(),
                        newStock,
                        pharmacist      // ← this is already available as method parameter
                );
            }
        }

        // 3. Handle Credit/Balance Adjustment (Using standard if to avoid lambda final error)
        if (originalSale.isCreditSale() && originalSale.getCustomerId() != null) {
            Optional<Customer> customerOpt = customerRepository.findById(originalSale.getCustomerId());

            if (customerOpt.isPresent()) {
                Customer customer = customerOpt.get();
                // Logic: Return money means the customer owes LESS now
                double currentOwed = customer.getOutstandingBalance();
                double newBalance = currentOwed - refundTotal;

                customer.setOutstandingBalance(Math.max(0, newBalance)); // Prevent negative balance
                customerRepository.save(customer);
            }
        }

        // 4. Create and Save the Return Document
        SaleReturn saleReturn = new SaleReturn();
        saleReturn.setOriginalSaleId(saleId);
        saleReturn.setCustomerName(originalSale.getCustomerName());
        saleReturn.setReturnedItems(itemsToReturn);
        saleReturn.setTotalRefundAmount(round(refundTotal));
        saleReturn.setReturnDate(LocalDateTime.now());
        saleReturn.setReason(reason);
        saleReturn.setProcessedBy(pharmacist);

        return returnRepository.save(saleReturn);
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}