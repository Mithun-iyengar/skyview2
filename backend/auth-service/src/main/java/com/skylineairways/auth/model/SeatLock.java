package com.skylineairways.auth.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "seat_locks")
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

    public SeatLock() {}

    public SeatLock(Long flightId, String seatNumber, Long userId, Instant lockedUntil) {
        this.flightId = flightId;
        this.seatNumber = seatNumber;
        this.userId = userId;
        this.lockedUntil = lockedUntil;
        this.createdAt = Instant.now();
    }

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getFlightId() { return flightId; }
    public void setFlightId(Long flightId) { this.flightId = flightId; }

    public String getSeatNumber() { return seatNumber; }
    public void setSeatNumber(String seatNumber) { this.seatNumber = seatNumber; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Instant getLockedUntil() { return lockedUntil; }
    public void setLockedUntil(Instant lockedUntil) { this.lockedUntil = lockedUntil; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}