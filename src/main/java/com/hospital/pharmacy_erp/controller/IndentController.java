package com.hospital.pharmacy_erp.controller;

import com.hospital.pharmacy_erp.entity.Indent;
import com.hospital.pharmacy_erp.service.IndentService;
import com.hospital.pharmacy_erp.repository.IndentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/indents")
@RequiredArgsConstructor
// Remove @CrossOrigin — CORS is already handled globally in SecurityConfig
public class IndentController {

    private final IndentService indentService;
    private final IndentRepository indentRepository;

    // Nurse/Pharmacist/Admin raises an indent
    // Username comes from JWT — no more X-User header needed
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST', 'NURSE')")
    @PostMapping
    public ResponseEntity<Indent> raiseRequest(
            @RequestBody Indent indent,
            Authentication auth) {                        // ← injected from JWT automatically
        String username = auth.getName();
        String role = auth.getAuthorities().iterator().next().getAuthority(); // e.g. ROLE_NURSE
        return new ResponseEntity<>(
                indentService.createIndent(indent, username, role),
                HttpStatus.CREATED
        );
    }

    // Only pharmacist/admin can issue
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
    @PutMapping("/issue/{id}")
    public ResponseEntity<Indent> finalizeIssue(@PathVariable String id) {
        return ResponseEntity.ok(indentService.issueIndent(id));
    }

    // All authenticated roles can view
    @GetMapping
    public ResponseEntity<List<Indent>> getAllIndents() {
        return ResponseEntity.ok(
                indentRepository.findAll(Sort.by(Sort.Direction.DESC, "requestDate"))
        );
    }

    // Nurse sees only their own indents
    @PreAuthorize("hasAnyRole('NURSE', 'ADMIN', 'PHARMACIST')")
    @GetMapping("/my")
    public ResponseEntity<List<Indent>> getMyIndents(Authentication auth) {
        String username = auth.getName();                 // ← from JWT, no header needed
        return ResponseEntity.ok(
                indentRepository.findAll().stream()
                        .filter(i -> username.equals(i.getRequestedBy()))
                        .sorted((a, b) -> b.getRequestDate().compareTo(a.getRequestDate()))
                        .collect(Collectors.toList())
        );
    }

    @GetMapping("/pending")
    public ResponseEntity<List<Indent>> getPendingIndents() {
        return ResponseEntity.ok(
                indentRepository.findAll().stream()
                        .filter(i -> "PENDING".equals(i.getStatus()))
                        .sorted((a, b) -> b.getRequestDate().compareTo(a.getRequestDate()))
                        .collect(Collectors.toList())
        );
    }

    // Only nurse who owns it or admin can cancel
    @PreAuthorize("hasAnyRole('ADMIN', 'NURSE', 'PHARMACIST')")
    @PutMapping("/cancel/{id}")
    public ResponseEntity<Indent> cancelIndent(
            @PathVariable String id,
            Authentication auth) {
        Indent indent = indentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Indent not found"));
        if ("ISSUED".equals(indent.getStatus())) {
            return ResponseEntity.badRequest().build();
        }
        indent.setStatus("CANCELLED");
        return ResponseEntity.ok(indentRepository.save(indent));
    }
}