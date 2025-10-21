package com.web.Dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.web.Model.Order;

public class OrderDetailDto {
    private long id;
    private long userId;
    private long addressId;
    private String fullName;
    private String phone;
    private String fullAddress;
    private String orderNumber;
    private Order.STATUS status;
    private String source;
    private BigDecimal totalAmount;
    private String createBy;
    private String note;
    private LocalDateTime createdAt;

    // Constructor matching JPQL constructor expression types
    public OrderDetailDto(long id, long userId, long addressId, String fullName, String phone, String fullAddress, String orderNumber, String source,
            Order.STATUS status, BigDecimal totalAmount, String createBy, String note, LocalDateTime createdAt) {
        this.id = id;
        this.userId = userId;
        this.addressId = addressId;
        this.fullName = fullName;
        this.phone = phone;
        this.fullAddress = fullAddress;
        this.orderNumber = orderNumber;
        this.source = source;
        this.status = status;
        this.totalAmount = totalAmount;
        this.createBy = createBy;
        this.note = note;
        this.createdAt = createdAt;
    }

    // Getters
    public long getId() {
        return id;
    }

    public long getUserId() {
        return userId;
    }

    public long getAddressId() {
        return addressId;
    }

    public String getFullName() {
        return fullName;
    }

    public String getPhone() {
        return phone;
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

    public String getNote() {
        return note;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}