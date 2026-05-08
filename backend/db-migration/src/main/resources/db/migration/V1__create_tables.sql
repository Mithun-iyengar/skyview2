-- V1 migration: create the shared schema for Skyline Airways

CREATE TABLE IF NOT EXISTS users (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(255) DEFAULT NULL,
  email VARCHAR(255) DEFAULT NULL,
  phone VARCHAR(50) DEFAULT NULL,
  password VARCHAR(255) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_users_email (email),
  UNIQUE KEY uk_users_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS admins (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(255) DEFAULT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_admins_username (username),
  UNIQUE KEY uk_admins_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS flights (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  flight_number VARCHAR(255) NOT NULL,
  aircraft_type VARCHAR(255) DEFAULT NULL,
  source_airport VARCHAR(255) NOT NULL,
  destination_airport VARCHAR(255) NOT NULL,
  mid_landing_airport VARCHAR(255) DEFAULT NULL,
  total_seats INT DEFAULT NULL,
  base_fare DECIMAL(19,2) NOT NULL,
  taxes DECIMAL(19,2) DEFAULT NULL,
  business_multiplier DECIMAL(19,2) DEFAULT NULL,
  economy_price DECIMAL(19,2) DEFAULT NULL,
  business_price DECIMAL(19,2) DEFAULT NULL,
  departure_time DATETIME NOT NULL,
  arrival_time DATETIME DEFAULT NULL,
  flight_image LONGTEXT,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_flights_number_departure (flight_number, departure_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS flight_seat_classes (
  flight_id BIGINT NOT NULL,
  class_order INT NOT NULL,
  class_type VARCHAR(255) DEFAULT NULL,
  class_name VARCHAR(255) DEFAULT NULL,
  total_seats INT DEFAULT NULL,
  rows INT DEFAULT NULL,
  columns_per_row INT DEFAULT NULL,
  price_per_seat DECIMAL(19,2) DEFAULT NULL,
  PRIMARY KEY (flight_id, class_order),
  CONSTRAINT fk_flight_seat_classes_flight
    FOREIGN KEY (flight_id) REFERENCES flights(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS flight_seat_classes_seats (
  flight_id BIGINT NOT NULL,
  class_order INT NOT NULL,
  seat_order INT NOT NULL,
  seat_number VARCHAR(255) DEFAULT NULL,
  seat_status VARCHAR(255) DEFAULT NULL,
  seat_row INT DEFAULT NULL,
  seat_column VARCHAR(255) DEFAULT NULL,
  seat_type VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (flight_id, class_order, seat_order),
  CONSTRAINT fk_flight_seat_class_seats_class
    FOREIGN KEY (flight_id, class_order) REFERENCES flight_seat_classes(flight_id, class_order) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS bookings (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  flight_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  passenger_name VARCHAR(255) NOT NULL,
  passenger_email VARCHAR(255) NOT NULL,
  passenger_phone VARCHAR(255) NOT NULL,
  passenger_age INT DEFAULT NULL,
  aadhaar_number VARCHAR(255) DEFAULT NULL,
  meal_preference VARCHAR(255) DEFAULT NULL,
  wheelchair_assistance BOOLEAN DEFAULT NULL,
  total_amount DECIMAL(19,2) NOT NULL,
  status VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_bookings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_bookings_flight FOREIGN KEY (flight_id) REFERENCES flights(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS booking_seat_numbers (
  booking_id BIGINT NOT NULL,
  seat_numbers VARCHAR(255) DEFAULT NULL,
  seat_numbers_order INT NOT NULL,
  PRIMARY KEY (booking_id, seat_numbers_order),
  CONSTRAINT fk_booking_seat_numbers_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS seat_locks (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  flight_id BIGINT NOT NULL,
  seat_number VARCHAR(255) NOT NULL,
  user_id BIGINT NOT NULL,
  locked_until DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_seat_locks_flight FOREIGN KEY (flight_id) REFERENCES flights(id) ON DELETE CASCADE,
  CONSTRAINT fk_seat_locks_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS payments (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  booking_id BIGINT NOT NULL,
  amount DECIMAL(19,2) NOT NULL,
  method VARCHAR(255) DEFAULT NULL,
  status VARCHAR(255) DEFAULT NULL,
  transaction_id VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_payments_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT DEFAULT NULL,
  message TEXT,
  sent_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_flight_id ON bookings(flight_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
