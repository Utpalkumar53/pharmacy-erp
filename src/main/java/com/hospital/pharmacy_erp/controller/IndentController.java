package com.hospital.pharmacy_erp.controller;

import com.hospital.pharmacy_erp.entity.Indent;
import com.hospital.pharmacy_erp.service.IndentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/indents")
public class IndentController {
    @Autowired
    private IndentService indentService;

    @PostMapping
    public ResponseEntity<Indent> raiseRequest(
            @RequestBody Indent indent,
            @RequestHeader(value = "X-User", defaultValue = "Unknown") String user,
            @RequestHeader(value = "X-Role", defaultValue = "ROLE_NURSE") String role) {

        return new ResponseEntity<>(indentService.createIndent(indent, user, role), HttpStatus.CREATED);
    }

    @PutMapping("/issue/{id}")
    public ResponseEntity<Indent> finalizeIssue(@PathVariable String id) {
        // This is for the standard NURSE_APP -> PENDING flow
        // The service issueIndent method remains the same as before
        return ResponseEntity.ok(indentService.issueIndent(id));
    }
}
