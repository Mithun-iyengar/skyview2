package com.skylineairways.booking.controller;

import com.skylineairways.booking.model.SeatLock;
import com.skylineairways.booking.service.SeatLockService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/seats")
@RequiredArgsConstructor
@Slf4j
public class SeatController {

    private final SeatLockService seatLockService;

    @PostMapping("/lock")
    public ResponseEntity<List<SeatLock>> lockSeats(@RequestBody Map<String, Object> request) {
        log.info("Request to lock seats: {}", request);
        if (request == null || request.get("flightId") == null || request.get("seatNumbers") == null || request.get("userId") == null) {
            throw new IllegalArgumentException("flightId, seatNumbers, and userId are required");
        }

        Long flightId = Long.valueOf(request.get("flightId").toString());
        @SuppressWarnings("unchecked")
        List<?> seatNumbersRaw = (List<?>) request.get("seatNumbers");
        if (seatNumbersRaw == null || seatNumbersRaw.isEmpty()) {
            throw new IllegalArgumentException("seatNumbers must contain at least one seat");
        }
        List<String> seatNumbers = seatNumbersRaw.stream()
            .filter(Objects::nonNull)
            .map(Object::toString)
            .collect(Collectors.toList());
        if (seatNumbers.isEmpty()) {
            throw new IllegalArgumentException("seatNumbers must contain at least one seat");
        }

        Long userId = Long.valueOf(request.get("userId").toString());

        List<SeatLock> locks = seatLockService.lockSeats(flightId, seatNumbers, userId);
        return ResponseEntity.ok(locks);
    }

    @PostMapping("/release")
    public ResponseEntity<Void> releaseSeats(@RequestBody Map<String, Object> request) {
        log.info("Request to release seats: {}", request);
        Long userId = Long.valueOf(request.get("userId").toString());
        Long flightId = Long.valueOf(request.get("flightId").toString());
        @SuppressWarnings("unchecked")
        List<String> seatNumbers = (List<String>) request.get("seatNumbers");

        seatLockService.releaseSeats(userId, flightId, seatNumbers);
        return ResponseEntity.ok().build();
    }
}