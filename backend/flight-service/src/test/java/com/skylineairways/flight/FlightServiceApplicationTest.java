package com.skylineairways.flight;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

import org.junit.jupiter.api.Test;

class FlightServiceApplicationTest {

    @Test
    void applicationClassCanBeInstantiated() {
        assertDoesNotThrow(FlightServiceApplication::new);
    }
}
