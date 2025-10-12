package com.web.Model;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import javax.persistence.*;

@Data
@Entity
@Table(name = "orders")
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "address_id", nullable = false)
    private Address address;

    private String note;

    private String orderNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private STATUS status;

    @Column(precision = 12, scale = 2)
    private BigDecimal totalAmount;
    
    private String createBy;
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
    public enum STATUS {
        pending,
        paid,
        processing,
        shipped,
        delivered,
        cancelled
    }
}
