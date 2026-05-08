package com.skylineairways.flight.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Represents a seating class configuration for a flight.
 * Converted to an entity so it can hold an ElementCollection of seats.
 */
@Entity
@Table(name = "seat_classes")
@Data
public class SeatClass {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String classType;           // ECONOMY, BUSINESS
    private String className;           // Display name: "Economy", "Premium Economy", etc.
    private Integer totalSeats;         // Total number of seats in this class

    @Column(name = "seat_rows")
    private Integer rows;               // Number of rows

    @Column(name = "columns_per_row")
    private Integer columnsPerRow;      // Number of columns (seats per row)
    private BigDecimal pricePerSeat;    // Price for one seat in this class

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "flight_id")
    @JsonBackReference
    private Flight flight;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "seat_class_seats", joinColumns = @JoinColumn(name = "seat_class_id"))
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

    /**
     * Generate seats based on rows and columns configuration.
     * Creates seats with unique seat numbers like 1A, 1B, 2A, 2B, etc.
     */
    public void generateSeats(String classPrefix) {
        this.seats.clear();
        String[] columns = {"A", "B", "C", "D", "E", "F", "G", "H", "J", "K"};

        for (int row = 1; row <= (this.rows == null ? 0 : this.rows); row++) {
            for (int col = 0; col < (this.columnsPerRow == null ? 0 : this.columnsPerRow) && col < columns.length; col++) {
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