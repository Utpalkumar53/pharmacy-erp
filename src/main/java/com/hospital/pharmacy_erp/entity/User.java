package com.hospital.pharmacy_erp.entity;

import lombok.Data;
import com.hospital.pharmacy_erp.enums.Role;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.util.List;

@Document(collection = "users")
@Data
public class User {
    @Id
    private String id;

    @Indexed(unique = true) // Ensures no two employees have the same username
    private String username;

    private String password;

    private List<Role> roles;  // A user can have multiple roles (e.g., Manager AND Pharmacist)

    private boolean active = true;
}
