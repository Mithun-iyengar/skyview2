package com.skylineairways.booking.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;
import com.skylineairways.booking.model.BookingPassenger;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "bookings")
@Data
@EqualsAndHashCode(exclude = "passengers")
@ToString(exclude = "passengers")
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long flightId;

    @Column(nullable = false)
    private Long userId;

    @ElementCollection
    private List<String> seatNumbers;

    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<BookingPassenger> passengers = new ArrayList<>();

    @Column(nullable = false)
    private String passengerName;

    @Column(nullable = false)
    private String passengerEmail;

    @Column(nullable = false)
    private String passengerPhone;

    private Integer passengerAge;

    private String aadhaarNumber;

    private String mealPreference;

    private Boolean wheelchairAssistance;

    @Column(nullable = false)
    private BigDecimal totalAmount;

    @Column(nullable = false)
    private String status; // CONFIRMED, CANCELLED

    @Column(nullable = false)
    private Instant createdAt;
}