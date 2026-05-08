package com.skylineairways.flight.exception;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.context.request.WebRequest;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void handleBadRequestReturnsBadRequest() {
        var response = handler.handleBadRequestException(new BadRequestException("invalid"), (WebRequest) null);
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    }

    @Test
    void handleGlobalExceptionReturnsServerError() {
        var response = handler.handleGlobalException(new RuntimeException("boom"), (WebRequest) null);
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
    }
}
