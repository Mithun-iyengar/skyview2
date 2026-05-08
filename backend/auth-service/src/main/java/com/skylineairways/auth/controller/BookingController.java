package com.skylineairways.auth.controller;

import com.skylineairways.auth.model.Booking;
import com.skylineairways.auth.service.BookingService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

// @RestController - DISABLED: This service is now handled by booking-service microservice
// @RequestMapping("/api/book")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PostMapping
    public ResponseEntity<Booking> createBooking(@RequestBody Map<String, Object> request) {
        Long flightId = Long.valueOf(request.get("flightId").toString());
        Long userId = Long.valueOf(request.get("userId").toString());
        @SuppressWarnings("unchecked")
        List<String> seatNumbers = (List<String>) request.get("seatNumbers");
        String passengerName = (String) request.get("passengerName");
        String passengerEmail = (String) request.get("passengerEmail");
        String passengerPhone = (String) request.get("passengerPhone");
        Integer passengerAge = request.get("passengerAge") != null ? Integer.valueOf(request.get("passengerAge").toString()) : null;
        String aadhaarNumber = (String) request.get("aadhaarNumber");
        String mealPreference = (String) request.get("mealPreference");
        Boolean wheelchairAssistance = request.get("wheelchairAssistance") != null ? Boolean.valueOf(request.get("wheelchairAssistance").toString()) : null;

        Booking booking = bookingService.createBooking(flightId, userId, seatNumbers, passengerName, passengerEmail,
                passengerPhone, passengerAge, aadhaarNumber, mealPreference, wheelchairAssistance);
        return ResponseEntity.status(HttpStatus.CREATED).body(booking);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Booking>> getUserBookings(@PathVariable Long userId) {
        return ResponseEntity.ok(bookingService.getUserBookings(userId));
    }

    @GetMapping("/{bookingId}")
    public ResponseEntity<Booking> getBooking(@PathVariable Long bookingId) {
        return ResponseEntity.ok(bookingService.getBookingById(bookingId));
    }
}