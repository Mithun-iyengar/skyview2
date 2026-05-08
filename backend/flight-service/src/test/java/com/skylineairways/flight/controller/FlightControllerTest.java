package com.skylineairways.flight.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import com.skylineairways.flight.model.Flight;
import com.skylineairways.flight.model.SeatClass;
import com.skylineairways.flight.service.FlightService;

@ExtendWith(MockitoExtension.class)
class FlightControllerTest {

    @Mock private FlightService flightService;
    private FlightController flightController;

    @BeforeEach
    void setUp() {
        flightController = new FlightController(flightService);
    }

    @Test
    void getFlightsReturnsOk() {
        when(flightService.listFlights()).thenReturn(List.of(new Flight()));

        ResponseEntity<List<Flight>> response = flightController.getFlights();

        assertEquals(HttpStatus.OK, response.getStatusCode());
    }

    @Test
    void createFlightReturnsCreated() {
        Flight flight = new Flight();
        flight.setFlightNumber("SK123");
        flight.setSourceAirport("BLR");
        flight.setDestinationAirport("DEL");
        flight.setBaseFare(BigDecimal.valueOf(1000));
        flight.setTaxes(BigDecimal.valueOf(100));
        flight.setDepartureTime(Instant.now().plusSeconds(86400));
        flight.setSeatClasses(List.of(new SeatClass("ECONOMY", "Economy", null, 1, 2, null)));
        when(flightService.createFlight(flight)).thenReturn(flight);

        ResponseEntity<Flight> response = flightController.createFlight(flight);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
    }

    @Test
    void occupySeatsReturnsUpdatedFlight() {
        Flight flight = new Flight();
        when(flightService.markSeatsOccupied(1L, List.of("E1A"))).thenReturn(flight);

        ResponseEntity<Flight> response = flightController.occupySeats(1L, Map.of("seatNumbers", List.of("E1A")));

        assertEquals(HttpStatus.OK, response.getStatusCode());
    }
}
