package com.skylineairways.auth.repository;

import com.skylineairways.auth.model.Flight;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface FlightRepository extends JpaRepository<Flight, Long> {

    List<Flight> findAllByOrderByDepartureTimeAsc();

    @Modifying
    @Query("delete from Flight f where f.departureTime is not null and f.departureTime <= :cutoff")
    int deleteFlightsAtOrBefore(@Param("cutoff") Instant cutoff);
}
