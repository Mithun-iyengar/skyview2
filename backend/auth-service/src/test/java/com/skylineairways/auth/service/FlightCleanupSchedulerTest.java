package com.skylineairways.auth.service;

import static org.mockito.Mockito.verify;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class FlightCleanupSchedulerTest {

    @Mock
    private FlightService flightService;

    @Test
    void cleanupFlightsBeforeDepartureDelegatesToFlightService() {
        FlightCleanupScheduler scheduler = new FlightCleanupScheduler(flightService);

        scheduler.cleanupFlightsBeforeDeparture();

        verify(flightService).removeFlightsBeforeDepartureBy2Hours();
    }
}