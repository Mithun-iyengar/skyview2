package com.skylineairways.booking.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;

@Data
public class PaymentResponse {
    private Long id;
    private Long bookingId;
    private BigDecimal amount;
    private String status;
    private Instant createdAt;

    public PaymentResponse() {
    }

    public PaymentResponse(String status) {
        this.status = status;
    }

    public PaymentResponse(Long id, Long bookingId, BigDecimal amount, String status, Instant createdAt) {
        this.id = id;
        this.bookingId = bookingId;
        this.amount = amount;
        this.status = status;
        this.createdAt = createdAt;
    }
}