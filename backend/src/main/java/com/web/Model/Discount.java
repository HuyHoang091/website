package com.web.Model;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import javax.persistence.*;

@Data
@Entity
@Table(name = "discount")
public class Discount {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long discountId;

    private String name;

    private Long categoriesId;
    
    private String description;

    @Column(precision = 5, scale = 2)
    private BigDecimal discountPercent;

    private LocalDateTime startDate;
    private LocalDateTime endDate;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private STATUS status;

    public enum STATUS {
        active,
        inactive
    }
}
