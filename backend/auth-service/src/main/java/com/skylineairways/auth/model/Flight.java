package com.skylineairways.auth.model;

import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "flights")
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

    @Column(nullable = false)
    private BigDecimal baseFare;

    @Column(nullable = false)
    private Instant departureTime;

    private Instant arrivalTime;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String flightImage;

    @ElementCollection
    private List<SeatClass> seatClasses = new ArrayList<>();

    private Instant createdAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFlightNumber() {
        return flightNumber;
    }

    public void setFlightNumber(String flightNumber) {
        this.flightNumber = flightNumber;
    }

    public String getAircraftType() {
        return aircraftType;
    }

    public void setAircraftType(String aircraftType) {
        this.aircraftType = aircraftType;
    }

    public String getSourceAirport() {
        return sourceAirport;
    }

    public void setSourceAirport(String sourceAirport) {
        this.sourceAirport = sourceAirport;
    }

    public String getDestinationAirport() {
        return destinationAirport;
    }

    public void setDestinationAirport(String destinationAirport) {
        this.destinationAirport = destinationAirport;
    }

    public String getMidLandingAirport() {
        return midLandingAirport;
    }

    public void setMidLandingAirport(String midLandingAirport) {
        this.midLandingAirport = midLandingAirport;
    }

    public Integer getTotalSeats() {
        return totalSeats;
    }

    public void setTotalSeats(Integer totalSeats) {
        this.totalSeats = totalSeats;
    }

    public BigDecimal getBaseFare() {
        return baseFare;
    }

    public void setBaseFare(BigDecimal baseFare) {
        this.baseFare = baseFare;
    }

    public Instant getDepartureTime() {
        return departureTime;
    }

    public void setDepartureTime(Instant departureTime) {
        this.departureTime = departureTime;
    }

    public Instant getArrivalTime() {
        return arrivalTime;
    }

    public void setArrivalTime(Instant arrivalTime) {
        this.arrivalTime = arrivalTime;
    }

    public String getFlightImage() {
        return flightImage;
    }

    public void setFlightImage(String flightImage) {
        this.flightImage = flightImage;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public List<SeatClass> getSeatClasses() {
        return seatClasses;
    }

    public void setSeatClasses(List<SeatClass> seatClasses) {
        this.seatClasses = seatClasses;
    }
}
