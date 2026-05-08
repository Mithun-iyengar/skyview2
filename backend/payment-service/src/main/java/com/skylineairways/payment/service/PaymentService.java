package com.skylineairways.payment.service;

import com.skylineairways.payment.dto.PaymentResponse;
import com.skylineairways.payment.exception.PaymentFailedException;
import com.skylineairways.payment.model.Payment;
import com.skylineairways.payment.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;
import java.util.Random;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final Random random = new Random();

    @Transactional
    public PaymentResponse processPayment(Long bookingId, BigDecimal amount) {
        log.info("Processing payment for booking {} amount {}", bookingId, amount);

        // Simulate payment processing - 80% success rate
        boolean success = random.nextInt(100) < 80;

        Payment payment = new Payment();
        payment.setBookingId(bookingId);
        payment.setAmount(amount);
        payment.setCreatedAt(Instant.now());

        if (success) {
            payment.setStatus("SUCCESS");
            log.info("Payment successful for booking {}", bookingId);
        } else {
            payment.setStatus("FAILED");
            log.error("Payment failed for booking {}", bookingId);
            throw new PaymentFailedException("Payment processing failed");
        }

        Payment savedPayment = paymentRepository.save(payment);
        return convertToResponse(savedPayment);
    }

    public Optional<PaymentResponse> getPaymentByBookingId(Long bookingId) {
        log.info("Retrieving payment for booking {}", bookingId);
        return paymentRepository.findByBookingId(bookingId).map(this::convertToResponse);
    }

    private PaymentResponse convertToResponse(Payment payment) {
        PaymentResponse response = new PaymentResponse();
        response.setId(payment.getId());
        response.setBookingId(payment.getBookingId());
        response.setAmount(payment.getAmount());
        response.setStatus(payment.getStatus());
        response.setCreatedAt(payment.getCreatedAt());
        return response;
    }
}