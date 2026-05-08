package com.skylineairways.notification.service;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;

import jakarta.mail.internet.MimeMessage;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import com.skylineairways.notification.repository.NotificationRepository;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock private NotificationRepository notificationRepository;
    @Mock private JavaMailSender mailSender;

    private NotificationService notificationService;

    @BeforeEach
    void setUp() {
        notificationService = new NotificationService(notificationRepository, mailSender);
    }

    @Test
    void sendBookingConfirmationStoresSentNotification() {
        MimeMessage message = new JavaMailSenderImpl().createMimeMessage();
        when(mailSender.createMimeMessage()).thenReturn(message);

        assertDoesNotThrow(() -> notificationService.sendBookingConfirmation("test@example.com", "details"));
        verify(mailSender).send(org.mockito.ArgumentMatchers.any(org.springframework.mail.SimpleMailMessage.class));
        verify(notificationRepository).save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void sendPaymentFailedStoresFailedNotificationWhenMailThrows() {
        doThrow(new RuntimeException("mail error")).when(mailSender).send(org.mockito.ArgumentMatchers.any(org.springframework.mail.SimpleMailMessage.class));

        assertDoesNotThrow(() -> notificationService.sendPaymentFailed("test@example.com", "details"));
        verify(notificationRepository).save(org.mockito.ArgumentMatchers.any());
    }
}
