package com.hospital.pharmacy_erp.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoDatabase;
import org.bson.Document; // This is the MongoDB Document
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.UnitValue;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import java.io.FileOutputStream;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class BackupService {

    private final MongoClient mongoClient;

    @Value("${backup.dir}")
    private String backupDir;

    private static final String DB_NAME = "pharmacy_erp";

    public BackupService(MongoClient mongoClient) {
        this.mongoClient = mongoClient;
    }

    // ✅ JSON Backup Logic (For Data Recovery)
    public File createBackup() throws IOException {
        MongoDatabase database = mongoClient.getDatabase(DB_NAME);
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm-ss"));
        String fileName = "backup_" + timestamp + ".json";

        Path backupPath = Paths.get(backupDir);
        Files.createDirectories(backupPath);
        File backupFile = backupPath.resolve(fileName).toFile();

        Map<String, Object> exportMap = new LinkedHashMap<>();
        for (String collectionName : database.listCollectionNames()) {
            List<String> jsonDocs = new ArrayList<>();
            for (Document doc : database.getCollection(collectionName).find()) {
                jsonDocs.add(doc.toJson());
            }
            exportMap.put(collectionName, jsonDocs);
        }

        ObjectMapper mapper = new ObjectMapper();
        mapper.enable(SerializationFeature.INDENT_OUTPUT);
        mapper.writeValue(backupFile, exportMap);

        return backupFile;
    }

    // ✅ PDF Report Logic (For Father to Read on Email)
    public File createPdfReport() throws IOException {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm"));
        String fileName = "Pharma_Report_" + timestamp + ".pdf";

        Path backupPath = Paths.get(backupDir);
        Files.createDirectories(backupPath);
        File pdfFile = backupPath.resolve(fileName).toFile();

        PdfWriter writer = new PdfWriter(pdfFile);
        PdfDocument pdf = new PdfDocument(writer);

        // Use full path here to avoid conflict with org.bson.Document
        com.itextpdf.layout.Document layoutDoc = new com.itextpdf.layout.Document(pdf);

        layoutDoc.add(new Paragraph("Pharma-ERP Inventory Status Report")
                .setBold()
                .setFontSize(18));

        layoutDoc.add(new Paragraph("Generated on: " + LocalDateTime.now() + "\n\n"));

        // Create Table: 4 columns (Name, Batch, Stock, Expiry)
        float[] columnWidths = {200f, 100f, 80f, 120f};
        Table table = new Table(UnitValue.createPointArray(columnWidths));

        table.addHeaderCell("Medicine Name");
        table.addHeaderCell("Batch");
        table.addHeaderCell("Stock");
        table.addHeaderCell("Expiry");

        MongoDatabase database = mongoClient.getDatabase(DB_NAME);

        // Loop through medicines and add rows
        for (Document doc : database.getCollection("medicines").find()) {
            table.addCell(doc.getOrDefault("name", "N/A").toString());
            table.addCell(doc.getOrDefault("batchNo", "N/A").toString());
            table.addCell(String.valueOf(doc.getOrDefault("stockQuantity", 0)));
            table.addCell(doc.getOrDefault("expiryDate", "N/A").toString());
        }

        layoutDoc.add(table);
        layoutDoc.close(); // Success! Using itextpdf's close method

        return pdfFile;
    }

    public File createSalesExcelReport() throws IOException {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm"));
        String fileName = "Sales_Report_" + timestamp + ".xlsx";
        Path path = Paths.get(backupDir).resolve(fileName);

        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Sales History");

            // 1. Create Header Row
            Row headerRow = sheet.createRow(0);
            String[] columns = {"Date", "Customer", "Items Count", "Subtotal", "Tax", "Total Amount", "Billed By"};

            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);

            for (int i = 0; i < columns.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(columns[i]);
                cell.setCellStyle(headerStyle);
            }

            // 2. Fill Data from MongoDB
            MongoDatabase database = mongoClient.getDatabase(DB_NAME);
            int rowNum = 1;
            for (Document doc : database.getCollection("sales").find()) {
                Row row = sheet.createRow(rowNum++);

                row.createCell(0).setCellValue(doc.get("saleDate") != null ? doc.get("saleDate").toString() : "N/A");
                row.createCell(1).setCellValue(doc.getOrDefault("customerName", "Guest").toString());

                // Count items in the saleItem list
                List<?> items = (List<?>) doc.get("saleItems");
                row.createCell(2).setCellValue(items != null ? items.size() : 0);

                row.createCell(3).setCellValue(doc.getDouble("totalAmount") != null ? doc.getDouble("totalAmount") : 0.0);
                row.createCell(4).setCellValue(doc.getDouble("totalTax") != null ? doc.getDouble("totalTax") : 0.0);
                row.createCell(5).setCellValue(doc.getDouble("subTotalAmount") != null ? doc.getDouble("subTotalAmount") : 0.0);
                row.createCell(6).setCellValue(doc.getOrDefault("billedBy", "System").toString());
            }

            // Auto-size columns
            for (int i = 0; i < columns.length; i++) {
                sheet.autoSizeColumn(i);
            }

            try (FileOutputStream fileOut = new FileOutputStream(path.toFile())) {
                workbook.write(fileOut);
            }
        }
        return path.toFile();
    }
}