package com.skylineairways.booking.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;
import java.util.Map;

@FeignClient(name = "flight-service")
public interface FlightServiceClient {

    /**
     * Validate that seats are available for booking.
     * Throws exception if any seat is HOLD, BOOKED, or BLOCKED.
     */
    @PostMapping("/flights/{flightId}/seats/validate")
    void validateSeatsAvailable(@PathVariable("flightId") Long flightId, @RequestBody Map<String, Object> request);

    /**
     * Place temporary HOLD on seats (transitions AVAILABLE → HOLD).
     */
    @PostMapping("/flights/{flightId}/seats/hold")
    void holdSeats(@PathVariable("flightId") Long flightId, @RequestBody Map<String, Object> request);

    /**
     * Release HOLD on seats (transitions HOLD → AVAILABLE).
     */
    @PostMapping("/flights/{flightId}/seats/release-hold")
    void releaseHoldOnSeats(@PathVariable("flightId") Long flightId, @RequestBody Map<String, Object> request);

    /**
     * Mark seats as BOOKED (transitions HOLD/AVAILABLE → BOOKED after payment success).
     */
    @PostMapping("/flights/{flightId}/seats/occupy")
    void markSeatsOccupied(@PathVariable("flightId") Long flightId, @RequestBody Map<String, Object> request);
}
