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
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.Arrays;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private UserDetailsServiceImpl userDetailsService;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                        .cors(Customizer.withDefaults()) // 1. Must stay to allow the React bridge
                        .csrf(AbstractHttpConfigurer::disable) // 2. Must stay to allow POST/PUT/DELETE from React
                        .authorizeHttpRequests(request -> request
                        // 1. PUBLIC ENDPOINTS (Must be at the VERY top//
                                .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/api/public/**").permitAll()
                        .requestMatchers("/api/sales/print/**").permitAll() // Moved up to prevent the loop

                        // 2. SPECIFIC HR & STAFF RULES
                        .requestMatchers(HttpMethod.GET, "/api/staff/salary-report/**").hasAuthority("ADMIN")
                        .requestMatchers("/api/staff/attendance/**").hasAnyAuthority("ADMIN", "MANAGER", "PHARMACIST")
                        .requestMatchers(HttpMethod.POST, "/api/staff/**").hasAuthority("ADMIN")

                        // 3. HOSPITAL INDENTS
                        .requestMatchers(HttpMethod.POST, "/api/indents/**").hasAnyAuthority("ADMIN", "PHARMACIST", "NURSE")
                        .requestMatchers(HttpMethod.PUT, "/api/indents/issue/**").hasAuthority("ADMIN")

                        // 4. GENERAL DOMAIN RULES
                        .requestMatchers("/api/medicines/**").hasAuthority("ADMIN")
                        .requestMatchers("/api/suppliers/**").hasAuthority("ADMIN")
                        .requestMatchers("/api/sales/**").hasAnyAuthority("ADMIN", "PHARMACIST")
                        .requestMatchers("/api/finance/**").hasAuthority("ADMIN")
                        .requestMatchers("/api/expenses/**").hasAuthority("ADMIN")
                        .requestMatchers("/api/reports/**").hasAnyAuthority("ADMIN", "PHARMACIST")
                        .requestMatchers("/api/alerts/**").hasAnyAuthority("ADMIN", "PHARMACIST")
                        .requestMatchers("/api/customers/**").hasAnyAuthority("ADMIN", "PHARMACIST")
                        .requestMatchers("/api/returns/**").hasAnyAuthority("ADMIN", "PHARMACIST")
                        .requestMatchers("/api/inventory/expiry/**").hasAnyAuthority("ADMIN", "PHARMACIST")

                        // 5. CATCH-ALL
                        .anyRequest().authenticated())
                .httpBasic(Customizer.withDefaults())
                .build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:3000"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "Accept"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}