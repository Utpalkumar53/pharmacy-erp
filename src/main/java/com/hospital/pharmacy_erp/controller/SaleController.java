package com.hospital.pharmacy_erp.controller;

import com.hospital.pharmacy_erp.entity.Sale;
import com.hospital.pharmacy_erp.repository.SaleRepository;
import com.hospital.pharmacy_erp.service.PdfService;
import com.hospital.pharmacy_erp.service.SaleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sales")
public class SaleController {

    @Autowired
    private SaleService saleService;

    @Autowired
    private PdfService pdfService;


    @GetMapping("/print/{id}")
    public ResponseEntity<byte[]> printInvoice(@PathVariable String id) {
        // Just get the sale directly from the service
        Sale sale = saleService.getSaleById(id);

        // If the service returns null instead of throwing an error, check it here:
        if (sale == null) {
            throw new RuntimeException("Sale record not found for ID: " + id);
        }

        byte[] pdfContents = pdfService.generateInvoice(sale);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "Invoice_" + id + ".pdf");
        headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

        return new ResponseEntity<>(pdfContents, headers, HttpStatus.OK);
    }

    @GetMapping
    public ResponseEntity<List<Sale>> getAllSales() {
        List<Sale> saleList = saleService.getAllSales();
        return new ResponseEntity<>(saleList, HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Sale> getById(@PathVariable String id) {
        // This is where the service method gets "Used"
        return ResponseEntity.ok(saleService.getSaleById(id));
    }

    @PostMapping
    public ResponseEntity<Sale> addSale(@RequestBody Sale sale) {
        // Automatically set the person who is logged in as the biller
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        sale.setBilledBy(currentUsername);

        Sale savedSale = saleService.createSale(sale);
        return new ResponseEntity<>(savedSale, HttpStatus.CREATED);
    }
}