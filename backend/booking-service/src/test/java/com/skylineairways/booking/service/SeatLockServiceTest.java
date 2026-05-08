package com.skylineairways.booking.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.skylineairways.booking.exception.FlightOverbookedException;
import com.skylineairways.booking.exception.SeatLockExpiredException;
import com.skylineairways.booking.model.SeatLock;
import com.skylineairways.booking.repository.SeatLockRepository;

@ExtendWith(MockitoExtension.class)
class SeatLockServiceTest {

    @Mock private SeatLockRepository seatLockRepository;

    private SeatLockService seatLockService;

    @BeforeEach
    void setUp() {
        seatLockService = new SeatLockService(seatLockRepository);
    }

    @Test
    void lockSeatsStoresLocksWhenAvailable() {
        when(seatLockRepository.findLocksForSeats(1L, List.of("E1A"))).thenReturn(List.of());
        when(seatLockRepository.saveAll(org.mockito.ArgumentMatchers.anyList())).thenAnswer(invocation -> invocation.getArgument(0));

        List<SeatLock> locks = seatLockService.lockSeats(1L, List.of("E1A"), 9L);

        assertEquals(1, locks.size());
        verify(seatLockRepository).saveAll(org.mockito.ArgumentMatchers.anyList());
    }

    @Test
    void lockSeatsRejectsAlreadyLockedSeats() {
        when(seatLockRepository.findLocksForSeats(1L, List.of("E1A"))).thenReturn(List.of(new SeatLock()));

        assertThrows(FlightOverbookedException.class, () -> seatLockService.lockSeats(1L, List.of("E1A"), 9L));
    }

    @Test
    void validateLocksThrowsWhenExpired() {
        SeatLock lock = new SeatLock();
        lock.setFlightId(1L);
        lock.setSeatNumber("E1A");
        lock.setUserId(9L);
        lock.setLockedUntil(Instant.now().minusSeconds(60));
        when(seatLockRepository.findLocksForSeats(1L, List.of("E1A"))).thenReturn(List.of(lock));

        assertThrows(SeatLockExpiredException.class, () -> seatLockService.validateLocks(9L, 1L, List.of("E1A")));
    }
}
