package com.skylineairways.flight.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "flights")
@Data
public class Flight {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String flightNumber;

    private String aircraftType;

    @Column(nullable = false)
    private String sourceAirport;

    @Column(nullable = false)
    private String destinationAirport;

    private String midLandingAirport;

    private Integer totalSeats;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal baseFare;

    @Column(precision = 12, scale = 2)
    private BigDecimal taxes;

    @Column(precision = 12, scale = 2)
    private BigDecimal businessMultiplier;

    @Column(precision = 12, scale = 2)
    private BigDecimal economyPrice;

    @Column(precision = 12, scale = 2)
    private BigDecimal businessPrice;

    @Column(nullable = false)
    private Instant departureTime;

    private Instant arrivalTime;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String flightImage;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String services;

    @OneToMany(mappedBy = "flight", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderColumn(name = "class_order")
    @JsonManagedReference
    private List<SeatClass> seatClasses = new ArrayList<>();

    private Instant createdAt;

    public Flight() {
        this.seatClasses = new ArrayList<>();
    }
}