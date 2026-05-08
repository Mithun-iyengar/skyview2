package com.skylineairways.booking.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.Instant;

@Entity
@Table(name = "seat_locks")
@Data
public class SeatLock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long flightId;

    @Column(nullable = false)
    private String seatNumber;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private Instant lockedUntil;

    @Column(nullable = false)
    private Instant createdAt;
}