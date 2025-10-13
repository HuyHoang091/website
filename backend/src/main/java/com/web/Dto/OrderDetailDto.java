package com.web.Dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.web.Model.Order;

public class OrderDetailDto {
    private long id;
    private String fullName;
    private String fullAddress;
    private String orderNumber;
    private Order.STATUS status;
    private String source;
    private BigDecimal totalAmount;
    private String createBy;
    private LocalDateTime createdAt;

    // Constructor matching JPQL constructor expression types
    public OrderDetailDto(long id, String fullName, String fullAddress, String orderNumber, String source,
            Order.STATUS status, BigDecimal totalAmount, String createBy, LocalDateTime createdAt) {
        this.id = id;
        this.fullName = fullName;
        this.fullAddress = fullAddress;
        this.orderNumber = orderNumber;
        this.source = source;
        this.status = status;
        this.totalAmount = totalAmount;
        this.createBy = createBy;
        this.createdAt = createdAt;
    }

    // Getters
    public long getId() {
        return id;
    }

    public String getFullName() {
        return fullName;
    }

    public String getFullAddress() {
        return fullAddress;
    }

    public String getOrderNumber() {
        return orderNumber;
    }

    public String getSource() {
        return source;
    }

    public Order.STATUS getStatus() {
        return status;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public String getCreateBy() {
        return createBy;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}