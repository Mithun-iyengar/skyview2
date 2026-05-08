package com.skylineairways.booking.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BookingResponseDto {
    private Long id;
    private Long flightId;
    private Long userId;
    private List<String> seatNumbers;
    
    // Primary passenger details
    private String passengerName;
    private String passengerEmail;
    private String passengerPhone;
    private Integer passengerAge;
    private String aadhaarNumber;
    private String mealPreference;
    private Boolean wheelchairAssistance;
    
    // Additional passengers
    private List<PassengerDetailDto> additionalPassengers;
    
    private BigDecimal totalAmount;
    private String status;
    private Instant createdAt;
}
