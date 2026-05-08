package com.skylineairways.auth.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.skylineairways.auth.exception.BadRequestException;
import com.skylineairways.auth.model.Flight;
import com.skylineairways.auth.model.SeatClass;
import com.skylineairways.auth.repository.FlightRepository;

@ExtendWith(MockitoExtension.class)
class FlightServiceTest {

    @Mock private FlightRepository flightRepository;

    private FlightService flightService;

    @BeforeEach
    void setUp() {
        flightService = new FlightService(flightRepository);
    }

    @Test
    void createFlightGeneratesSeatsAndSavesFlight() {
        Flight flight = new Flight();
        flight.setFlightNumber("SK123");
        flight.setSourceAirport("BLR");
        flight.setDestinationAirport("DEL");
        flight.setBaseFare(BigDecimal.valueOf(1000));
        flight.setDepartureTime(Instant.now().plusSeconds(86400));
        flight.setArrivalTime(Instant.now().plusSeconds(90000));

        SeatClass economy = new SeatClass("ECONOMY", "Economy", null, 2, 2, BigDecimal.valueOf(1200));
        flight.setSeatClasses(List.of(economy));

        when(flightRepository.save(org.mockito.ArgumentMatchers.any(Flight.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Flight saved = flightService.createFlight(flight);

        assertEquals(4, saved.getSeatClasses().get(0).getSeats().size());
        assertEquals(4, saved.getTotalSeats());
        verify(flightRepository).save(org.mockito.ArgumentMatchers.any(Flight.class));
    }

    @Test
    void createFlightRejectsPastDepartureDate() {
        Flight flight = new Flight();
        flight.setFlightNumber("SK123");
        flight.setSourceAirport("BLR");
        flight.setDestinationAirport("DEL");
        flight.setBaseFare(BigDecimal.valueOf(1000));
        flight.setDepartureTime(Instant.now().minusSeconds(86400));

        assertThrows(BadRequestException.class, () -> flightService.createFlight(flight));
    }

    @Test
    void deleteFlightIgnoresNullId() {
        flightService.deleteFlight(null);
        verify(flightRepository, org.mockito.Mockito.never()).deleteById(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void removeFlightsBeforeDepartureBy2HoursUsesCutoff() {
        when(flightRepository.deleteFlightsAtOrBefore(org.mockito.ArgumentMatchers.any())).thenReturn(3);

        int deleted = flightService.removeFlightsBeforeDepartureBy2Hours();

        assertEquals(3, deleted);
    }
}