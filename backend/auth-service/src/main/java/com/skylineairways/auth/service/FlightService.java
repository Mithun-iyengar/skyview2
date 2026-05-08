package com.skylineairways.auth.service;

import com.skylineairways.auth.exception.BadRequestException;
import com.skylineairways.auth.model.Flight;
import com.skylineairways.auth.repository.FlightRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class FlightService {

    private final FlightRepository flightRepository;

    public FlightService(FlightRepository flightRepository) {
        this.flightRepository = flightRepository;
    }

    @Transactional(readOnly = true)
    public List<Flight> listFlights() {
        return flightRepository.findAllByOrderByDepartureTimeAsc();
    }

    @Transactional(readOnly = true)
    public Flight getFlightById(Long id) {
        return flightRepository.findById(id)
                .orElseThrow(() -> new BadRequestException("Flight not found"));
    }

    @Transactional
    public Flight createFlight(Flight flight) {
        if (flight.getDepartureTime() == null) {
            throw new BadRequestException("Departure date and time are required.");
        }

        LocalDate departureDate = flight.getDepartureTime().atZone(ZoneId.systemDefault()).toLocalDate();
        if (departureDate.isBefore(LocalDate.now(ZoneId.systemDefault()))) {
            throw new BadRequestException("Departure date cannot be before today.");
        }

        if (flight.getArrivalTime() != null && !flight.getArrivalTime().isAfter(flight.getDepartureTime())) {
            throw new BadRequestException("Arrival time must be later than departure time.");
        }

        // Generate seats for each seat class
        if (flight.getSeatClasses() != null && !flight.getSeatClasses().isEmpty()) {
            for (int i = 0; i < flight.getSeatClasses().size(); i++) {
                com.skylineairways.auth.model.SeatClass seatClass = flight.getSeatClasses().get(i);
                // Generate seats with a prefix based on class type (E for Economy, B for Business)
                String prefix = seatClass.getClassType().equals("ECONOMY") ? "E" : "B";
                seatClass.generateSeats(prefix);
            }
        }

        flight.setId(null);
        flight.setCreatedAt(Instant.now());
        return flightRepository.save(flight);
    }

    @Transactional
    public void deleteFlight(Long id) {
        if (id == null) {
            return;
        }
        flightRepository.deleteById(id);
    }

    @Transactional
    public int removeFlightsBeforeDepartureBy2Hours() {
        Instant cutoff = Instant.now().plus(2, ChronoUnit.HOURS);
        return flightRepository.deleteFlightsAtOrBefore(cutoff);
    }
}
