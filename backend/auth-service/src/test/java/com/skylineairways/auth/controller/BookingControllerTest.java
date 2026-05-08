package com.skylineairways.auth.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import com.skylineairways.auth.model.Booking;
import com.skylineairways.auth.service.BookingService;

@ExtendWith(MockitoExtension.class)
class BookingControllerTest {

    @Mock private BookingService bookingService;
    private BookingController bookingController;

    @BeforeEach
    void setUp() {
        bookingController = new BookingController(bookingService);
    }

    @Test
    void createBookingReturnsCreatedBooking() {
        Booking booking = new Booking();
        booking.setId(1L);
        booking.setFlightId(10L);
        booking.setUserId(20L);
        booking.setSeatNumbers(List.of("E1A"));
        booking.setPassengerName("Mithun");
        booking.setPassengerEmail("test@example.com");
        booking.setPassengerPhone("9876543210");
        booking.setTotalAmount(BigDecimal.valueOf(1000));
        booking.setStatus("CONFIRMED");
        booking.setCreatedAt(Instant.now());
        when(bookingService.createBooking(10L, 20L, List.of("E1A"), "Mithun", "test@example.com", "9876543210", 30, "123456789012", "VEG", true))
                .thenReturn(booking);

        ResponseEntity<Booking> response = bookingController.createBooking(Map.of(
                "flightId", 10,
                "userId", 20,
                "seatNumbers", List.of("E1A"),
                "passengerName", "Mithun",
                "passengerEmail", "test@example.com",
                "passengerPhone", "9876543210",
                "passengerAge", 30,
                "aadhaarNumber", "123456789012",
                "mealPreference", "VEG",
                "wheelchairAssistance", true));

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
    }
}