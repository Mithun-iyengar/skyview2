package com.skylineairways.booking.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

@Entity
@Table(name = "booking_passengers", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"booking_id", "email"}),
        @UniqueConstraint(columnNames = {"booking_id", "phone"}),
        @UniqueConstraint(columnNames = {"booking_id", "aadhaar_number"}),
        @UniqueConstraint(columnNames = {"booking_id", "passport_number"})
})
@Data
@EqualsAndHashCode(exclude = "booking")
@ToString(exclude = "booking")
public class BookingPassenger {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    @Column(name = "passenger_name", nullable = false)
    private String fullName;

    @Column(name = "passenger_age", nullable = false)
    private Integer age;

    @Column(name = "email")
    private String email;

    @Column(name = "phone")
    private String phone;

    @Column(name = "aadhaar_number", length = 12)
    private String aadhaarNumber;

    @Column(name = "passport_number")
    private String passportNumber;

    @Column(name = "meal_preference", nullable = false)
    private String mealPreference;

    @Column(name = "is_primary", nullable = false)
    private Boolean primaryPassenger = false;
}
