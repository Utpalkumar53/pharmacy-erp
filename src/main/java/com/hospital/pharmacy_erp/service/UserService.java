package com.hospital.pharmacy_erp.service;

import com.hospital.pharmacy_erp.entity.User;
import com.hospital.pharmacy_erp.enums.Role;
import com.hospital.pharmacy_erp.repository.UserRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;

@Service

public class UserService {
    @Autowired
    private UserRepository userRepository;

    private static final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public boolean saveNewUser(User user) {
        try {
            // 1. Encode the password before saving
            user.setPassword(passwordEncoder.encode(user.getPassword()));

            // 2. If no role sent in request, give PHARMACIST as default
            // If role IS sent (like ADMIN), keep it as is
            if (user.getRoles() == null || user.getRoles().isEmpty()) {
                user.setRoles(Arrays.asList(Role.PHARMACIST)); // default role
            }

            user.setActive(true); // ensure active is true
            userRepository.save(user);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public List<User> getAll() {
        return userRepository.findAll(); // all these types of methods are under the MongoRepository
    }
}
