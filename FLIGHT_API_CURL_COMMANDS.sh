# Skyline Airways Flight API - cURL Commands

# Make sure these services are running:
# - Eureka (8761)
# - API Gateway (8080) 
# - Flight Service (8082)

# ============================================
# CREATE FLIGHT
# ============================================
curl -X POST http://localhost:8080/api/v1/flights \
  -H "Content-Type: application/json" \
  -d '{
    "flightNumber": "SG101",
    "aircraftType": "Boeing 777",
    "baseFare": 5000,
    "taxes": 500,
    "businessMultiplier": 1.8,
    "sourceAirport": "DEL",
    "destinationAirport": "BOM",
    "midLandingAirport": null,
    "departureTime": "2026-05-15T08:00:00Z",
    "arrivalTime": "2026-05-15T11:30:00Z",
    "flightImage": "",
    "seatClasses": [
      {
        "classType": "BUSINESS",
        "className": "Business",
        "rows": 4,
        "columnsPerRow": 2
      },
      {
        "classType": "ECONOMY",
        "className": "Economy",
        "rows": 10,
        "columnsPerRow": 6
      }
    ]
  }'

# Expected Response:
# {
#   "id": 1,
#   "flightNumber": "SG101",
#   "aircraftType": "Boeing 777",
#   "totalSeats": 68,
#   "baseFare": 5000.00,
#   "taxes": 500.00,
#   "businessMultiplier": 1.80,
#   "economyPrice": 5500.00,
#   "businessPrice": 9000.00,
#   "sourceAirport": "DEL",
#   "destinationAirport": "BOM",
#   "departureTime": "2026-05-15T08:00:00Z",
#   "arrivalTime": "2026-05-15T11:30:00Z",
#   "flightImage": "",
#   "seatClasses": [
#     {
#       "classType": "BUSINESS",
#       "className": "Business",
#       "rows": 4,
#       "columnsPerRow": 2,
#       "totalSeats": 8,
#       "pricePerSeat": 9000.00,
#       "seats": [...]
#     },
#     {
#       "classType": "ECONOMY",
#       "className": "Economy",
#       "rows": 10,
#       "columnsPerRow": 6,
#       "totalSeats": 60,
#       "pricePerSeat": 5500.00,
#       "seats": [...]
#     }
#   ],
#   "createdAt": "2026-05-04T00:00:00Z"
# }

# ============================================
# GET ALL FLIGHTS
# ============================================
curl -X GET http://localhost:8080/api/v1/flights \
  -H "Content-Type: application/json"

# ============================================
# GET FLIGHT BY ID
# ============================================
curl -X GET http://localhost:8080/api/v1/flights/1 \
  -H "Content-Type: application/json"

# ============================================
# DELETE FLIGHT
# ============================================
curl -X DELETE http://localhost:8080/api/v1/flights/1 \
  -H "Content-Type: application/json"

# ============================================
# OCCUPY SEATS ON A FLIGHT
# ============================================
curl -X POST http://localhost:8080/api/v1/flights/1/seats/occupy \
  -H "Content-Type: application/json" \
  -d '{
    "seatNumbers": ["B1A", "B1B", "E1A", "E1B", "E1C"]
  }'

# ============================================
# TEST DATA - Additional Flights
# ============================================

# Bangalore to Hyderabad Flight
curl -X POST http://localhost:8080/api/v1/flights \
  -H "Content-Type: application/json" \
  -d '{
    "flightNumber": "SG202",
    "aircraftType": "Airbus A320",
    "baseFare": 3000,
    "taxes": 300,
    "businessMultiplier": 1.6,
    "sourceAirport": "BLR",
    "destinationAirport": "HYD",
    "departureTime": "2026-05-16T10:00:00Z",
    "arrivalTime": "2026-05-16T11:45:00Z",
    "flightImage": "",
    "seatClasses": [
      {
        "classType": "BUSINESS",
        "className": "Business",
        "rows": 3,
        "columnsPerRow": 2
      },
      {
        "classType": "ECONOMY",
        "className": "Economy",
        "rows": 15,
        "columnsPerRow": 6
      }
    ]
  }'

# ============================================
# NOTES
# ============================================
# 1. Make sure API Gateway is running on port 8080
# 2. Flight Service must be registered with Eureka
# 3. Database (MySQL) must be running and SKYLINE_AIRWAYS_AUTH database must exist
# 4. Seat classes will be automatically generated based on rows x columns
# 5. Prices are auto-calculated: 
#    - economyPrice = baseFare + taxes
#    - businessPrice = (baseFare * businessMultiplier) + taxes
# 6. SeatClass entities are automatically linked to Flight (foreign key set)
# 7. Seats are generated with prefixes: B = Business, E = Economy
