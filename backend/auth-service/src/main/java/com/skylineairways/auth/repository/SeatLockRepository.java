package com.skylineairways.auth.repository;

import com.skylineairways.auth.model.SeatLock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface SeatLockRepository extends JpaRepository<SeatLock, Long> {

    List<SeatLock> findByFlightIdAndSeatNumber(Long flightId, String seatNumber);

    List<SeatLock> findByUserIdAndFlightId(Long userId, Long flightId);

    @Modifying
    @Query("DELETE FROM SeatLock sl WHERE sl.lockedUntil < :now")
    int deleteExpiredLocks(@Param("now") Instant now);

    @Query("SELECT sl FROM SeatLock sl WHERE sl.flightId = :flightId AND sl.seatNumber IN :seatNumbers")
    List<SeatLock> findLocksForSeats(@Param("flightId") Long flightId, @Param("seatNumbers") List<String> seatNumbers);
}