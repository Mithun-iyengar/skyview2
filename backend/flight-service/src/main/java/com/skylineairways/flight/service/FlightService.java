package com.skylineairways.flight.service;

import com.skylineairways.flight.exception.BadRequestException;
import com.skylineairways.flight.model.Flight;
import com.skylineairways.flight.model.Seat;
import com.skylineairways.flight.repository.FlightRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class FlightService {

    private final FlightRepository flightRepository;
    private static final BigDecimal DEFAULT_BUSINESS_MULTIPLIER = new BigDecimal("1.5");

    private BigDecimal normaliseMoney(BigDecimal amount) {
        return amount == null ? BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP) : amount.setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal normaliseMultiplier(BigDecimal multiplier) {
        if (multiplier == null || multiplier.compareTo(BigDecimal.ONE) < 0) {
            return DEFAULT_BUSINESS_MULTIPLIER;
        }
        return multiplier.setScale(2, RoundingMode.HALF_UP);
    }

    private void applyPricingAndSeats(Flight flight) {
        BigDecimal baseFare = normaliseMoney(flight.getBaseFare());
        BigDecimal taxes = normaliseMoney(flight.getTaxes());
        BigDecimal businessMultiplier = normaliseMultiplier(flight.getBusinessMultiplier());

        BigDecimal economyPrice = baseFare.add(taxes).setScale(2, RoundingMode.HALF_UP);
        BigDecimal businessPrice = baseFare.multiply(businessMultiplier).add(taxes).setScale(2, RoundingMode.HALF_UP);

        flight.setBaseFare(baseFare);
        flight.setTaxes(taxes);
        flight.setBusinessMultiplier(businessMultiplier);
        flight.setEconomyPrice(economyPrice);
        flight.setBusinessPrice(businessPrice);

        int totalCapacity = 0;

        if (flight.getSeatClasses() != null && !flight.getSeatClasses().isEmpty()) {
            flight.getSeatClasses().sort(Comparator.comparingInt(seatClass ->
                "BUSINESS".equalsIgnoreCase(seatClass.getClassType()) ? 0 : 1
            ));

            for (var seatClass : flight.getSeatClasses()) {
                seatClass.setFlight(flight); // SET FLIGHT REFERENCE FOR FOREIGN KEY
                int rows = Objects.requireNonNullElse(seatClass.getRows(), 0);
                int columns = Objects.requireNonNullElse(seatClass.getColumnsPerRow(), 0);
                int seatsForClass = Math.max(rows, 0) * Math.max(columns, 0);

                seatClass.setTotalSeats(seatsForClass);
                seatClass.setPricePerSeat("BUSINESS".equalsIgnoreCase(seatClass.getClassType()) ? businessPrice : economyPrice);

                if (rows > 0 && columns > 0) {
                    seatClass.generateSeats("BUSINESS".equalsIgnoreCase(seatClass.getClassType()) ? "B" : "E");
                }

                totalCapacity += seatsForClass;
            }
        }

        flight.setTotalSeats(totalCapacity);
    }

    @Transactional(readOnly = true)
    public List<Flight> listFlights() {
        log.debug("Listing all flights");
        return flightRepository.findAllByOrderByDepartureTimeAsc();
    }

    @Transactional(readOnly = true)
    public Flight getFlightById(Long id) {
        Objects.requireNonNull(id, "id must not be null");
        log.debug("Getting flight by id: {}", id);
        return flightRepository.findById(id)
                .orElseThrow(() -> new BadRequestException("Flight not found"));
    }

    @Transactional
    public Flight createFlight(Flight flight) {
        log.info("Creating new flight: {}", flight.getFlightNumber());
        try {
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

            log.debug("About to apply pricing and generate seats");
            applyPricingAndSeats(flight);

            flight.setId(null);
            flight.setCreatedAt(Instant.now());
            log.debug("About to save flight to repository");
            Flight saved = flightRepository.save(flight);
            log.info("Flight created successfully: {}", saved.getId());
            return saved;
        } catch (BadRequestException e) {
            log.warn("Bad request while creating flight: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error while creating flight: {}", e.getMessage(), e);
            throw e;
        }
    }

    @Transactional
    public void deleteFlight(Long id) {
        log.info("Deleting flight: {}", id);
        if (id == null) {
            return;
        }
        flightRepository.deleteById(id);
    }

    /**
     * Validate that all seats are available (not HOLD or BOOKED).
     * Throws exception if any seat is unavailable.
     */
    @Transactional(readOnly = true)
    public void validateSeatsAvailable(Long flightId, List<String> seatNumbers) throws BadRequestException {
        log.debug("Validating seats available on flight {}: {}", flightId, seatNumbers);
        Flight flight = getFlightById(flightId);
        for (String seatNumber : new HashSet<>(seatNumbers)) {
            Seat seat = findSeat(flight, seatNumber);
            if (seat == null) {
                throw new BadRequestException("Seat " + seatNumber + " not found on flight " + flightId);
            }
            if (!Seat.STATUS_AVAILABLE.equals(seat.getSeatStatus())) {
                log.warn("Seat {} is not available. Status: {}", seat.getSeatNumber(), seat.getSeatStatus());
                throw new BadRequestException(
                    "Seat " + seat.getSeatNumber() + " is not available. Status: " + seat.getSeatStatus()
                );
            }
        }
    }

    /**
     * Place temporary HOLD on seats (used when locking for payment).
     * Transitions seats from AVAILABLE to HOLD status.
     */
    @Transactional
    public Flight holdSeats(Long flightId, List<String> seatNumbers) {
        log.info("Holding seats on flight {}: {}", flightId, seatNumbers);
        Flight flight = getFlightById(flightId);
        Set<String> seatsToHold = new HashSet<>(seatNumbers);

        for (String seatNumber : seatsToHold) {
            Seat seat = findSeat(flight, seatNumber);
            if (seat == null) {
                throw new BadRequestException("Seat " + seatNumber + " not found on flight " + flightId);
            }
            if (!Seat.STATUS_AVAILABLE.equals(seat.getSeatStatus())) {
                throw new BadRequestException("Seat " + seatNumber + " is not available. Status: " + seat.getSeatStatus());
            }
        }

        if (flight.getSeatClasses() != null) {
            flight.getSeatClasses().forEach(seatClass -> {
                if (seatClass.getSeats() != null) {
                    seatClass.getSeats().forEach(seat -> {
                        if (seatsToHold.contains(seat.getSeatNumber())) {
                            seat.setSeatStatus(Seat.STATUS_HOLD);
                            log.debug("Seat {} status changed to HOLD", seat.getSeatNumber());
                        }
                    });
                }
            });
        }

        return flightRepository.save(flight);
    }

    /**
     * Release HOLD on seats - reverts them back to AVAILABLE.
     * Used when payment fails or booking is cancelled.
     */
    @Transactional
    public Flight releaseHoldOnSeats(Long flightId, List<String> seatNumbers) {
        log.info("Releasing hold on seats for flight {}: {}", flightId, seatNumbers);
        Flight flight = getFlightById(flightId);
        Set<String> seatsToRelease = new HashSet<>(seatNumbers);

        if (flight.getSeatClasses() != null) {
            flight.getSeatClasses().forEach(seatClass -> {
                if (seatClass.getSeats() != null) {
                    seatClass.getSeats().forEach(seat -> {
                        if (seatsToRelease.contains(seat.getSeatNumber())) {
                            if ("HOLD".equals(seat.getSeatStatus())) {
                                seat.setSeatStatus("AVAILABLE");
                                log.debug("Seat {} hold released, status reverted to AVAILABLE", seat.getSeatNumber());
                            }
                        }
                    });
                }
            });
        }

        return flightRepository.save(flight);
    }

    /**
     * Mark seats as BOOKED (permanently confirmed after successful payment).
     * Transitions seats from HOLD or AVAILABLE to BOOKED status.
     */
    @Transactional
    public Flight markSeatsOccupied(Long flightId, List<String> seatNumbers) {
        log.info("Marking seats as BOOKED on flight {}: {}", flightId, seatNumbers);
        Flight flight = getFlightById(flightId);
        Set<String> seatsToBook = new HashSet<>(seatNumbers);

        for (String seatNumber : seatsToBook) {
            Seat seat = findSeat(flight, seatNumber);
            if (seat == null) {
                throw new BadRequestException("Seat " + seatNumber + " not found on flight " + flightId);
            }
            if (!Seat.STATUS_HOLD.equals(seat.getSeatStatus())) {
                throw new BadRequestException(
                    "Seat " + seatNumber + " cannot be booked from status " + seat.getSeatStatus()
                );
            }
        }

        if (flight.getSeatClasses() != null) {
            flight.getSeatClasses().forEach(seatClass -> {
                if (seatClass.getSeats() != null) {
                    seatClass.getSeats().forEach(seat -> {
                        if (seatsToBook.contains(seat.getSeatNumber())) {
                            seat.setSeatStatus(Seat.STATUS_BOOKED);
                            log.debug("Seat {} marked as BOOKED", seat.getSeatNumber());
                        }
                    });
                }
            });
        }

        return flightRepository.save(flight);
    }

    @Transactional
    public int removeFlightsBeforeDepartureBy2Hours() {
        Instant cutoff = Instant.now().plus(2, ChronoUnit.HOURS);
        int deleted = flightRepository.deleteFlightsAtOrBefore(cutoff);
        log.info("Removed {} flights before departure by 2 hours", deleted);
        return deleted;
    }

    private Seat findSeat(Flight flight, String seatNumber) {
        if (flight == null || seatNumber == null || flight.getSeatClasses() == null) {
            return null;
        }

        for (var seatClass : flight.getSeatClasses()) {
            if (seatClass.getSeats() == null) {
                continue;
            }
            for (Seat seat : seatClass.getSeats()) {
                if (seatNumber.equals(seat.getSeatNumber())) {
                    return seat;
                }
            }
        }

        return null;
    }
}