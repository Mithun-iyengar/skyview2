package com.skylineairways.auth.controller;

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

import com.skylineairways.auth.model.SeatLock;
import com.skylineairways.auth.service.SeatLockService;

@ExtendWith(MockitoExtension.class)
class SeatControllerTest {

    @Mock private SeatLockService seatLockService;
    private SeatController seatController;

    @BeforeEach
    void setUp() {
        seatController = new SeatController(seatLockService);
    }

    @Test
    void lockSeatsDelegatesToService() {
        when(seatLockService.lockSeats(1L, List.of("E1A"), 2L)).thenReturn(List.of(new SeatLock(1L, "E1A", 2L, Instant.now().plusSeconds(60))));

        ResponseEntity<List<SeatLock>> response = seatController.lockSeats(Map.of("flightId", 1, "seatNumbers", List.of("E1A"), "userId", 2));

        assertEquals(HttpStatus.OK, response.getStatusCode());
    }
}