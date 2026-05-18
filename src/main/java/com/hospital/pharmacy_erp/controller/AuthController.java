package com.hospital.pharmacy_erp.controller;

import com.hospital.pharmacy_erp.dto.LoginRequest;
import com.hospital.pharmacy_erp.dto.LoginResponse;
import com.hospital.pharmacy_erp.entity.User;
import com.hospital.pharmacy_erp.repository.UserRepository;
import com.hospital.pharmacy_erp.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    // React calls this on login form submit
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        // 1. Validates username + password against MongoDB
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(),
                        request.getPassword()
                )
        );

        // 2. Load user to get roles
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // 3. Generate JWT with roles embedded
        String token = jwtUtil.generateToken(user.getUsername(), user.getRoles());

        List<String> roles = user.getRoles().stream()
                .map(Enum::name)
                .collect(Collectors.toList());

        return ResponseEntity.ok(new LoginResponse(token, user.getUsername(), roles));
    }

    // React calls this on page refresh to check if token is still valid
    @GetMapping("/verify")
    public ResponseEntity<?> verifyToken(Authentication authentication) {
        if (authentication != null && authentication.isAuthenticated()) {
            return ResponseEntity.ok(Map.of(
                    "valid", true,
                    "username", authentication.getName()
            ));
        }
        return ResponseEntity.status(401).body(Map.of("valid", false));
    }
}