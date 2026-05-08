package com.skylineairways.booking.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;

import java.time.LocalDateTime;
import org.springframework.dao.DataIntegrityViolationException;
import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(InvalidPassengerDetailsException.class)
    public ResponseEntity<Map<String, Object>> handleInvalidPassengerDetailsException(InvalidPassengerDetailsException ex, WebRequest request) {
        log.warn("Invalid passenger details: {}", ex.getMessage());
        return buildErrorResponse(ex.getMessage(), HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler({DuplicatePassengerException.class, DataIntegrityViolationException.class})
    public ResponseEntity<Map<String, Object>> handleDuplicatePassengerException(Exception ex, WebRequest request) {
        String message = ex.getMessage();
        if (message == null || message.isBlank()) {
            message = "Duplicate passenger details found in booking";
        }
        log.warn("Duplicate passenger details: {}", message);
        return buildErrorResponse("Duplicate passenger details found in booking", HttpStatus.CONFLICT);
    }

    @ExceptionHandler(PaymentFailedException.class)
    public ResponseEntity<Map<String, Object>> handlePaymentFailedException(PaymentFailedException ex, WebRequest request) {
        log.error("Payment failed: {}", ex.getMessage());
        return buildErrorResponse(ex.getMessage(), HttpStatus.PAYMENT_REQUIRED);
    }

    @ExceptionHandler(FlightOverbookedException.class)
    public ResponseEntity<Map<String, Object>> handleFlightOverbookedException(FlightOverbookedException ex, WebRequest request) {
        log.warn("Flight overbooked: {}", ex.getMessage());
        return buildErrorResponse(ex.getMessage(), HttpStatus.CONFLICT);
    }

    @ExceptionHandler(SeatLockExpiredException.class)
    public ResponseEntity<Map<String, Object>> handleSeatLockExpiredException(SeatLockExpiredException ex, WebRequest request) {
        log.warn("Seat lock expired: {}", ex.getMessage());
        return buildErrorResponse(ex.getMessage(), HttpStatus.GONE);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgumentException(IllegalArgumentException ex, WebRequest request) {
        log.warn("Invalid request: {}", ex.getMessage());
        return buildErrorResponse(ex.getMessage(), HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(NumberFormatException.class)
    public ResponseEntity<Map<String, Object>> handleNumberFormatException(NumberFormatException ex, WebRequest request) {
        log.warn("Invalid numeric value: {}", ex.getMessage());
        return buildErrorResponse("Invalid numeric value provided", HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleUserNotFoundException(UserNotFoundException ex, WebRequest request) {
        log.warn("User not found: {}", ex.getMessage());
        return buildErrorResponse(ex.getMessage(), HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(DuplicateRegistrationException.class)
    public ResponseEntity<Map<String, Object>> handleDuplicateRegistrationException(DuplicateRegistrationException ex, WebRequest request) {
        log.warn("Duplicate registration: {}", ex.getMessage());
        return buildErrorResponse(ex.getMessage(), HttpStatus.CONFLICT);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGlobalException(Exception ex, WebRequest request) {
        log.error("Unexpected error: ", ex);
        return buildErrorResponse("An unexpected error occurred", HttpStatus.INTERNAL_SERVER_ERROR);
    }

    private ResponseEntity<Map<String, Object>> buildErrorResponse(String message, HttpStatus status) {
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("timestamp", LocalDateTime.now());
        errorResponse.put("status", status.value());
        errorResponse.put("error", status.getReasonPhrase());
        errorResponse.put("message", message);
        return new ResponseEntity<>(errorResponse, status);
    }
}