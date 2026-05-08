package com.skylineairways.flight.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
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

import com.skylineairways.flight.exception.BadRequestException;
import com.skylineairways.flight.model.Flight;
import com.skylineairways.flight.model.SeatClass;
import com.skylineairways.flight.repository.FlightRepository;

@ExtendWith(MockitoExtension.class)
class FlightServiceTest {

    @Mock private FlightRepository flightRepository;

    private FlightService flightService;

    @BeforeEach
    void setUp() {
        flightService = new FlightService(flightRepository);
    }

    @Test
    void createFlightAppliesPricingAndGeneratesSeats() {
        Flight flight = new Flight();
        flight.setFlightNumber("SK123");
        flight.setSourceAirport("BLR");
        flight.setDestinationAirport("DEL");
        flight.setBaseFare(BigDecimal.valueOf(1000));
        flight.setTaxes(BigDecimal.valueOf(100));
        flight.setBusinessMultiplier(BigDecimal.valueOf(2));
        flight.setDepartureTime(Instant.now().plusSeconds(86400));
        flight.setArrivalTime(Instant.now().plusSeconds(90000));
        flight.setSeatClasses(List.of(
                new SeatClass("ECONOMY", "Economy", null, 1, 2, null),
                new SeatClass("BUSINESS", "Business", null, 1, 2, null)
        ));

        when(flightRepository.save(org.mockito.ArgumentMatchers.any(Flight.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Flight saved = flightService.createFlight(flight);

        assertEquals(BigDecimal.valueOf(1100).setScale(2), saved.getEconomyPrice());
        assertEquals(BigDecimal.valueOf(2100).setScale(2), saved.getBusinessPrice());
        assertEquals(4, saved.getTotalSeats());
        assertEquals("BUSINESS", saved.getSeatClasses().get(0).getClassType());
        assertEquals(2, saved.getSeatClasses().get(0).getSeats().size());
        verify(flightRepository).save(org.mockito.ArgumentMatchers.any(Flight.class));
    }

    @Test
    void createFlightRejectsInvalidArrivalTime() {
        Flight flight = new Flight();
        flight.setFlightNumber("SK123");
        flight.setSourceAirport("BLR");
        flight.setDestinationAirport("DEL");
        flight.setBaseFare(BigDecimal.valueOf(1000));
        flight.setTaxes(BigDecimal.valueOf(100));
        flight.setDepartureTime(Instant.now().plusSeconds(86400));
        flight.setArrivalTime(Instant.now().plusSeconds(1000));

        assertThrows(BadRequestException.class, () -> flightService.createFlight(flight));
    }

    @Test
    void markSeatsOccupiedUpdatesSeatStatuses() {
        Flight flight = new Flight();
        flight.setId(1L);
        SeatClass economy = new SeatClass("ECONOMY", "Economy", null, 1, 2, null);
        economy.generateSeats("E");
        flight.setSeatClasses(List.of(economy));
        when(flightRepository.findById(1L)).thenReturn(java.util.Optional.of(flight));
        when(flightRepository.save(org.mockito.ArgumentMatchers.any(Flight.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Flight updated = flightService.markSeatsOccupied(1L, List.of("E1A"));

        assertEquals("OCCUPIED", updated.getSeatClasses().get(0).getSeats().get(0).getSeatStatus());
    }
}
