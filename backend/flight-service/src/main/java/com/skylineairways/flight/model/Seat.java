package com.skylineairways.flight.model;

import jakarta.persistence.Embeddable;
import jakarta.persistence.Column;
import lombok.Data;

/**
 * Represents a single seat in a flight.
 * Used within SeatClass configuration.
 * 
 * Seat Status Values:
 * - AVAILABLE: Seat is free and can be booked
 * - HOLD: Seat is temporarily locked during payment (5 min timeout)
 * - BOOKED: Seat is permanently booked
 * - BLOCKED: Seat is unavailable for booking
 */
@Embeddable
@Data
public class Seat {

    // Seat Status Constants
    public static final String STATUS_AVAILABLE = "AVAILABLE";
    public static final String STATUS_HOLD = "HOLD";
    public static final String STATUS_BOOKED = "BOOKED";
    public static final String STATUS_BLOCKED = "BLOCKED";

    private String seatNumber;   // E.g., "12A", "2B"
    private String seatStatus;   // AVAILABLE, HOLD, BOOKED, BLOCKED
    
    @Column(name = "`row`")      // Escape reserved keyword
    private Integer row;         // Row number

    @Column(name = "`column`")   // Escape reserved keyword
    private String column;       // Column letter (A, B, C, etc.)
    private String seatType;     // WINDOW, AISLE, MIDDLE

    public Seat() {
    }

    public Seat(String seatNumber, Integer row, String column) {
        this.seatNumber = seatNumber;
        this.row = row;
        this.column = column;
        this.seatStatus = "AVAILABLE";
    }
}