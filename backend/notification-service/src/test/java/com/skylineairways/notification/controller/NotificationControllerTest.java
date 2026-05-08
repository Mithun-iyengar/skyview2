package com.skylineairways.notification.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import com.skylineairways.notification.service.NotificationService;

@ExtendWith(MockitoExtension.class)
class NotificationControllerTest {

    @Mock private NotificationService notificationService;
    private NotificationController notificationController;

    @BeforeEach
    void setUp() {
        notificationController = new NotificationController(notificationService);
    }

    @Test
    void sendBookingConfirmationReturnsOk() {
        ResponseEntity<String> response = notificationController.sendBookingConfirmation("test@example.com", "details");
        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(notificationService).sendBookingConfirmation("test@example.com", "details");
    }
}
