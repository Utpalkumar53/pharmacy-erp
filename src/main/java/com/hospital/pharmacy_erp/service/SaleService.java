package com.hospital.pharmacy_erp.service;

import com.hospital.pharmacy_erp.entity.Customer;
import com.hospital.pharmacy_erp.entity.Medicine;
import com.hospital.pharmacy_erp.entity.Sale;
import com.hospital.pharmacy_erp.entity.SaleItem;
import com.hospital.pharmacy_erp.repository.CustomerRepository;
import com.hospital.pharmacy_erp.repository.MedicineRepository;
import com.hospital.pharmacy_erp.repository.SaleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;
import java.util.UUID;

@Service
public class SaleService {

    @Autowired
    private SaleRepository saleRepository;
    @Autowired
    private MedicineRepository medicineRepository;
    @Autowired
    private CustomerRepository customerRepository;
    @Autowired
    private TransactionService transactionService;

    @Transactional
    public Sale createSale(Sale sale) {
        double totalMrpSum = 0;

        if (sale.getId() == null || sale.getId().isEmpty()) {
            sale.setId(UUID.randomUUID().toString()
                    .replace("-", "").substring(0, 24));
        }

        for (SaleItem item : sale.getSaleItems()) {
            Medicine medicine = medicineRepository.findById(item.getMedicineId())
                    .orElseThrow(() -> new RuntimeException(
                            "Medicine not found: " + item.getMedicineId()));

            item.setMedicineName(medicine.getName());
            item.setHsnCode(medicine.getHsnCode());

            Date today = new Date();
            if (medicine.getExpiryDate() != null
                    && medicine.getExpiryDate().before(today)) {
                throw new RuntimeException(
                        "CRITICAL: Cannot sell expired medicine: "
                                + medicine.getName());
            }

            int currentStock = medicine.getStockQuantity();
            int requestedQty = item.getQuantity();
            int remainingAfterSale = currentStock - requestedQty;

            if (remainingAfterSale < 0) {
                throw new RuntimeException("OUT OF STOCK: " + medicine.getName()
                        + " only has " + currentStock + " units left.");
            }

            if (remainingAfterSale < medicine.getMinStockLevel()
                    && !sale.isEmergencySale()) {
                throw new RuntimeException("SAFETY ALERT: " + medicine.getName()
                        + " is reserved for emergencies. (Stock: " + currentStock
                        + "). Switch to Emergency Mode to sell.");
            }

            item.setUnitPrice(medicine.getMrp());
            medicine.setStockQuantity(remainingAfterSale);
            medicineRepository.save(medicine);

            transactionService.logTransaction(
                    medicine.getName(),
                    medicine.getBatchNo(),
                    "SALE",
                    -requestedQty,
                    remainingAfterSale,
                    sale.getId()
            );

            double rowTotal = requestedQty * medicine.getMrp();
            item.setSubTotal(rowTotal);
            totalMrpSum += rowTotal;
        }

        double taxAmount = calculateInclusiveGst(totalMrpSum, 0.05);

        sale.setTotalAmount(totalMrpSum);
        sale.setTotalTax(taxAmount);
        sale.setSubTotalAmount(totalMrpSum);
        sale.setSaleDate(LocalDateTime.now());

        // ✅ Handle finalAmount and roundOff
        if (sale.getFinalAmount() == 0) {
            // Fallback: if frontend didn't send finalAmount use rounded total
            sale.setFinalAmount(Math.round(totalMrpSum));
        }
        sale.setRoundOff(sale.getFinalAmount() - totalMrpSum);

        if ("CREDIT".equalsIgnoreCase(sale.getPaymentMethod())) {
            processCreditSale(sale);
        }

        return saleRepository.save(sale);
    }

    private void processCreditSale(Sale sale) {
        if (sale.getCustomerId() == null || sale.getCustomerId().isEmpty()) {
            throw new RuntimeException(
                    "Customer ID required for credit (Udhaar) sale");
        }
        Customer customer = customerRepository.findById(sale.getCustomerId())
                .orElseThrow(() -> new RuntimeException(
                        "Linked customer profile not found in database"));

        // ✅ Use finalAmount for Udhaar balance tracking
        double chargedAmount = sale.getFinalAmount() > 0
                ? sale.getFinalAmount()
                : sale.getSubTotalAmount();

        customer.setOutstandingBalance(
                customer.getOutstandingBalance() + chargedAmount);
        customerRepository.save(customer);
    }

    private double calculateInclusiveGst(double totalAmount, double rate) {
        return totalAmount - (totalAmount / (1 + rate));
    }

    public List<Sale> getAllSales() {
        return saleRepository.findAll();
    }

    public Sale getSaleById(String id) {
        return saleRepository.findById(id).orElse(null);
    }
}