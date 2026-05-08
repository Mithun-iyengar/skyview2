package com.skylineairways.flight.model;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.math.BigDecimal;

import org.junit.jupiter.api.Test;

class SeatClassTest {

    @Test
    void generateSeatsPopulatesSeatList() {
        SeatClass seatClass = new SeatClass("ECONOMY", "Economy", null, 2, 3, BigDecimal.valueOf(1000));

        seatClass.generateSeats("E");

        assertEquals(6, seatClass.getSeats().size());
        assertEquals("E1A", seatClass.getSeats().get(0).getSeatNumber());
        assertEquals("WINDOW", seatClass.getSeats().get(0).getSeatType());
    }
}
