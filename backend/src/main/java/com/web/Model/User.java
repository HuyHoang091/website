package com.web.Model;

import lombok.Data;
import java.time.LocalDateTime;
import javax.persistence.*;

@Data
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true)
    private String email;
    
    private String passwordHash;
    private String fullName;
    private String phone;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ROLE role = ROLE.USER;
    private LocalDateTime createdAt;
    private String status;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
    public enum ROLE {
        USER, SALER,
        ADMIN
    }
}