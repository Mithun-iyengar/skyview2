package com.skylineairways.auth.service;

import com.skylineairways.auth.exception.BadRequestException;
import com.skylineairways.auth.model.Booking;
import com.skylineairways.auth.model.Flight;
import com.skylineairways.auth.model.SeatClass;
import com.skylineairways.auth.repository.BookingRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final SeatLockService seatLockService;
    private final FlightService flightService;

    public BookingService(BookingRepository bookingRepository, SeatLockService seatLockService, FlightService flightService) {
        this.bookingRepository = bookingRepository;
        this.seatLockService = seatLockService;
        this.flightService = flightService;
    }

    @Transactional
    public Booking createBooking(Long flightId, Long userId, List<String> seatNumbers,
                                String passengerName, String passengerEmail, String passengerPhone,
                                Integer passengerAge, String aadhaarNumber, String mealPreference,
                                Boolean wheelchairAssistance) {

        // Validate locks
        if (!seatLockService.validateLocks(userId, flightId, seatNumbers)) {
            throw new BadRequestException("Seats are not locked or expired");
        }

        // Calculate total amount
        Flight flight = flightService.getFlightById(flightId);
        BigDecimal totalAmount = calculateTotalAmount(flight, seatNumbers);

        Booking booking = new Booking();
        booking.setFlightId(flightId);
        booking.setUserId(userId);
        booking.setSeatNumbers(seatNumbers);
        booking.setPassengerName(passengerName);
        booking.setPassengerEmail(passengerEmail);
        booking.setPassengerPhone(passengerPhone);
        booking.setPassengerAge(passengerAge);
        booking.setAadhaarNumber(aadhaarNumber);
        booking.setMealPreference(mealPreference);
        booking.setWheelchairAssistance(wheelchairAssistance);
        booking.setTotalAmount(totalAmount);
        booking.setStatus("CONFIRMED");
        booking.setCreatedAt(Instant.now());

        Booking savedBooking = bookingRepository.save(booking);

        // Release locks after booking
        seatLockService.releaseSeats(userId, flightId, seatNumbers);

        return savedBooking;
    }

    private BigDecimal calculateTotalAmount(Flight flight, List<String> seatNumbers) {
        BigDecimal total = BigDecimal.ZERO;
        for (String seatNumber : seatNumbers) {
            for (SeatClass seatClass : flight.getSeatClasses()) {
                if (seatNumber.startsWith(seatClass.getClassType().equals("ECONOMY") ? "E" : "B")) {
                    total = total.add(seatClass.getPricePerSeat());
                    break;
                }
            }
        }
        return total;
    }

    @Transactional(readOnly = true)
    public List<Booking> getUserBookings(Long userId) {
        return bookingRepository.findByUserId(userId);
    }

    @Transactional(readOnly = true)
    public Booking getBookingById(Long bookingId) {
        return bookingRepository.findById(bookingId)
            .orElseThrow(() -> new BadRequestException("Booking not found"));
    }
}