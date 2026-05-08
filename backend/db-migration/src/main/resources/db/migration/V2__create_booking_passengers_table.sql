-- Booking passenger table to enforce per-booking uniqueness for passenger identifiers

CREATE TABLE IF NOT EXISTS booking_passengers (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  booking_id BIGINT NOT NULL,
  passenger_name VARCHAR(255) NOT NULL,
  passenger_age INT NOT NULL,
  email VARCHAR(255) DEFAULT NULL,
  phone VARCHAR(255) DEFAULT NULL,
  aadhaar_number VARCHAR(12) DEFAULT NULL,
  passport_number VARCHAR(255) DEFAULT NULL,
  meal_preference VARCHAR(255) NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT fk_booking_passengers_booking
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  CONSTRAINT uk_booking_passengers_booking_email UNIQUE (booking_id, email),
  CONSTRAINT uk_booking_passengers_booking_phone UNIQUE (booking_id, phone),
  CONSTRAINT uk_booking_passengers_booking_aadhaar UNIQUE (booking_id, aadhaar_number),
  CONSTRAINT uk_booking_passengers_booking_passport UNIQUE (booking_id, passport_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;