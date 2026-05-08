package com.skylineairways.auth.model;

import jakarta.persistence.Embeddable;
import jakarta.persistence.Column;
import jakarta.persistence.Transient;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Represents a seating class configuration for a flight.
 * Examples: Economy, Business
 */
@Embeddable
public class SeatClass {

    private String classType;           // ECONOMY, BUSINESS
    private String className;           // Display name: "Economy", "Premium Economy", etc.
    private Integer totalSeats;         // Total number of seats in this class
    @Column(name = "seat_rows")
    private Integer rows;               // Number of rows
    private Integer columnsPerRow;      // Number of columns (seats per row)
    private BigDecimal pricePerSeat;    // Price for one seat in this class

    @Transient
    private List<Seat> seats = new ArrayList<>();  // Auto-generated seat list

    public SeatClass() {
    }

    public SeatClass(String classType, String className, Integer totalSeats,
                     Integer rows, Integer columnsPerRow, BigDecimal pricePerSeat) {
        this.classType = classType;
        this.className = className;
        this.totalSeats = totalSeats;
        this.rows = rows;
        this.columnsPerRow = columnsPerRow;
        this.pricePerSeat = pricePerSeat;
        this.seats = new ArrayList<>();
    }

    public String getClassType() {
        return classType;
    }

    public void setClassType(String classType) {
        this.classType = classType;
    }

    public String getClassName() {
        return className;
    }

    public void setClassName(String className) {
        this.className = className;
    }

    public Integer getTotalSeats() {
        return totalSeats;
    }

    public void setTotalSeats(Integer totalSeats) {
        this.totalSeats = totalSeats;
    }

    public Integer getRows() {
        return rows;
    }

    public void setRows(Integer rows) {
        this.rows = rows;
    }

    public Integer getColumnsPerRow() {
        return columnsPerRow;
    }

    public void setColumnsPerRow(Integer columnsPerRow) {
        this.columnsPerRow = columnsPerRow;
    }

    public BigDecimal getPricePerSeat() {
        return pricePerSeat;
    }

    public void setPricePerSeat(BigDecimal pricePerSeat) {
        this.pricePerSeat = pricePerSeat;
    }

    public List<Seat> getSeats() {
        return seats;
    }

    public void setSeats(List<Seat> seats) {
        this.seats = seats;
    }

    /**
     * Generate seats based on rows and columns configuration.
     * Creates seats with unique seat numbers like 1A, 1B, 2A, 2B, etc.
     */
    public void generateSeats(String classPrefix) {
        this.seats.clear();
        String[] columns = {"A", "B", "C", "D", "E", "F", "G", "H", "J", "K"};

        for (int row = 1; row <= this.rows; row++) {
            for (int col = 0; col < this.columnsPerRow && col < columns.length; col++) {
                String seatNumber = classPrefix + row + columns[col];
                Seat seat = new Seat(seatNumber, row, columns[col]);
                seat.setSeatType(getSeatType(col, this.columnsPerRow));
                this.seats.add(seat);
            }
        }
    }

    private String getSeatType(int colIndex, int totalColumns) {
        if (colIndex == 0) return "WINDOW";
        if (colIndex == totalColumns - 1) return "WINDOW";
        if (totalColumns > 2 && (colIndex == 1 || colIndex == totalColumns - 2)) return "AISLE";
        return "MIDDLE";
    }
}
