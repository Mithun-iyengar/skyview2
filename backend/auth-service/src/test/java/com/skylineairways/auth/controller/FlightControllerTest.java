package com.skylineairways.auth.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import com.skylineairways.auth.model.Flight;
import com.skylineairways.auth.service.FlightService;

@ExtendWith(MockitoExtension.class)
class FlightControllerTest {

    @Mock private FlightService flightService;
    private FlightController flightController;

    @BeforeEach
    void setUp() {
        flightController = new FlightController(flightService);
    }

    @Test
    void getFlightsReturnsList() {
        when(flightService.listFlights()).thenReturn(List.of(new Flight()));

        ResponseEntity<List<Flight>> response = flightController.getFlights();

        assertEquals(HttpStatus.OK, response.getStatusCode());
    }

    @Test
    void createFlightReturnsCreatedFlight() {
        Flight flight = new Flight();
        flight.setFlightNumber("SK123");
        flight.setSourceAirport("BLR");
        flight.setDestinationAirport("DEL");
        flight.setBaseFare(BigDecimal.valueOf(1000));
        flight.setDepartureTime(Instant.now().plusSeconds(86400));
        when(flightService.createFlight(flight)).thenReturn(flight);

        ResponseEntity<Flight> response = flightController.createFlight(flight);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        verify(flightService).createFlight(flight);
    }
}