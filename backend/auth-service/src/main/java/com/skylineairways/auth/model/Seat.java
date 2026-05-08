package com.skylineairways.auth.model;

import jakarta.persistence.Embeddable;

/**
 * Represents a single seat in a flight.
 * Used within SeatClass configuration.
 */
@Embeddable
public class Seat {

    private String seatNumber;   // E.g., "12A", "2B"
    private String seatStatus;   // AVAILABLE, OCCUPIED, BLOCKED
    private Integer row;         // Row number
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

    public String getSeatNumber() {
        return seatNumber;
    }

    public void setSeatNumber(String seatNumber) {
        this.seatNumber = seatNumber;
    }

    public String getSeatStatus() {
        return seatStatus;
    }

    public void setSeatStatus(String seatStatus) {
        this.seatStatus = seatStatus;
    }

    public Integer getRow() {
        return row;
    }

    public void setRow(Integer row) {
        this.row = row;
    }

    public String getColumn() {
        return column;
    }

    public void setColumn(String column) {
        this.column = column;
    }

    public String getSeatType() {
        return seatType;
    }

    public void setSeatType(String seatType) {
        this.seatType = seatType;
    }

}
