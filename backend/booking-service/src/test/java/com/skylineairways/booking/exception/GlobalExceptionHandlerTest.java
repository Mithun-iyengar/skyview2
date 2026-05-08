package com.skylineairways.booking.exception;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.context.request.WebRequest;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void handlesInvalidPassengerDetails() {
        var response = handler.handleInvalidPassengerDetailsException(new InvalidPassengerDetailsException("invalid"), (WebRequest) null);
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    }

    @Test
    void handlesDuplicatePassengerDetails() {
        var response = handler.handleDuplicatePassengerException(new DuplicatePassengerException("dup"), (WebRequest) null);
        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
    }

    @Test
    void handlesPaymentFailed() {
        var response = handler.handlePaymentFailedException(new PaymentFailedException("failed"), (WebRequest) null);
        assertEquals(HttpStatus.PAYMENT_REQUIRED, response.getStatusCode());
    }
}
