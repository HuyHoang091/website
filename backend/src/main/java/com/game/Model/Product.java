package com.game.Model;

import lombok.Data;
import java.time.LocalDateTime;
import javax.persistence.*;

@Data
@Entity
@Table(name = "products")
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String slug;
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private STATUS status;
    
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum STATUS {
        active,
        draft
    }
}
