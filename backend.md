# Backend Documentation

## Overview
Skyline Airways backend is a Spring Boot microservices system built to support flight search, booking, wallet payment, authentication, notification, and service discovery.

The backend is structured as a multi-module Maven repository under `backend/` and includes:
- `service-registry`
- `api-gateway`
- `auth-service`
- `flight-service`
- `booking-service`
- `payment-service`
- `notification-service`
- `db-migration`

## Build and Run All Services
### Build all backend modules
From the repository root:
```powershell
cd backend
.\mvnw.cmd -Dmaven.test.skip=true clean package
```

If you do not use the Maven wrapper, run:
```powershell
cd backend
mvn -Dmaven.test.skip=true clean package
```

### Run the database migration module
```powershell
cd backend\db-migration
..\mvnw.cmd -Dmaven.test.skip=true spring-boot:run
```

### Start all services individually
From `backend/`:
```powershell
cd backend\service-registry
..\mvnw.cmd -Dmaven.test.skip=true spring-boot:run
```
In new terminals, run:
```powershell
cd backend\api-gateway
..\mvnw.cmd -Dmaven.test.skip=true spring-boot:run

cd backend\auth-service
..\mvnw.cmd -Dmaven.test.skip=true spring-boot:run

cd backend\flight-service
..\mvnw.cmd -Dmaven.test.skip=true spring-boot:run

cd backend\booking-service
..\mvnw.cmd -Dmaven.test.skip=true spring-boot:run

cd backend\payment-service
..\mvnw.cmd -Dmaven.test.skip=true spring-boot:run

cd backend\notification-service
..\mvnw.cmd -Dmaven.test.skip=true spring-boot:run
```

### Use the provided startup script
If the repository includes the root script, you can run:
```powershell
cd ..\
.\START_ALL_SERVICES.bat
```

## Architecture
### Service responsibilities
- `service-registry`
  - Eureka server for discovery
- `api-gateway`
  - routes client requests to backend services
  - applies token filters and path-based routing
- `auth-service`
  - user registration and login
  - JWT handling and wallet operations
  - admin authentication
- `flight-service`
  - flight listing, creation, lookup, and seat occupancy updates
- `booking-service`
  - booking creation, payment orchestration, and seat reservation
  - wallet-based booking and confirmation notifications
- `payment-service`
  - processes payment requests and persists payment status
- `notification-service`
  - sends notifications for booking confirmation and payment outcomes
- `db-migration`
  - runs Flyway migrations and seeds the default admin record

### Internal APIs
The backend services communicate via Feign clients and internal REST endpoints.

Important internal call:
- `booking-service` -> `auth-service` `POST /api/wallet/internal/deduct`
- internal wallet endpoints are permitted without JWT to allow service-to-service payment flow

## Gateway routing
Key gateway routes:
- `/api/auth/**` and `/api/v1/auth/**` -> `auth-service`
- `/api/wallet/**` and `/api/v1/wallet/**` -> `auth-service`
- `/api/v1/flights/**` -> `flight-service`
- `/api/v1/bookings/**` -> `booking-service`
- `/api/v1/payments/**` -> `payment-service`
- `/api/v1/notifications/**` -> `notification-service`

## Build Notes
- The backend uses Maven and the wrapper scripts inside the `backend` folder
- Most modules are Spring Boot applications with standalone `pom.xml`
- The root `backend/pom.xml` can be used to build the entire multi-module project in one command
- Use `-Dmaven.test.skip=true` for faster local experimentation when tests are not required

## Authentication and Security
- JWT-based authentication is enforced for user-facing wallet and protected endpoints
- Public auth endpoints include registration and login
- `auth-service` accepts internal calls to `/api/wallet/internal/**` from other services without JWT
- `api-gateway` strips prefix paths and forwards requests to the correct downstream service

## Key Entities and Business Flow
### Wallet Operations
- Wallets are created lazily for users
- Balance cannot go below zero
- `auth-service` supports:
  - `GET /api/v1/wallet`
  - `POST /api/v1/wallet/add`
  - `POST /api/v1/wallet/deduct`
  - `POST /api/wallet/internal/deduct`
  - `POST /api/wallet/internal/add`

### Booking Flow
- `booking-service` validates passenger details and duplicate identifiers
- For wallet bookings, it deducts wallet balance, marks seats occupied, and confirms booking
- For card bookings, it routes payment through `payment-service` and confirms on success
- Failed payments mark bookings as `PAYMENT_FAILED`

### Flight Flow
- `flight-service` manages flight creation and seat map generation
- Seats can be marked occupied or released by booking and seat hold APIs

### Notification Flow
- `notification-service` sends emails for booking confirmation and payment failure
- Notification failures do not block the main booking result
