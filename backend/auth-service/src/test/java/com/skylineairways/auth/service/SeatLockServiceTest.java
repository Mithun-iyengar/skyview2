package com.skylineairways.auth.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.skylineairways.auth.exception.BadRequestException;
import com.skylineairways.auth.model.SeatLock;
import com.skylineairways.auth.repository.SeatLockRepository;

@ExtendWith(MockitoExtension.class)
class SeatLockServiceTest {

    @Mock private SeatLockRepository seatLockRepository;

    private SeatLockService seatLockService;

    @BeforeEach
    void setUp() {
        seatLockService = new SeatLockService(seatLockRepository);
    }

    @Test
    void lockSeatsSavesLocksWhenNoneExist() {
        when(seatLockRepository.findLocksForSeats(1L, List.of("E1A", "E1B"))).thenReturn(List.of());
        when(seatLockRepository.saveAll(org.mockito.ArgumentMatchers.anyList())).thenAnswer(invocation -> invocation.getArgument(0));

        List<SeatLock> locks = seatLockService.lockSeats(1L, List.of("E1A", "E1B"), 9L);

        assertEquals(2, locks.size());
        assertEquals(1L, locks.get(0).getFlightId());
        assertEquals(9L, locks.get(0).getUserId());
        verify(seatLockRepository).saveAll(org.mockito.ArgumentMatchers.anyList());
    }

    @Test
    void lockSeatsRejectsExistingLock() {
        when(seatLockRepository.findLocksForSeats(1L, List.of("E1A"))).thenReturn(List.of(new SeatLock(1L, "E1A", 2L, Instant.now().plusSeconds(60))));

        assertThrows(BadRequestException.class, () -> seatLockService.lockSeats(1L, List.of("E1A"), 9L));
    }

    @Test
    void validateLocksReturnsTrueForValidLocks() {
        when(seatLockRepository.findLocksForSeats(1L, List.of("E1A"))).thenReturn(List.of(new SeatLock(1L, "E1A", 9L, Instant.now().plusSeconds(60))));

        boolean valid = seatLockService.validateLocks(9L, 1L, List.of("E1A"));

        assertEquals(true, valid);
    }

    @Test
    void releaseSeatsDeletesMatchingEntries() {
        SeatLock lock1 = new SeatLock(1L, "E1A", 9L, Instant.now().plusSeconds(60));
        lock1.setId(1L);
        SeatLock lock2 = new SeatLock(1L, "E1B", 9L, Instant.now().plusSeconds(60));
        when(seatLockRepository.findByUserIdAndFlightId(9L, 1L)).thenReturn(List.of(lock1, lock2));
        doNothing().when(seatLockRepository).delete(org.mockito.ArgumentMatchers.any());

        seatLockService.releaseSeats(9L, 1L, List.of("E1A"));

        verify(seatLockRepository).delete(lock1);
    }

    @Test
    void cleanupExpiredLocksInvokesDeleteExpiredLocks() {
        seatLockService.cleanupExpiredLocks();
        verify(seatLockRepository).deleteExpiredLocks(org.mockito.ArgumentMatchers.any());
    }
}