package com.skylineairways.booking.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

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

import com.skylineairways.booking.model.SeatLock;
import com.skylineairways.booking.service.SeatLockService;

@ExtendWith(MockitoExtension.class)
class SeatControllerTest {

    @Mock private SeatLockService seatLockService;
    private SeatController seatController;

    @BeforeEach
    void setUp() {
        seatController = new SeatController(seatLockService);
    }

    @Test
    void lockSeatsReturnsSavedLocks() {
        when(seatLockService.lockSeats(1L, List.of("E1A"), 2L)).thenReturn(List.of(new SeatLock()));

        ResponseEntity<List<SeatLock>> response = seatController.lockSeats(Map.of("flightId", 1, "seatNumbers", List.of("E1A"), "userId", 2));

        assertEquals(HttpStatus.OK, response.getStatusCode());
    }

    @Test
    void releaseSeatsReturnsOk() {
        ResponseEntity<Void> response = seatController.releaseSeats(Map.of("flightId", 1, "seatNumbers", List.of("E1A"), "userId", 2));

        assertEquals(HttpStatus.OK, response.getStatusCode());
    }
}
