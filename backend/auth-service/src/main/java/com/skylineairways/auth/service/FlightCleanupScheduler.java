package com.skylineairways.auth.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class FlightCleanupScheduler {

    private final FlightService flightService;

    public FlightCleanupScheduler(FlightService flightService) {
        this.flightService = flightService;
    }

    @Scheduled(fixedDelayString = "${flights.cleanup.fixed-delay-ms:60000}")
    public void cleanupFlightsBeforeDeparture() {
        flightService.removeFlightsBeforeDepartureBy2Hours();
    }
}
