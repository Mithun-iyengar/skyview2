package com.skylineairways.booking.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PassengerDetailDto {
    private String fullName;
    private Integer age;
    private String mealPreference;
    private String email;
    private String phone;
    private String aadhaarNumber;
    private String passportNumber;
}
