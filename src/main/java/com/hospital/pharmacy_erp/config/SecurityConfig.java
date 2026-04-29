package com.hospital.pharmacy_erp.config;

import com.hospital.pharmacy_erp.service.UserDetailsServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private UserDetailsServiceImpl userDetailsService;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http.authorizeHttpRequests(request -> request
                        // 1. PUBLIC ENDPOINTS (Must be at the VERY top)
                        .requestMatchers("/api/public/**").permitAll()
                        .requestMatchers("/api/sales/print/**").permitAll() // Moved up to prevent the loop

                        // 2. SPECIFIC HR & STAFF RULES
                        .requestMatchers(HttpMethod.GET, "/api/staff/salary-report/**").hasRole("ADMIN")
                        .requestMatchers("/api/staff/attendance/**").hasAnyRole("ADMIN", "MANAGER", "PHARMACIST")
                        .requestMatchers(HttpMethod.POST, "/api/staff/**").hasRole("ADMIN")

                        // 3. HOSPITAL INDENTS
                        .requestMatchers(HttpMethod.POST, "/api/indents/**").hasAnyRole("ADMIN", "PHARMACIST", "NURSE")
                        .requestMatchers(HttpMethod.PUT, "/api/indents/issue/**").hasRole("ADMIN")

                        // 4. GENERAL DOMAIN RULES
                        .requestMatchers("/api/medicines/**").hasRole("ADMIN")
                        .requestMatchers("/api/suppliers/**").hasRole("ADMIN")
                        .requestMatchers("/api/sales/**").hasAnyRole("ADMIN", "PHARMACIST")
                        .requestMatchers("/api/finance/**").hasRole("ADMIN")
                        .requestMatchers("/api/expenses/**").hasRole("ADMIN")
                        .requestMatchers("/api/reports/**").hasAnyRole("ADMIN", "PHARMACIST")
                        .requestMatchers("/api/alerts/**").hasAnyRole("ADMIN", "PHARMACIST")
                        .requestMatchers("/api/customers/**").hasAnyRole("ADMIN", "PHARMACIST")
                        .requestMatchers("/api/returns/**").hasAnyRole("ADMIN", "PHARMACIST")

                        // 5. CATCH-ALL
                        .anyRequest().authenticated())
                .httpBasic(Customizer.withDefaults())
                .csrf(AbstractHttpConfigurer::disable)
                .build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}