package com.skylineairways.booking.controller;

import com.skylineairways.booking.dto.BookingResponseDto;
import com.skylineairways.booking.dto.PassengerDetailDto;
import com.skylineairways.booking.model.Booking;
import com.skylineairways.booking.model.BookingPassenger;
import com.skylineairways.booking.service.BookingService;
import com.skylineairways.booking.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/bookings")
@RequiredArgsConstructor
@Slf4j
public class BookingController {

    private final BookingService bookingService;
    private final EmailService emailService;

    @PostMapping
    public ResponseEntity<BookingResponseDto> createBooking(@RequestBody Map<String, Object> request) {
        log.info("Request to create booking: {}", request);
        Long flightId = Long.valueOf(request.get("flightId").toString());
        Long userId = Long.valueOf(request.get("userId").toString());
        @SuppressWarnings("unchecked")
        List<String> seatNumbers = (List<String>) request.get("seatNumbers");
        String passengerName = (String) request.get("passengerName");
        String passengerEmail = (String) request.get("passengerEmail");
        String passengerPhone = (String) request.get("passengerPhone");
        Integer passengerAge = request.get("passengerAge") != null ? Integer.valueOf(request.get("passengerAge").toString()) : null;
        String aadhaarNumber = (String) request.get("aadhaarNumber");
        String passportNumber = (String) request.get("passportNumber");
        String mealPreference = (String) request.get("mealPreference");
        Boolean wheelchairAssistance = request.get("wheelchairAssistance") != null ? Boolean.valueOf(request.get("wheelchairAssistance").toString()) : null;
        BigDecimal totalAmount = new BigDecimal(request.get("totalAmount").toString());
        String paymentMethod = request.get("paymentMethod") != null ? request.get("paymentMethod").toString() : null;
        boolean walletPayment = "WALLET".equalsIgnoreCase(paymentMethod);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> additionalPassengersRaw = (List<Map<String, Object>>) request.get("additionalPassengers");
        List<BookingPassenger> additionalPassengers = mapAdditionalPassengers(additionalPassengersRaw);

        Booking booking = bookingService.createBooking(flightId, userId, seatNumbers, passengerName, passengerEmail,
                passengerPhone, passengerAge, aadhaarNumber, passportNumber, mealPreference, wheelchairAssistance, totalAmount, additionalPassengers, walletPayment);
        
        BookingResponseDto responseDto = mapBookingToResponseDto(booking);
        
        // Send confirmation email asynchronously
        try {
            emailService.sendBookingConfirmationEmail(responseDto);
        } catch (Exception e) {
            log.error("Error sending confirmation email for booking ID: {}", booking.getId(), e);
            // Continue processing even if email fails
        }
        
        return ResponseEntity.status(HttpStatus.CREATED).body(responseDto);
    }

    private List<BookingPassenger> mapAdditionalPassengers(List<Map<String, Object>> additionalPassengersRaw) {
        if (additionalPassengersRaw == null || additionalPassengersRaw.isEmpty()) {
            return new ArrayList<>();
        }

        List<BookingPassenger> passengers = new ArrayList<>();
        for (Map<String, Object> item : additionalPassengersRaw) {
            BookingPassenger passenger = new BookingPassenger();
            passenger.setFullName(item.get("fullName") != null ? item.get("fullName").toString() : null);
            passenger.setAge(item.get("age") != null ? Integer.valueOf(item.get("age").toString()) : null);
            passenger.setMealPreference(item.get("mealPreference") != null ? item.get("mealPreference").toString() : null);
            passenger.setEmail(item.get("email") != null ? item.get("email").toString() : null);
            passenger.setPhone(item.get("phone") != null ? item.get("phone").toString() : null);
            passenger.setAadhaarNumber(item.get("aadhaarNumber") != null ? item.get("aadhaarNumber").toString() : null);
            passenger.setPassportNumber(item.get("passportNumber") != null ? item.get("passportNumber").toString() : null);
            passenger.setPrimaryPassenger(false);
            passengers.add(passenger);
        }
        return passengers;
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<BookingResponseDto>> getUserBookings(@PathVariable Long userId) {
        log.info("Request to get bookings for user {}", userId);
        List<Booking> bookings = bookingService.getUserBookings(userId);
        return ResponseEntity.ok(bookings.stream().map(this::mapBookingToResponseDto).collect(Collectors.toList()));
    }

    @GetMapping("/{bookingId}")
    public ResponseEntity<BookingResponseDto> getBooking(@PathVariable Long bookingId) {
        log.info("Request to get booking {}", bookingId);
        Booking booking = bookingService.getBookingById(bookingId);
        return ResponseEntity.ok(mapBookingToResponseDto(booking));
    }

    @PostMapping("/{bookingId}/cancel")
    public ResponseEntity<BookingResponseDto> cancelBooking(@PathVariable Long bookingId) {
        log.info("Request to cancel booking {}", bookingId);
        Booking cancelledBooking = bookingService.cancelBooking(bookingId);
        return ResponseEntity.ok(mapBookingToResponseDto(cancelledBooking));
    }

    private BookingResponseDto mapBookingToResponseDto(Booking booking) {
        BookingResponseDto dto = new BookingResponseDto();
        dto.setId(booking.getId());
        dto.setFlightId(booking.getFlightId());
        dto.setUserId(booking.getUserId());
        dto.setSeatNumbers(booking.getSeatNumbers());
        dto.setPassengerName(booking.getPassengerName());
        dto.setPassengerEmail(booking.getPassengerEmail());
        dto.setPassengerPhone(booking.getPassengerPhone());
        dto.setPassengerAge(booking.getPassengerAge());
        dto.setAadhaarNumber(booking.getAadhaarNumber());
        dto.setMealPreference(booking.getMealPreference());
        dto.setWheelchairAssistance(booking.getWheelchairAssistance());
        dto.setAdditionalPassengers(
            booking.getPassengers().stream()
                .filter(p -> p.getPrimaryPassenger() == null || !p.getPrimaryPassenger())
                .map(p -> new PassengerDetailDto(p.getFullName(), p.getAge(), p.getMealPreference(), p.getEmail(), p.getPhone(), p.getAadhaarNumber(), p.getPassportNumber()))
                .collect(Collectors.toList())
        );
        dto.setTotalAmount(booking.getTotalAmount());
        dto.setStatus(booking.getStatus());
        dto.setCreatedAt(booking.getCreatedAt());
        return dto;
    }
}