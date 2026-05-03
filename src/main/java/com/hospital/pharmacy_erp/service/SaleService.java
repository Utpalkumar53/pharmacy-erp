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

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Date; // 1. Use java.util.Date instead of LocalDate
import java.util.List;

@Service
public class SaleService {
    @Autowired private SaleRepository saleRepository;
    @Autowired private MedicineRepository medicineRepository;
    @Autowired private CustomerRepository customerRepository;

    @Transactional
    public Sale createSale(Sale sale) {
        double totalMrpSum = 0;
        Date today = new Date(); // 2. Get current timestamp as java.util.Date

        for (SaleItem item : sale.getSaleItems()) {
            Medicine medicine = medicineRepository.findById(item.getMedicineId())
                    .orElseThrow(() -> new RuntimeException("Medicine not found: " + item.getMedicineId()));

            item.setMedicineName(medicine.getName());
            item.setHsnCode(medicine.getHsnCode());

            // 1. FIXED EXPIRY CHECK: Use .before() for java.util.Date
            // ✅ Replace Instant with Date
            Date todays = new Date();
            if (medicine.getExpiryDate() != null
                    && medicine.getExpiryDate().before(todays)) {
                throw new RuntimeException(
                        "CRITICAL: Cannot sell expired medicine: "
                                + medicine.getName());
            }

            int currentStock = medicine.getStockQuantity();
            int requestedQty = item.getQuantity();
            int remainingAfterSale = currentStock - requestedQty;

            // 2. ABSOLUTE ZERO CHECK
            if (remainingAfterSale < 0) {
                throw new RuntimeException("OUT OF STOCK: " + medicine.getName() + " only has " + currentStock + " units left.");
            }

            // 3. SAFETY STOCK CHECK (Tiered Logic)
            if (remainingAfterSale < medicine.getMinStockLevel() && !sale.isEmergencySale()) {
                throw new RuntimeException("SAFETY ALERT: " + medicine.getName() +
                        " is reserved for emergencies. (Stock: " + currentStock + "). Switch to Emergency Mode to sell.");
            }

            item.setUnitPrice(medicine.getMrp());
            medicine.setStockQuantity(remainingAfterSale);
            medicineRepository.save(medicine);

            double rowTotal = requestedQty * medicine.getMrp();
            item.setSubTotal(rowTotal);
            totalMrpSum += rowTotal;
        }

        // GST math
        double taxAmount = calculateInclusiveGst(totalMrpSum, 0.05);

        sale.setTotalAmount(totalMrpSum);
        sale.setTotalTax(taxAmount);
        sale.setSubTotalAmount(totalMrpSum);
        sale.setSaleDate(LocalDateTime.now()); // Note: SaleDate can remain LocalDateTime if your Sale entity uses it

        if ("CREDIT".equalsIgnoreCase(sale.getPaymentMethod())) {
            processCreditSale(sale);
        }

        return saleRepository.save(sale);
    }

    private void processCreditSale(Sale sale) {
        if (sale.getCustomerId() == null) throw new RuntimeException("Customer ID required for credit sale");
        Customer customer = customerRepository.findById(sale.getCustomerId())
                .orElseThrow(() -> new RuntimeException("Customer not found"));
        customer.setOutstandingBalance(customer.getOutstandingBalance() + sale.getSubTotalAmount());
        customerRepository.save(customer);
    }

    private double calculateInclusiveGst(double totalAmount, double rate) {
        return totalAmount - (totalAmount / (1 + rate));
    }

    public List<Sale> getAllSales() { return saleRepository.findAll(); }
    public Sale getSaleById(String id) { return saleRepository.findById(id).orElse(null); }
}
//69ea5f249628be63753c72cf