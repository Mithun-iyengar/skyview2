package com.skylineairways.booking.service;

import com.skylineairways.booking.client.AuthServiceClient;
import com.skylineairways.booking.client.FlightServiceClient;
import com.skylineairways.booking.client.NotificationServiceClient;
import com.skylineairways.booking.client.PaymentServiceClient;
import com.skylineairways.booking.dto.PaymentResponse;
import com.skylineairways.booking.dto.WalletResponse;
import com.skylineairways.booking.exception.DuplicatePassengerException;
import com.skylineairways.booking.exception.InvalidPassengerDetailsException;
import com.skylineairways.booking.exception.PaymentFailedException;
import com.skylineairways.booking.model.Booking;
import com.skylineairways.booking.model.BookingPassenger;
import com.skylineairways.booking.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookingService {

    private final BookingRepository bookingRepository;
    private final SeatLockService seatLockService;
    private final FlightServiceClient flightServiceClient;
    private final PaymentServiceClient paymentServiceClient;
    private final NotificationServiceClient notificationServiceClient;
    private final AuthServiceClient authServiceClient;

    /**
     * Main booking creation flow with complete transaction safety.
     * 
     * Flow:
     * 1. Validate passenger details
     * 2. Validate seat availability (must be AVAILABLE)
     * 3. Lock seats with HOLD status (temporary hold for 5 minutes)
     * 4. Create booking record with PENDING_PAYMENT status
     * 5a. If wallet payment: deduct wallet → mark BOOKED
     * 5b. If card payment: process payment → if success mark BOOKED, else release holds
     * 6. Send confirmation/failure notifications
     * 
     * Transaction rollback on failure ensures:
     * - Seat holds are released
     * - Wallet is not deducted
     * - Booking record is not created
     */
    @Transactional
    public Booking createBooking(Long flightId, Long userId, List<String> seatNumbers,
                                String passengerName, String passengerEmail, String passengerPhone,
                                Integer passengerAge, String aadhaarNumber, String passportNumber,
                                String mealPreference, Boolean wheelchairAssistance, BigDecimal totalAmount,
                                List<BookingPassenger> additionalPassengers,
                                boolean walletPayment) {

        log.info("Creating booking for user {} on flight {} - walletPayment: {}", userId, flightId, walletPayment);
        boolean seatsHeld = false;

        // STEP 1: Validate all passenger details
        validatePassengerDetails(passengerName, passengerEmail, passengerPhone, passengerAge, aadhaarNumber, passportNumber);
        validateAdditionalPassengers(additionalPassengers);
        validateDuplicatePassengerIdentifiers(passengerEmail, passengerPhone, aadhaarNumber, passportNumber, additionalPassengers);
        validateSeatsAndPassengersMatch(seatNumbers, passengerName, additionalPassengers);

        try {
            // STEP 2: Validate seats are AVAILABLE (not HOLD, BOOKED, or BLOCKED)
            log.debug("Validating seat availability for flight {} seats: {}", flightId, seatNumbers);
            flightServiceClient.validateSeatsAvailable(flightId, Map.of("seatNumbers", seatNumbers));

            // STEP 3: Place HOLD on seats (AVAILABLE → HOLD)
            log.debug("Placing HOLD on seats for flight {} seats: {}", flightId, seatNumbers);
            flightServiceClient.holdSeats(flightId, Map.of("seatNumbers", seatNumbers));
            seatsHeld = true;

            // STEP 4: Create booking record with PENDING_PAYMENT status
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
            booking.setStatus("PENDING_PAYMENT");
            booking.setCreatedAt(Instant.now());

            List<BookingPassenger> passengers = buildBookingPassengers(passengerName, passengerEmail, passengerPhone,
                    passengerAge, aadhaarNumber, passportNumber, mealPreference, additionalPassengers);
            booking.setPassengers(passengers);
            linkPassengersToBooking(booking);

            Booking savedBooking = bookingRepository.save(booking);
            log.debug("Booking record created with ID: {} and status: PENDING_PAYMENT", savedBooking.getId());

            // STEP 5a: Handle Wallet Payment
            if (walletPayment) {
                log.info("Processing wallet payment for booking {}", savedBooking.getId());
                return processWalletPayment(savedBooking, flightId, seatNumbers, passengerEmail);
            }

            // STEP 5b: Handle Card Payment
            log.info("Processing card payment for booking {}", savedBooking.getId());
            return processCardPayment(savedBooking, flightId, seatNumbers, passengerEmail, totalAmount, userId);

        } catch (Exception e) {
            log.error("Booking creation failed for user {} - Rolling back transaction", userId, e);
            if (seatsHeld) {
                try {
                    flightServiceClient.releaseHoldOnSeats(flightId, Map.of("seatNumbers", seatNumbers));
                } catch (Exception releaseException) {
                    log.error("Failed to release held seats during rollback", releaseException);
                }
            }
            // Transaction will be rolled back automatically by Spring
            // This ensures:
            // - Seat holds are not created
            // - Booking is not saved
            // - No wallet changes are persisted
            throw e;
        }
    }

    /**
     * Process booking with wallet payment.
     * Deducts amount from wallet and confirms booking immediately.
     */
    /**
     * Process booking with wallet payment.
     * Deducts amount from wallet and confirms booking immediately.
     */
    private Booking processWalletPayment(Booking booking, Long flightId, List<String> seatNumbers,
                                         String passengerEmail) {
        boolean walletDebited = false;
        try {
            log.info("Deducting {} from wallet for user {}", booking.getTotalAmount(), booking.getUserId());
            
            // Deduct from wallet (throws exception if insufficient balance)
            WalletResponse walletResponse = authServiceClient.deductMoneyFromWallet(
                    Map.of(
                        "userId", booking.getUserId(),
                        "amount", booking.getTotalAmount()
                    )
            );
            walletDebited = true;
            
            log.info("Wallet deducted successfully. New balance: {}", walletResponse.getBalance());

            // Mark seats as BOOKED (HOLD → BOOKED)
            log.debug("Marking seats as BOOKED on flight {}: {}", flightId, seatNumbers);
            flightServiceClient.markSeatsOccupied(flightId, Map.of("seatNumbers", seatNumbers));

            // Update booking to CONFIRMED
            booking.setStatus("CONFIRMED");
            Booking confirmedBooking = bookingRepository.save(booking);
            log.info("Booking confirmed with ID: {}", confirmedBooking.getId());

            // Send confirmation notification
            String bookingDetails = buildBookingDetails(confirmedBooking);
            try {
                notificationServiceClient.sendBookingConfirmation(passengerEmail, bookingDetails);
            } catch (Exception notificationException) {
                log.error("Failed to send booking confirmation notification", notificationException);
                // Don't fail booking if notification fails
            }

            return confirmedBooking;

        } catch (Exception e) {
            log.error("Wallet payment failed for booking {}: {}", booking.getId(), e.getMessage());

            if (walletDebited) {
                try {
                    log.warn("Refunding wallet after failed booking for user {}", booking.getUserId());
                    authServiceClient.addMoneyToWallet(
                            Map.of(
                                    "userId", booking.getUserId(),
                                    "amount", booking.getTotalAmount()
                            )
                    );
                } catch (Exception refundException) {
                    log.error("Failed to refund wallet after booking failure", refundException);
                }
            }
            
            // Release seat holds (HOLD → AVAILABLE) since payment failed
            try {
                log.warn("Releasing seat holds due to payment failure");
                flightServiceClient.releaseHoldOnSeats(flightId, Map.of("seatNumbers", seatNumbers));
            } catch (Exception releaseException) {
                log.error("Failed to release seat holds", releaseException);
                // Log error but don't throw - we need to update booking status
            }

            // Update booking to PAYMENT_FAILED
            booking.setStatus("PAYMENT_FAILED");
            bookingRepository.save(booking);

            // Send failure notification
            String paymentDetails = "Booking ID: " + booking.getId() + ", Amount: " + booking.getTotalAmount() + 
                                   ", Error: " + e.getMessage();
            try {
                notificationServiceClient.sendPaymentFailed(passengerEmail, paymentDetails);
            } catch (Exception notificationException) {
                log.error("Failed to send payment failure notification", notificationException);
            }

            throw new PaymentFailedException("Wallet payment failed: " + e.getMessage());
        }
    }

    /**
     * Process booking with card payment.
     * Calls payment service to process payment, marks seats if successful or releases if failed.
     */
    private Booking processCardPayment(Booking booking, Long flightId, List<String> seatNumbers,
                                       String passengerEmail, BigDecimal totalAmount, Long userId) {
        try {
            log.info("Processing card payment for booking {}", booking.getId());
            
            // Call payment service
            Map<String, Object> paymentRequest = Map.of(
                    "bookingId", booking.getId(),
                    "amount", totalAmount
            );
            PaymentResponse paymentResponse = paymentServiceClient.processPayment(paymentRequest);

            if ("SUCCESS".equals(paymentResponse.getStatus())) {
                log.info("Card payment successful for booking {}", booking.getId());

                // Mark seats as BOOKED (HOLD → BOOKED)
                log.debug("Marking seats as BOOKED on flight {}: {}", flightId, seatNumbers);
                flightServiceClient.markSeatsOccupied(flightId, Map.of("seatNumbers", seatNumbers));

                // Update booking to CONFIRMED
                booking.setStatus("CONFIRMED");
                Booking confirmedBooking = bookingRepository.save(booking);
                log.info("Booking confirmed with ID: {}", confirmedBooking.getId());

                // Send confirmation notification
                String bookingDetails = buildBookingDetails(confirmedBooking);
                try {
                    notificationServiceClient.sendBookingConfirmation(passengerEmail, bookingDetails);
                } catch (Exception notificationException) {
                    log.error("Failed to send booking confirmation notification", notificationException);
                }

                return confirmedBooking;

            } else {
                // Payment failed - release seat holds and fail booking
                log.warn("Card payment failed for booking {}: status = {}", booking.getId(), paymentResponse.getStatus());
                return handlePaymentFailure(booking, flightId, seatNumbers, passengerEmail, totalAmount);
            }

        } catch (Exception e) {
            log.error("Card payment processing error for booking {}: {}", booking.getId(), e.getMessage());
            return handlePaymentFailure(booking, flightId, seatNumbers, passengerEmail, totalAmount);
        }
    }

    /**
     * Handle payment failure: release seat holds and update booking status.
     */
    private Booking handlePaymentFailure(Booking booking, Long flightId, List<String> seatNumbers,
                                        String passengerEmail, BigDecimal totalAmount) {
        try {
            // Release seat holds (HOLD → AVAILABLE)
            log.warn("Releasing seat holds due to payment failure for booking {}", booking.getId());
            flightServiceClient.releaseHoldOnSeats(flightId, Map.of("seatNumbers", seatNumbers));
        } catch (Exception releaseException) {
            log.error("Failed to release seat holds for booking {}", booking.getId(), releaseException);
            // Log error but continue - we need to update booking status
        }

        // Update booking to PAYMENT_FAILED
        booking.setStatus("PAYMENT_FAILED");
        Booking failedBooking = bookingRepository.save(booking);
        log.info("Booking {} marked as PAYMENT_FAILED", failedBooking.getId());

        // Send failure notification
        String paymentDetails = "Booking ID: " + failedBooking.getId() + ", Amount: " + totalAmount;
        try {
            notificationServiceClient.sendPaymentFailed(passengerEmail, paymentDetails);
        } catch (Exception notificationException) {
            log.error("Failed to send payment failure notification", notificationException);
        }

        throw new PaymentFailedException("Payment processing failed");
    }

    private List<BookingPassenger> buildBookingPassengers(String passengerName, String passengerEmail,
                                                          String passengerPhone, Integer passengerAge,
                                                          String aadhaarNumber, String passportNumber,
                                                          String mealPreference,
                                                          List<BookingPassenger> additionalPassengers) {
        List<BookingPassenger> passengers = new ArrayList<>();

        BookingPassenger primaryPassenger = new BookingPassenger();
        primaryPassenger.setFullName(passengerName);
        primaryPassenger.setEmail(passengerEmail);
        primaryPassenger.setPhone(passengerPhone);
        primaryPassenger.setAge(passengerAge);
        primaryPassenger.setAadhaarNumber(aadhaarNumber);
        primaryPassenger.setPassportNumber(passportNumber);
        primaryPassenger.setMealPreference(mealPreference);
        primaryPassenger.setPrimaryPassenger(true);
        passengers.add(primaryPassenger);

        if (additionalPassengers != null) {
            for (BookingPassenger additionalPassenger : additionalPassengers) {
                additionalPassenger.setPrimaryPassenger(false);
                passengers.add(additionalPassenger);
            }
        }

        return passengers;
    }

    private void linkPassengersToBooking(Booking booking) {
        if (booking.getPassengers() == null) {
            return;
        }
        booking.getPassengers().forEach(passenger -> passenger.setBooking(booking));
    }

    private void validatePassengerDetails(String name, String email, String phone, Integer age, String aadhaar, String passportNumber) {
        if (name == null || name.trim().isEmpty()) {
            throw new InvalidPassengerDetailsException("Passenger name is required");
        }
        if (email == null || !email.matches("^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$")) {
            throw new InvalidPassengerDetailsException("Valid email is required");
        }
        if (phone == null || !phone.matches("^\\d{10}$")) {
            throw new InvalidPassengerDetailsException("Valid 10-digit phone number is required");
        }
        if (age == null || age < 1 || age > 120) {
            throw new InvalidPassengerDetailsException("Valid age is required");
        }
        if (aadhaar == null || !aadhaar.matches("^\\d{12}$")) {
            throw new InvalidPassengerDetailsException("Valid 12-digit Aadhaar number is required");
        }
        validateOptionalPassportNumber(passportNumber, "Primary passenger passport number must be 6 to 20 alphanumeric characters");
    }

    private void validateAdditionalPassengers(List<BookingPassenger> additionalPassengers) {
        if (additionalPassengers == null) {
            return;
        }

        for (BookingPassenger passenger : additionalPassengers) {
            if (passenger == null) {
                throw new InvalidPassengerDetailsException("Additional passenger details are invalid");
            }

            if (passenger.getFullName() == null || passenger.getFullName().trim().isEmpty()) {
                throw new InvalidPassengerDetailsException("Additional passenger name is required");
            }

            Integer age = passenger.getAge();
            if (age == null || age < 1 || age > 120) {
                throw new InvalidPassengerDetailsException("Valid additional passenger age is required");
            }

            if (passenger.getMealPreference() == null || passenger.getMealPreference().trim().isEmpty()) {
                throw new InvalidPassengerDetailsException("Additional passenger meal preference is required");
            }

            if (passenger.getEmail() != null && !passenger.getEmail().trim().isEmpty()) {
                String email = passenger.getEmail().trim();
                if (!email.matches("^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$")) {
                    throw new InvalidPassengerDetailsException("Additional passenger email must be valid");
                }
            }
            if (passenger.getPhone() != null && !passenger.getPhone().trim().isEmpty()) {
                String phone = passenger.getPhone().trim();
                if (!phone.matches("^\\d{10}$")) {
                    throw new InvalidPassengerDetailsException("Additional passenger phone must be 10 digits");
                }
            }
            if (passenger.getAadhaarNumber() != null && !passenger.getAadhaarNumber().trim().isEmpty()) {
                String aadhaar = passenger.getAadhaarNumber().trim();
                if (!aadhaar.matches("^\\d{12}$")) {
                    throw new InvalidPassengerDetailsException("Additional passenger Aadhaar must be 12 digits");
                }
            }

            validateOptionalPassportNumber(passenger.getPassportNumber(), "Additional passenger passport number must be 6 to 20 alphanumeric characters");
        }
    }

    private void validateDuplicatePassengerIdentifiers(String passengerEmail, String passengerPhone,
                                                       String aadhaarNumber, String passportNumber,
                                                       List<BookingPassenger> additionalPassengers) {
        Set<String> emailSet = new HashSet<>();
        Set<String> phoneSet = new HashSet<>();
        Set<String> aadhaarSet = new HashSet<>();
        Set<String> passportSet = new HashSet<>();

        // Validate primary passenger identifiers
        checkAndAddIdentifier(emailSet, "email", normalizeIdentifier(passengerEmail));
        checkAndAddIdentifier(phoneSet, "phone", normalizeIdentifier(passengerPhone));
        checkAndAddIdentifier(aadhaarSet, "aadhaar", normalizeIdentifier(aadhaarNumber));
        checkAndAddIdentifier(passportSet, "passport", normalizeIdentifier(passportNumber));

        // Validate additional passengers against primary and each other
        if (additionalPassengers != null) {
            for (BookingPassenger passenger : additionalPassengers) {
                checkAndAddIdentifier(emailSet, "email", normalizeIdentifier(passenger.getEmail()));
                checkAndAddIdentifier(phoneSet, "phone", normalizeIdentifier(passenger.getPhone()));
                checkAndAddIdentifier(aadhaarSet, "aadhaar", normalizeIdentifier(passenger.getAadhaarNumber()));
                checkAndAddIdentifier(passportSet, "passport", normalizeIdentifier(passenger.getPassportNumber()));
            }
        }
    }

    private void checkAndAddIdentifier(Set<String> set, String type, String value) {
        // Skip empty values - optional identifiers can be empty across passengers
        if (value.isEmpty()) {
            return;
        }
        
        // Check if this value already exists (duplicate found)
        if (set.contains(value)) {
            throw new DuplicatePassengerException(
                String.format("Duplicate %s found in booking. Each passenger must have unique identifier.", type)
            );
        }
        
        // Add to set for future validation
        set.add(value);
    }

    private void validateOptionalPassportNumber(String passportNumber, String errorMessage) {
        if (passportNumber == null || passportNumber.trim().isEmpty()) {
            return;
        }

        if (!passportNumber.trim().matches("^[A-Za-z0-9]{6,20}$")) {
            throw new InvalidPassengerDetailsException(errorMessage);
        }
    }

    private String normalizeIdentifier(String value) {
        return value == null ? "" : value.trim().toLowerCase();
    }

    @Transactional(readOnly = true)
    public List<Booking> getUserBookings(Long userId) {
        log.debug("Getting bookings for user {}", userId);
        return bookingRepository.findByUserId(userId);
    }

    @Transactional(readOnly = true)
    public Booking getBookingById(Long bookingId) {
        Objects.requireNonNull(bookingId, "bookingId must not be null");
        log.debug("Getting booking by id {}", bookingId);
        return bookingRepository.findById(bookingId)
                .orElseThrow(() -> new InvalidPassengerDetailsException("Booking not found"));
    }

    private void validateSeatsAndPassengersMatch(List<String> seatNumbers, String passengerName,
                                                  List<BookingPassenger> additionalPassengers) {
        if (seatNumbers == null) {
            throw new InvalidPassengerDetailsException("Seat numbers are required");
        }
        
        int seatsCount = seatNumbers.size();
        int passengersCount = 1 + (additionalPassengers == null ? 0 : 
                                   (int) additionalPassengers.stream()
                                       .filter(p -> p != null && p.getFullName() != null && !p.getFullName().trim().isEmpty())
                                       .count());
        
        if (passengersCount < seatsCount) {
            throw new InvalidPassengerDetailsException(
                String.format("You have selected %d seat(s) but only provided %d passenger(s). Each seat must have a different passenger.",
                    seatsCount, passengersCount)
            );
        }
        
        // Validate unique passenger names
        Set<String> normalizedNames = new HashSet<>();
        String normalizedPrimaryName = normalizePassengerName(passengerName);
        
        if (!normalizedNames.add(normalizedPrimaryName)) {
            throw new InvalidPassengerDetailsException("Primary passenger name is not unique");
        }
        
        if (additionalPassengers != null) {
            for (BookingPassenger passenger : additionalPassengers) {
                if (passenger == null || passenger.getFullName() == null || passenger.getFullName().trim().isEmpty()) {
                    continue;
                }
                
                String normalizedAdditionalName = normalizePassengerName(passenger.getFullName());
                
                if (!normalizedNames.add(normalizedAdditionalName)) {
                    throw new InvalidPassengerDetailsException(
                        String.format("Duplicate passenger name found: '%s'. Each passenger must have a unique name in the same booking.",
                            passenger.getFullName())
                    );
                }
            }
        }
    }

    private String normalizePassengerName(String name) {
        return name == null ? "" : name.trim().toLowerCase();
    }

    private String buildBookingDetails(Booking booking) {
        return String.format(
            "Booking ID: %d\n" +
            "Flight ID: %d\n" +
            "Passenger: %s\n" +
            "Email: %s\n" +
            "Seats: %s\n" +
            "Total Amount: %.2f\n" +
            "Status: %s",
            booking.getId(),
            booking.getFlightId(),
            booking.getPassengerName(),
            booking.getPassengerEmail(),
            String.join(", ", booking.getSeatNumbers()),
            booking.getTotalAmount(),
            booking.getStatus()
        );
    }
}