package com.skylineairways.booking.service;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import jakarta.mail.internet.MimeMessage;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.test.util.ReflectionTestUtils;

import com.skylineairways.booking.dto.BookingResponseDto;

@ExtendWith(MockitoExtension.class)
class EmailServiceTest {

    @Mock private JavaMailSender mailSender;

    private EmailService emailService;

    @BeforeEach
    void setUp() {
        emailService = new EmailService();
        ReflectionTestUtils.setField(emailService, "mailSender", mailSender);
        ReflectionTestUtils.setField(emailService, "fromEmail", "no-reply@skylineairways.com");
    }

    @Test
    void sendBookingConfirmationEmailSendsMailWhenRecipientExists() {
        BookingResponseDto booking = new BookingResponseDto();
        booking.setId(1L);
        booking.setFlightId(10L);
        booking.setPassengerEmail("test@example.com");
        booking.setPassengerName("Mithun");
        booking.setPassengerAge(30);
        booking.setPassengerPhone("9876543210");
        booking.setSeatNumbers(List.of("E1A"));
        booking.setMealPreference("VEG");
        booking.setWheelchairAssistance(false);
        booking.setTotalAmount(BigDecimal.valueOf(1000));
        booking.setStatus("CONFIRMED");
        booking.setCreatedAt(Instant.now());
        MimeMessage mimeMessage = new JavaMailSenderImpl().createMimeMessage();
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        assertDoesNotThrow(() -> emailService.sendBookingConfirmationEmail(booking));
        verify(mailSender).send(mimeMessage);
    }

    @Test
    void sendBookingConfirmationEmailSkipsWhenRecipientMissing() {
        BookingResponseDto booking = new BookingResponseDto();
        booking.setId(1L);
        booking.setFlightId(10L);

        assertDoesNotThrow(() -> emailService.sendBookingConfirmationEmail(booking));
    }
}
