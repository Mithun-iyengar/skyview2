package com.skylineairways.booking.exception;

public class FlightOverbookedException extends RuntimeException {
    public FlightOverbookedException(String message) {
        super(message);
    }
}
