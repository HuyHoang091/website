package com.web.Dto;

import java.io.Serializable;
import java.time.LocalDateTime;

public class RefundMessageDto implements Serializable {
    private Long orderId;
    private String captureId;
    private String reason;
    private String adminNote;
    private String requestedBy;
    private int retryCount = 0;
    private LocalDateTime createdAt;
    private String status = "PENDING";

    public RefundMessageDto() {
        this.createdAt = LocalDateTime.now();
    }

    public RefundMessageDto(Long orderId, String captureId, String reason, String adminNote, String requestedBy) {
        this.orderId = orderId;
        this.captureId = captureId;
        this.reason = reason;
        this.adminNote = adminNote;
        this.requestedBy = requestedBy;
        this.createdAt = LocalDateTime.now();
    }

    // Getters and setters
    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }

    public String getCaptureId() {
        return captureId;
    }

    public void setCaptureId(String captureId) {
        this.captureId = captureId;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getAdminNote() {
        return adminNote;
    }

    public void setAdminNote(String adminNote) {
        this.adminNote = adminNote;
    }

    public String getRequestedBy() {
        return requestedBy;
    }

    public void setRequestedBy(String requestedBy) {
        this.requestedBy = requestedBy;
    }

    public int getRetryCount() {
        return retryCount;
    }

    public void setRetryCount(int retryCount) {
        this.retryCount = retryCount;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public void incrementRetryCount() {
        this.retryCount++;
    }
}