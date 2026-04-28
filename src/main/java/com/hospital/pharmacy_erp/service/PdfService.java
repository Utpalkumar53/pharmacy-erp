package com.hospital.pharmacy_erp.service;

import com.hospital.pharmacy_erp.entity.Medicine;
import com.hospital.pharmacy_erp.entity.Sale;
import com.hospital.pharmacy_erp.entity.SaleItem;
import com.hospital.pharmacy_erp.repository.MedicineRepository;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;

@Service
public class PdfService {

    @Autowired
    private MedicineRepository medicineRepository;

    public byte[] generateInvoice(Sale sale) {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(baos);
        PdfDocument pdf = new PdfDocument(writer);
        Document document = new Document(pdf);

        // 1. Professional Header
        document.add(new Paragraph("UTPAL PHARMACY").setBold().setFontSize(22).setTextAlignment(TextAlignment.CENTER));
        document.add(new Paragraph("Dehradun, Uttarakhand | GSTIN: 05ABCDE1234F1Z5").setTextAlignment(TextAlignment.CENTER).setFontSize(10));
        document.add(new Paragraph("DL No: UK-123456789 | Phone: +91-9708483563").setTextAlignment(TextAlignment.CENTER).setFontSize(10));
        document.add(new Paragraph("\nTAX INVOICE").setBold().setUnderline().setTextAlignment(TextAlignment.CENTER));
        document.add(new Paragraph("----------------------------------------------------------------------------------------------------------------"));

        // 2. Formatted Details
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd-MMM-yyyy hh:mm a");
        String formattedDate = sale.getSaleDate().format(formatter);

        document.add(new Paragraph("Invoice No: " + sale.getId()).setBold().setFontSize(10));
        document.add(new Paragraph("Customer: " + (sale.getCustomerName() != null ? sale.getCustomerName() : "Cash Sale")).setFontSize(10));
        document.add(new Paragraph("Date: " + formattedDate).setFontSize(10));
        document.add(new Paragraph("\n"));

        // 3. Medicine Table (Added HSN Column)
        Table table = new Table(UnitValue.createPercentArray(new float[]{35, 15, 10, 15, 10, 15}));
        table.setWidth(UnitValue.createPercentValue(100));

        table.addHeaderCell(new Paragraph("Item Name").setBold().setFontSize(10));
        table.addHeaderCell(new Paragraph("HSN").setBold().setFontSize(10));
        table.addHeaderCell(new Paragraph("Qty").setBold().setFontSize(10));
        table.addHeaderCell(new Paragraph("MRP").setBold().setFontSize(10));
        table.addHeaderCell(new Paragraph("GST%").setBold().setFontSize(10));
        table.addHeaderCell(new Paragraph("Total").setBold().setFontSize(10));

        for (SaleItem item : sale.getSaleItems()) {
            Medicine med = medicineRepository.findById(item.getMedicineId()).orElse(null);

            table.addCell(new Paragraph(item.getMedicineName()).setFontSize(9));
            table.addCell(new Paragraph(med != null ? med.getHsnCode() : "---").setFontSize(9));
            table.addCell(new Paragraph(String.valueOf(item.getQuantity())).setFontSize(9));
            table.addCell(new Paragraph("Rs. " + item.getUnitPrice()).setFontSize(9));
            table.addCell(new Paragraph((med != null ? med.getGstPercentage() : "12") + "%").setFontSize(9));
            table.addCell(new Paragraph("Rs. " + (item.getQuantity() * item.getUnitPrice())).setFontSize(9));
        }

        document.add(table);

        // 4. Financial Summary
        document.add(new Paragraph("\n---------------------------------------------------------------------------------------------------------------------------"));
        document.add(new Paragraph("Taxable Amount: Rs. " + (sale.getTotalAmount() - sale.getTotalTax())).setFontSize(10).setTextAlignment(TextAlignment.RIGHT));
        document.add(new Paragraph("GST Amount: Rs. " + sale.getTotalTax()).setFontSize(10).setTextAlignment(TextAlignment.RIGHT));
        document.add(new Paragraph("Grand Total: Rs. " + sale.getTotalAmount()).setBold().setFontSize(14).setTextAlignment(TextAlignment.RIGHT));

        // 5. Signature Section
        document.add(new Paragraph("\n\nBilled By: " + (sale.getBilledBy() != null ? sale.getBilledBy() : "System")).setFontSize(10));
        document.add(new Paragraph("\nFor UTPAL PHARMACY\n\n\n(Authorized Signatory)").setTextAlignment(TextAlignment.RIGHT).setFontSize(10));

        document.close();
        return baos.toByteArray();
    }
}