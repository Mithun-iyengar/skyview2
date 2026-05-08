package com.skylineairways.booking.exception;

public class DuplicatePassengerException extends RuntimeException {

    public DuplicatePassengerException(String message) {
        super(message);
    }
}
