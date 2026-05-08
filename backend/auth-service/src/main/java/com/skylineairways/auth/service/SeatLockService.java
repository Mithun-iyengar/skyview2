package com.skylineairways.auth.service;

import com.skylineairways.auth.exception.BadRequestException;
import com.skylineairways.auth.model.SeatLock;
import com.skylineairways.auth.repository.SeatLockRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class SeatLockService {

    private final SeatLockRepository seatLockRepository;

    public SeatLockService(SeatLockRepository seatLockRepository) {
        this.seatLockRepository = seatLockRepository;
    }

    @Transactional
    public List<SeatLock> lockSeats(Long flightId, List<String> seatNumbers, Long userId) {
        Instant lockExpiry = Instant.now().plusSeconds(300); // 5 minutes

        List<SeatLock> existingLocks = seatLockRepository.findLocksForSeats(flightId, seatNumbers);
        if (!existingLocks.isEmpty()) {
            throw new BadRequestException("Some seats are already locked");
        }

        List<SeatLock> locks = seatNumbers.stream()
            .map(seatNumber -> new SeatLock(flightId, seatNumber, userId, lockExpiry))
            .toList();

        return seatLockRepository.saveAll(locks);
    }

    @Transactional
    public void releaseSeats(Long userId, Long flightId, List<String> seatNumbers) {
        List<SeatLock> locks = seatLockRepository.findByUserIdAndFlightId(userId, flightId);
        locks.stream()
                .filter(lock -> seatNumbers.contains(lock.getSeatNumber()))
                .forEach(seatLockRepository::delete);
    }

    @Transactional
    public boolean validateLocks(Long userId, Long flightId, List<String> seatNumbers) {
        List<SeatLock> locks = seatLockRepository.findLocksForSeats(flightId, seatNumbers);
        return locks.stream().allMatch(lock -> lock.getUserId().equals(userId) && lock.getLockedUntil().isAfter(Instant.now()));
    }

    public void releaseExpiredLocks() {
        seatLockRepository.deleteExpiredLocks(Instant.now());
    }

    @Scheduled(fixedRate = 60000) // Every minute
    @Transactional
    public void cleanupExpiredLocks() {
        seatLockRepository.deleteExpiredLocks(Instant.now());
    }
}