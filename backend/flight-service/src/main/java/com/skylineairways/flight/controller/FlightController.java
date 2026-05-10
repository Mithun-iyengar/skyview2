package com.skylineairways.flight.controller;

import com.skylineairways.flight.model.Flight;
import com.skylineairways.flight.service.FlightService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/flights")
@RequiredArgsConstructor
@Slf4j
public class FlightController {

    private final FlightService flightService;

    @GetMapping
    public ResponseEntity<List<Flight>> getFlights() {
        log.info("Request to get all flights");
        return ResponseEntity.ok(flightService.listFlights());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Flight> getFlight(@PathVariable Long id) {
        log.info("Request to get flight: {}", id);
        return ResponseEntity.ok(flightService.getFlightById(id));
    }

    @PostMapping
    public ResponseEntity<Flight> createFlight(@RequestBody Flight flight) {
        try {
            log.info("Request to create flight: {}", flight.getFlightNumber());
            log.debug("Flight details - sourceAirport: {}, destinationAirport: {}, departureTime: {}",
                    flight.getSourceAirport(), flight.getDestinationAirport(), flight.getDepartureTime());
            log.debug("Seat classes count: {}", flight.getSeatClasses() != null ? flight.getSeatClasses().size() : 0);
            return ResponseEntity.status(HttpStatus.CREATED).body(flightService.createFlight(flight));
        } catch (Exception e) {
            log.error("Error creating flight: {}", e.getMessage(), e);
            throw e;
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFlight(@PathVariable Long id) {
        log.info("Request to delete flight: {}", id);
        flightService.deleteFlight(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/seats/occupy")
    public ResponseEntity<Flight> occupySeats(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        @SuppressWarnings("unchecked")
        List<String> seatNumbers = (List<String>) request.get("seatNumbers");
        log.info("Request to mark seats as BOOKED on flight {}: {}", id, seatNumbers);
        return ResponseEntity.ok(flightService.markSeatsOccupied(id, seatNumbers));
    }

    @PostMapping("/{id}/seats/validate")
    public ResponseEntity<Void> validateSeatsAvailable(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        @SuppressWarnings("unchecked")
        List<String> seatNumbers = (List<String>) request.get("seatNumbers");
        log.info("Request to validate seats available on flight {}: {}", id, seatNumbers);
        flightService.validateSeatsAvailable(id, seatNumbers);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/seats/hold")
    public ResponseEntity<Flight> holdSeats(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        @SuppressWarnings("unchecked")
        List<String> seatNumbers = (List<String>) request.get("seatNumbers");
        log.info("Request to place HOLD on seats for flight {}: {}", id, seatNumbers);
        return ResponseEntity.ok(flightService.holdSeats(id, seatNumbers));
    }

    @PostMapping("/{id}/seats/release-hold")
    public ResponseEntity<Flight> releaseHoldOnSeats(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        @SuppressWarnings("unchecked")
        List<String> seatNumbers = (List<String>) request.get("seatNumbers");
        log.info("Request to release HOLD on seats for flight {}: {}", id, seatNumbers);
        return ResponseEntity.ok(flightService.releaseHoldOnSeats(id, seatNumbers));
    }

    @PostMapping("/{id}/seats/release-booked")
    public ResponseEntity<Flight> releaseBookedSeats(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        @SuppressWarnings("unchecked")
        List<String> seatNumbers = (List<String>) request.get("seatNumbers");
        log.info("Request to release BOOKED seats for flight {}: {}", id, seatNumbers);
        return ResponseEntity.ok(flightService.releaseBookedSeats(id, seatNumbers));
    }
}