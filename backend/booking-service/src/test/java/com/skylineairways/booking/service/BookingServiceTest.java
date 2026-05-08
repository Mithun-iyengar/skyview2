package com.skylineairways.booking.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
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

import com.skylineairways.booking.client.FlightServiceClient;
import com.skylineairways.booking.client.NotificationServiceClient;
import com.skylineairways.booking.client.PaymentServiceClient;
import com.skylineairways.booking.dto.PaymentResponse;
import com.skylineairways.booking.exception.DuplicatePassengerException;
import com.skylineairways.booking.exception.InvalidPassengerDetailsException;
import com.skylineairways.booking.model.Booking;
import com.skylineairways.booking.model.BookingPassenger;
import com.skylineairways.booking.repository.BookingRepository;

@ExtendWith(MockitoExtension.class)
class BookingServiceTest {

    @Mock private BookingRepository bookingRepository;
    @Mock private SeatLockService seatLockService;
    @Mock private FlightServiceClient flightServiceClient;
    @Mock private PaymentServiceClient paymentServiceClient;
    @Mock private NotificationServiceClient notificationServiceClient;

    private BookingService bookingService;

    @BeforeEach
    void setUp() {
        bookingService = new BookingService(bookingRepository, seatLockService, flightServiceClient, paymentServiceClient, notificationServiceClient);
    }

    @Test
    void createBookingWithWalletPaymentConfirmsBooking() {
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(seatLockService.validateLocks(2L, 1L, List.of("E1A"))).thenReturn(true);

        Booking booking = bookingService.createBooking(
                1L,
                2L,
                List.of("E1A"),
                "Mithun",
                "test@example.com",
                "9876543210",
                30,
                "123456789012",
                null,
                "VEG",
                false,
                BigDecimal.valueOf(1000),
                null,
                true);

        assertEquals("CONFIRMED", booking.getStatus());
        verify(flightServiceClient).markSeatsOccupied(1L, Map.of("seatNumbers", List.of("E1A")));
        verify(notificationServiceClient).sendBookingConfirmation(eq("test@example.com"), any());
    }

    @Test
    void createBookingRejectsInvalidPassengerDetails() {
        assertThrows(InvalidPassengerDetailsException.class, () -> bookingService.createBooking(
                1L,
                2L,
                List.of("E1A"),
                "",
                "test@example.com",
                "9876543210",
                30,
                "123456789012",
                null,
                "VEG",
                false,
                BigDecimal.valueOf(1000),
                null,
                true));
    }

    @Test
    void createBookingRejectsDuplicateAdditionalPassengerIdentifiers() {
        BookingPassenger additional = new BookingPassenger();
        additional.setFullName("Co Passenger");
        additional.setAge(28);
        additional.setMealPreference("VEG");
        additional.setEmail("test@example.com");

        assertThrows(DuplicatePassengerException.class, () -> bookingService.createBooking(
                1L,
                2L,
                List.of("E1A"),
                "Mithun",
                "test@example.com",
                "9876543210",
                30,
                "123456789012",
                null,
                "VEG",
                false,
                BigDecimal.valueOf(1000),
                List.of(additional),
                true));
    }
}
