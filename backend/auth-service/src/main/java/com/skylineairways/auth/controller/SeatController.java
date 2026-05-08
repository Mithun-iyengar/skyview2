package com.skylineairways.auth.controller;

import com.skylineairways.auth.model.SeatLock;
import com.skylineairways.auth.service.SeatLockService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

// @RestController - DISABLED: This service is now handled by booking-service microservice
// @RequestMapping("/api/seat")
public class SeatController {

    private final SeatLockService seatLockService;

    public SeatController(SeatLockService seatLockService) {
        this.seatLockService = seatLockService;
    }

    @PostMapping("/lock")
    public ResponseEntity<List<SeatLock>> lockSeats(@RequestBody Map<String, Object> request) {
        Long flightId = Long.valueOf(request.get("flightId").toString());
        @SuppressWarnings("unchecked")
        List<String> seatNumbers = (List<String>) request.get("seatNumbers");
        Long userId = Long.valueOf(request.get("userId").toString());

        List<SeatLock> locks = seatLockService.lockSeats(flightId, seatNumbers, userId);
        return ResponseEntity.ok(locks);
    }

    @PostMapping("/release")
    public ResponseEntity<Void> releaseSeats(@RequestBody Map<String, Object> request) {
        Long userId = Long.valueOf(request.get("userId").toString());
        Long flightId = Long.valueOf(request.get("flightId").toString());
        @SuppressWarnings("unchecked")
        List<String> seatNumbers = (List<String>) request.get("seatNumbers");

        seatLockService.releaseSeats(userId, flightId, seatNumbers);
        return ResponseEntity.ok().build();
    }
}