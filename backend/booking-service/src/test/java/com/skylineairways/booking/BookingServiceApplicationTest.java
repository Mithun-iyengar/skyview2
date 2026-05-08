package com.skylineairways.booking;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

import org.junit.jupiter.api.Test;

class BookingServiceApplicationTest {

    @Test
    void applicationClassCanBeInstantiated() {
        assertDoesNotThrow(BookingServiceApplication::new);
    }
}
