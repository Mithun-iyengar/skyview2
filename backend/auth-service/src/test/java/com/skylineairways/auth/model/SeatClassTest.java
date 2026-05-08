package com.skylineairways.auth.model;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.math.BigDecimal;

import org.junit.jupiter.api.Test;

class SeatClassTest {

    @Test
    void generateSeatsCreatesExpectedSeatNumbersAndTypes() {
        SeatClass seatClass = new SeatClass("ECONOMY", "Economy", null, 2, 4, BigDecimal.valueOf(1000));

        seatClass.generateSeats("E");

        assertEquals(8, seatClass.getSeats().size());
        assertEquals("E1A", seatClass.getSeats().get(0).getSeatNumber());
        assertEquals("WINDOW", seatClass.getSeats().get(0).getSeatType());
        assertEquals("AISLE", seatClass.getSeats().get(1).getSeatType());
        assertEquals("WINDOW", seatClass.getSeats().get(3).getSeatType());
    }

    @Test
    void generateSeatsClearsExistingSeatsBeforeRegenerating() {
        SeatClass seatClass = new SeatClass();
        seatClass.setRows(1);
        seatClass.setColumnsPerRow(2);
        seatClass.generateSeats("B");
        seatClass.generateSeats("B");

        assertEquals(2, seatClass.getSeats().size());
    }
}