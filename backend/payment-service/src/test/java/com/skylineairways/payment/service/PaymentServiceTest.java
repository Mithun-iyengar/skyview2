package com.skylineairways.payment.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;
import java.util.Random;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import com.skylineairways.payment.dto.PaymentResponse;
import com.skylineairways.payment.exception.PaymentFailedException;
import com.skylineairways.payment.model.Payment;
import com.skylineairways.payment.repository.PaymentRepository;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock private PaymentRepository paymentRepository;

    private PaymentService paymentService;

    @BeforeEach
    void setUp() {
        paymentService = new PaymentService(paymentRepository);
    }

    @Test
    void processPaymentReturnsSuccessWhenRandomAllows() {
        ReflectionTestUtils.setField(paymentService, "random", new Random() {
            @Override
            public int nextInt(int bound) {
                return 0;
            }
        });

        when(paymentRepository.save(org.mockito.ArgumentMatchers.any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PaymentResponse response = paymentService.processPayment(1L, BigDecimal.valueOf(1000));

        assertEquals("SUCCESS", response.getStatus());
        verify(paymentRepository).save(org.mockito.ArgumentMatchers.any(Payment.class));
    }

    @Test
    void processPaymentThrowsWhenRandomFails() {
        ReflectionTestUtils.setField(paymentService, "random", new Random() {
            @Override
            public int nextInt(int bound) {
                return 90;
            }
        });

        assertThrows(PaymentFailedException.class, () -> paymentService.processPayment(1L, BigDecimal.valueOf(1000)));
    }

    @Test
    void getPaymentByBookingIdMapsRepositoryResult() {
        Payment payment = new Payment();
        payment.setId(1L);
        payment.setBookingId(10L);
        payment.setAmount(BigDecimal.valueOf(500));
        payment.setStatus("SUCCESS");
        payment.setCreatedAt(Instant.now());
        when(paymentRepository.findByBookingId(10L)).thenReturn(Optional.of(payment));

        Optional<PaymentResponse> response = paymentService.getPaymentByBookingId(10L);

        assertEquals("SUCCESS", response.orElseThrow().getStatus());
    }
}
