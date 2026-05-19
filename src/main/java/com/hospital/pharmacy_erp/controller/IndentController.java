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
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/indents")
@RequiredArgsConstructor
public class IndentController {

    private final IndentService indentService;
    private final IndentRepository indentRepository;

    // ── Raise indent ──────────────────────────────────────────────────────────
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST', 'NURSE')")
    @PostMapping
    public ResponseEntity<Indent> raiseRequest(
            @RequestBody Indent indent,
            Authentication auth) {
        String username = auth.getName();
        String role     = auth.getAuthorities().iterator().next().getAuthority();
        return new ResponseEntity<>(
                indentService.createIndent(indent, username, role),
                HttpStatus.CREATED
        );
    }

    // ── Issue indent (partial supported) ─────────────────────────────────────
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
    @PutMapping("/issue/{id}")
    public ResponseEntity<Indent> finalizeIssue(
            @PathVariable String id,
            Authentication auth) {
        // Pass issuer's username to service for audit trail
        return ResponseEntity.ok(indentService.issueIndent(id, auth.getName()));
    }

    // ── Cancel indent (with reason body) ─────────────────────────────────────
    @PreAuthorize("hasAnyRole('ADMIN', 'NURSE', 'PHARMACIST')")
    @PutMapping("/cancel/{id}")
    public ResponseEntity<Indent> cancelIndent(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, String> body,
            Authentication auth) {

        String reason = (body != null) ? body.get("reason") : null;
        return ResponseEntity.ok(indentService.cancelIndent(id, reason, auth.getName()));
    }

    // ── All indents (admin/pharmacist) ────────────────────────────────────────
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
    @GetMapping
    public ResponseEntity<List<Indent>> getAllIndents() {
        return ResponseEntity.ok(
                indentRepository.findAll(Sort.by(Sort.Direction.DESC, "requestDate"))
        );
    }

    // ── Nurse: only own indents ───────────────────────────────────────────────
    @PreAuthorize("hasAnyRole('NURSE', 'ADMIN', 'PHARMACIST')")
    @GetMapping("/my")
    public ResponseEntity<List<Indent>> getMyIndents(Authentication auth) {
        String username = auth.getName();
        return ResponseEntity.ok(
                indentRepository.findAll().stream()
                        .filter(i -> username.equals(i.getEnteredBy())
                                || username.equals(i.getRequestedBy())
                                || (i.getEnteredBy() != null && i.getEnteredBy().equalsIgnoreCase(username))
                                || (i.getRequestedBy() != null && i.getRequestedBy().equalsIgnoreCase(username)))
                        .sorted((a, b) -> b.getRequestDate().compareTo(a.getRequestDate()))
                        .collect(Collectors.toList())
        );
    }

    // ── Pending only ──────────────────────────────────────────────────────────
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
    @GetMapping("/pending")
    public ResponseEntity<List<Indent>> getPendingIndents() {
        return ResponseEntity.ok(
                indentRepository.findAll().stream()
                        .filter(i -> "PENDING".equals(i.getStatus()))
                        .sorted((a, b) -> b.getRequestDate().compareTo(a.getRequestDate()))
                        .collect(Collectors.toList())
        );
    }


}