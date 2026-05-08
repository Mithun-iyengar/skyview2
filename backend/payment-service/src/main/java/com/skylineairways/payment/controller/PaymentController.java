package com.skylineairways.payment.controller;

import com.skylineairways.payment.dto.PaymentResponse;
import com.skylineairways.payment.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
@Slf4j
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/process")
    public ResponseEntity<PaymentResponse> processPayment(@RequestBody Map<String, Object> request) {
        log.info("Received payment request: {}", request);
        Long bookingId = Long.valueOf(request.get("bookingId").toString());
        BigDecimal amount = new BigDecimal(request.get("amount").toString());
        
        PaymentResponse payment = paymentService.processPayment(bookingId, amount);
        return ResponseEntity.ok(payment);
    }

    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<PaymentResponse> getPaymentByBookingId(@PathVariable Long bookingId) {
        log.info("Retrieving payment for booking {}", bookingId);
        return paymentService.getPaymentByBookingId(bookingId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}