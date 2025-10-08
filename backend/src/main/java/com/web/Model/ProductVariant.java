package com.web.Model;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import javax.persistence.*;

@Data
@Entity
@Table(name = "product_variants")
public class ProductVariant {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    private String size;
    private String color;
    private String sku;

    @Column(precision = 12, scale = 2, nullable = false)
    private BigDecimal price;
    
    private Long stock;
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
