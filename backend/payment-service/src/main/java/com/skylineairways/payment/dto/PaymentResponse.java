package com.skylineairways.payment.dto;

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
}