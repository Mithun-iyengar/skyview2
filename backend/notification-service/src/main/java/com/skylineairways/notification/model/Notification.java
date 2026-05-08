package com.skylineairways.notification.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.Instant;

@Entity
@Table(name = "notifications")
@Data
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String recipientEmail;

    @Column(nullable = false)
    private String subject;

    @Column(nullable = false, length = 2000)
    private String message;

    @Column(nullable = false)
    private String type; // BOOKING_CONFIRMATION, PAYMENT_SUCCESS, PAYMENT_FAILED

    @Column(nullable = false)
    private String status; // SENT, FAILED

    @Column
    private Instant sentAt;

    @Column
    private String errorMessage;

    @Column(nullable = false)
    private Instant createdAt;
}