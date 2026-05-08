package com.skylineairways.booking.service;

import com.skylineairways.booking.exception.FlightOverbookedException;
import com.skylineairways.booking.exception.SeatLockExpiredException;
import com.skylineairways.booking.model.SeatLock;
import com.skylineairways.booking.repository.SeatLockRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.time.Instant;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Slf4j
public class SeatLockService {

    private final SeatLockRepository seatLockRepository;

    @Transactional
    public List<SeatLock> lockSeats(Long flightId, List<String> seatNumbers, Long userId) {
        Objects.requireNonNull(flightId, "flightId must not be null");
        Objects.requireNonNull(seatNumbers, "seatNumbers must not be null");
        Objects.requireNonNull(userId, "userId must not be null");
        log.info("Locking seats for user {} on flight {}: {}", userId, flightId, seatNumbers);

        Instant lockExpiry = Instant.now().plusSeconds(300); // 5 minutes

        List<SeatLock> existingLocks = seatLockRepository.findLocksForSeats(flightId, seatNumbers);
        if (!existingLocks.isEmpty()) {
            log.warn("Seats already locked: {}", existingLocks);
            throw new FlightOverbookedException("Some seats are already locked");
        }

        List<SeatLock> locks = new ArrayList<>(seatNumbers.size());
        for (String seatNumber : seatNumbers) {
            SeatLock lock = new SeatLock();
            lock.setFlightId(flightId);
            lock.setSeatNumber(seatNumber);
            lock.setUserId(userId);
            lock.setLockedUntil(lockExpiry);
            lock.setCreatedAt(Instant.now());
            locks.add(lock);
        }

        List<SeatLock> savedLocks = seatLockRepository.saveAll(locks);
        log.info("Seats locked successfully for user {}", userId);
        return savedLocks;
    }

    @Transactional
    public void releaseSeats(Long userId, Long flightId, List<String> seatNumbers) {
        log.info("Releasing seats for user {} on flight {}: {}", userId, flightId, seatNumbers);
        List<SeatLock> locks = seatLockRepository.findByUserIdAndFlightId(userId, flightId);
        locks.stream()
                .filter(lock -> seatNumbers.contains(lock.getSeatNumber()))
                .forEach(seatLockRepository::delete);
    }

    @Transactional
    public boolean validateLocks(Long userId, Long flightId, List<String> seatNumbers) {
        List<SeatLock> locks = seatLockRepository.findLocksForSeats(flightId, seatNumbers);
        boolean valid = locks.stream().allMatch(lock ->
            lock.getUserId().equals(userId) && lock.getLockedUntil().isAfter(Instant.now()));
        if (!valid) {
            log.warn("Seat locks expired or invalid for user {}", userId);
            throw new SeatLockExpiredException("Seats are not locked or expired");
        }
        return true;
    }

    @Transactional
    public void releaseExpiredLocks() {
        int deleted = seatLockRepository.deleteExpiredLocks(Instant.now());
        if (deleted > 0) {
            log.info("Released {} expired seat locks", deleted);
        }
    }

    @Scheduled(fixedRate = 60000) // Every minute
    @Transactional
    public void cleanupExpiredLocks() {
        releaseExpiredLocks();
    }
}