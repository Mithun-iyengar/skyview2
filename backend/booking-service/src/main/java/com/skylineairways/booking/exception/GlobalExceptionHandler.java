package com.skylineairways.booking.exception;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import feign.FeignException;
import com.fasterxml.jackson.core.JsonProcessingException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

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

    @ExceptionHandler(FeignException.class)
    public ResponseEntity<Map<String, Object>> handleFeignException(FeignException ex, WebRequest request) {
        int statusCode = ex.status();
        HttpStatus status = HttpStatus.resolve(statusCode);
        if (status == null) {
            status = HttpStatus.BAD_GATEWAY;
        }

        String message = extractFeignMessage(ex);
        if (message == null || message.isBlank()) {
            message = "Downstream service request failed";
        }

        log.warn("Downstream service error (status {}): {}", status.value(), message);
        return buildErrorResponse(message, status);
    }

    private String extractFeignMessage(FeignException ex) {
        String content = ex.contentUTF8();
        if (content == null || content.isBlank()) {
            return ex.getMessage();
        }

        try {
            JsonNode root = OBJECT_MAPPER.readTree(content);
            if (root.hasNonNull("message")) {
                return root.get("message").asText();
            }
            if (root.hasNonNull("error")) {
                return root.get("error").asText();
            }
        } catch (JsonProcessingException ignored) {
            // Fall through and return raw content for non-JSON payloads.
        }

        return content;
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