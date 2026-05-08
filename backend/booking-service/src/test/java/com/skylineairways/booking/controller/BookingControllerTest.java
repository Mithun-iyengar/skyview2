package com.skylineairways.booking.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import com.skylineairways.booking.dto.BookingResponseDto;
import com.skylineairways.booking.model.Booking;
import com.skylineairways.booking.model.BookingPassenger;
import com.skylineairways.booking.service.BookingService;
import com.skylineairways.booking.service.EmailService;

@ExtendWith(MockitoExtension.class)
class BookingControllerTest {

    @Mock private BookingService bookingService;
    @Mock private EmailService emailService;

    private BookingController bookingController;

    @BeforeEach
    void setUp() {
        bookingController = new BookingController(bookingService, emailService);
    }

    @Test
    void createBookingReturnsCreatedResponse() {
        Booking booking = new Booking();
        booking.setId(1L);
        booking.setFlightId(10L);
        booking.setUserId(20L);
        booking.setSeatNumbers(List.of("E1A"));
        booking.setPassengerName("Mithun");
        booking.setPassengerEmail("test@example.com");
        booking.setPassengerPhone("9876543210");
        booking.setPassengerAge(30);
        booking.setAadhaarNumber("123456789012");
        booking.setMealPreference("VEG");
        booking.setWheelchairAssistance(false);
        booking.setTotalAmount(BigDecimal.valueOf(1000));
        booking.setStatus("CONFIRMED");
        booking.setCreatedAt(Instant.now());
        booking.setPassengers(List.of(new BookingPassenger()));

        when(bookingService.createBooking(10L, 20L, List.of("E1A"), "Mithun", "test@example.com", "9876543210", 30, "123456789012", null, "VEG", false, BigDecimal.valueOf(1000), List.of(), false))
                .thenReturn(booking);

        ResponseEntity<BookingResponseDto> response = bookingController.createBooking(Map.of(
                "flightId", 10,
                "userId", 20,
                "seatNumbers", List.of("E1A"),
                "passengerName", "Mithun",
                "passengerEmail", "test@example.com",
                "passengerPhone", "9876543210",
                "passengerAge", 30,
                "aadhaarNumber", "123456789012",
                "mealPreference", "VEG",
                "wheelchairAssistance", false,
                "totalAmount", 1000,
                "additionalPassengers", List.of(),
                "paymentMethod", "CARD"));

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
    }
}
