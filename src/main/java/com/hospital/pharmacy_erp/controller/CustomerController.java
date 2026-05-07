package com.hospital.pharmacy_erp.controller;

import com.hospital.pharmacy_erp.entity.Customer;
import com.hospital.pharmacy_erp.repository.CustomerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customers")
@CrossOrigin(origins = "http://localhost:3000") // Added CORS configuration
public class CustomerController {

    @Autowired
    private CustomerRepository customerRepository;

    @PostMapping
    public ResponseEntity<Customer> createCustomer(@RequestBody Customer customer) {
        if (customer.getOutstandingBalance() < 0) {
            customer.setOutstandingBalance(0);
        }
        Customer savedCustomer = customerRepository.save(customer);
        return new ResponseEntity<>(savedCustomer, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<Customer>> getAllCustomers() {
        return ResponseEntity.ok(customerRepository.findAll());
    }

    @GetMapping("/search") // Dynamic autocomplete search handler
    public ResponseEntity<List<Customer>> searchCustomers(@RequestParam String query) {
        return ResponseEntity.ok(customerRepository.findByNameContainingIgnoreCaseOrPhoneContaining(query, query));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Customer> getCustomerById(@PathVariable String id) {
        return customerRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/pay")
    public ResponseEntity<Customer> recordPayment(@PathVariable String id, @RequestParam double amountPaid) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        double newBalance = customer.getOutstandingBalance() - amountPaid;
        // Math.max ensures balance never drops below ₹0.00
        customer.setOutstandingBalance(Math.max(0.0, newBalance));

        return ResponseEntity.ok(customerRepository.save(customer));
    }
}