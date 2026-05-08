package com.skylineairways.booking.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.Data;

@Embeddable
@Data
public class PassengerDetail {

    @Column(name = "passenger_name", nullable = false)
    private String fullName;

    @Column(name = "passenger_age", nullable = false)
    private Integer age;

    @Column(name = "meal_preference", nullable = false)
    private String mealPreference;
}
