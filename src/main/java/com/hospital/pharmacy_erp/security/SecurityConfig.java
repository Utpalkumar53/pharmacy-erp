package com.hospital.pharmacy_erp.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity          // enables @PreAuthorize on controllers
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;  // replaces httpBasic

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .cors(org.springframework.security.config.Customizer.withDefaults())
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS)) // no sessions, JWT only
                .authorizeHttpRequests(request -> request
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/api/public/**").permitAll()
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/sales/print/**").permitAll()

                        // HR & STAFF — specific FIRST, broad AFTER
                        .requestMatchers(HttpMethod.GET, "/api/staff/salary-report/my").hasAnyRole("ADMIN", "PHARMACIST", "NURSE", "EMPLOYEE")
                        .requestMatchers(HttpMethod.GET, "/api/staff/salary-report/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/staff/attendance/my/today").hasAnyRole("ADMIN", "PHARMACIST", "NURSE", "EMPLOYEE")
                        .requestMatchers(HttpMethod.GET, "/api/staff/attendance/my/month").hasAnyRole("ADMIN", "PHARMACIST", "NURSE", "EMPLOYEE")
                        .requestMatchers(HttpMethod.POST, "/api/staff/attendance/my/check-in").hasAnyRole("ADMIN", "PHARMACIST", "NURSE", "EMPLOYEE")
                        .requestMatchers(HttpMethod.PUT, "/api/staff/attendance/my/check-out").hasAnyRole("ADMIN", "PHARMACIST", "NURSE", "EMPLOYEE")
                        .requestMatchers(HttpMethod.PUT, "/api/staff/change-password").hasAnyRole("ADMIN", "PHARMACIST", "NURSE", "EMPLOYEE")
                        .requestMatchers("/api/staff/attendance/**").hasAnyRole("ADMIN", "MANAGER", "PHARMACIST", "NURSE", "EMPLOYEE")
                        .requestMatchers(HttpMethod.POST, "/api/staff/**").hasRole("ADMIN")

                        // INDENTS
                        .requestMatchers(HttpMethod.GET, "/api/indents/**").hasAnyRole("ADMIN", "PHARMACIST", "NURSE")
                        .requestMatchers(HttpMethod.POST, "/api/indents/**").hasAnyRole("ADMIN", "PHARMACIST", "NURSE")
                        .requestMatchers(HttpMethod.PUT, "/api/indents/issue/**").hasAnyRole("ADMIN", "PHARMACIST")
                        .requestMatchers(HttpMethod.PUT, "/api/indents/cancel/**").hasAnyRole("ADMIN", "PHARMACIST", "NURSE")

                        // MEDICINES
                        .requestMatchers(HttpMethod.GET, "/api/medicines/**").hasAnyRole("ADMIN", "PHARMACIST", "NURSE", "EMPLOYEE")
                        .requestMatchers(HttpMethod.POST, "/api/medicines/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/medicines/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/medicines/**").hasRole("ADMIN")

                        // SALES & FINANCE
                        .requestMatchers("/api/sales/**").hasAnyRole("ADMIN", "PHARMACIST")
                        .requestMatchers(HttpMethod.GET, "/api/finance/monthly-overview").hasAnyRole("ADMIN", "PHARMACIST")
                        .requestMatchers("/api/finance/**").hasRole("ADMIN")
                        .requestMatchers("/api/expenses/**").hasRole("ADMIN")

                        // SUPPLIERS & INVENTORY
                        .requestMatchers("/api/suppliers/**").hasRole("ADMIN")
                        .requestMatchers("/api/inventory/expiry/**").hasAnyRole("ADMIN", "PHARMACIST")

                        // REPORTS & INTELLIGENCE
                        .requestMatchers("/api/reports/**").hasAnyRole("ADMIN", "PHARMACIST")
                        .requestMatchers("/api/alerts/**").hasAnyRole("ADMIN", "PHARMACIST")
                        .requestMatchers("/api/intelligence/**").hasAnyRole("ADMIN", "PHARMACIST")
                        .requestMatchers("/api/analytics/**").hasAnyRole("ADMIN", "PHARMACIST")
                        .requestMatchers("/api/orders/**").hasAnyRole("ADMIN", "PHARMACIST")

                        // CUSTOMERS & RETURNS
                        .requestMatchers("/api/customers/**").hasAnyRole("ADMIN", "PHARMACIST")
                        .requestMatchers("/api/returns/**").hasAnyRole("ADMIN", "PHARMACIST")

                        // AUTH
                        .requestMatchers("/api/auth/verify").authenticated()

                        .anyRequest().authenticated()
                )
                // JWT filter runs before Spring's username/password filter
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
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

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config)
            throws Exception {
        return config.getAuthenticationManager();
    }
}