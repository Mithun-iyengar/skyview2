package com.skylineairways.payment.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import com.skylineairways.payment.dto.PaymentResponse;
import com.skylineairways.payment.service.PaymentService;

@ExtendWith(MockitoExtension.class)
class PaymentControllerTest {

    @Mock private PaymentService paymentService;
    private PaymentController paymentController;

    @BeforeEach
    void setUp() {
        paymentController = new PaymentController(paymentService);
    }

    @Test
    void processPaymentReturnsOk() {
        PaymentResponse payment = new PaymentResponse();
        payment.setId(1L);
        payment.setBookingId(10L);
        payment.setAmount(BigDecimal.valueOf(1000));
        payment.setStatus("SUCCESS");
        payment.setCreatedAt(Instant.now());
        when(paymentService.processPayment(10L, BigDecimal.valueOf(1000))).thenReturn(payment);

        ResponseEntity<PaymentResponse> response = paymentController.processPayment(Map.of("bookingId", 10, "amount", 1000));

        assertEquals(HttpStatus.OK, response.getStatusCode());
    }

    @Test
    void getPaymentReturnsNotFoundWhenMissing() {
        when(paymentService.getPaymentByBookingId(10L)).thenReturn(java.util.Optional.empty());

        ResponseEntity<PaymentResponse> response = paymentController.getPaymentByBookingId(10L);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    }
}
