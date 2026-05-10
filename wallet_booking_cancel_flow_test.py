import base64
import json
import random
import time
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone

BASE_URL = "http://localhost:8080"


def req(method, path, data=None, headers=None, timeout=20):
    headers = headers or {}
    url = BASE_URL + path
    payload = None
    if data is not None:
        payload = json.dumps(data).encode("utf-8")
        headers["Content-Type"] = "application/json"

    request_obj = urllib.request.Request(url, data=payload, headers=headers, method=method)
    try:
        with urllib.request.urlopen(request_obj, timeout=timeout) as response:
            body = response.read().decode("utf-8")
            return response.status, body
    except urllib.error.HTTPError as error:
        body = error.read().decode("utf-8")
        return error.code, body


def parse_json(text):
    try:
        return json.loads(text)
    except Exception:
        return None


def decode_user_id(token):
    parts = token.split(".")
    if len(parts) != 3:
        return None
    payload = parts[1] + "=" * (-len(parts[1]) % 4)
    claims = json.loads(base64.urlsafe_b64decode(payload).decode())
    raw = claims.get("userId") or claims.get("id") or claims.get("sub")
    if raw is None:
        return None
    raw_str = str(raw).strip()
    return int(raw_str) if raw_str.isdigit() else None


def first_available_seat(flight):
    seat_classes = flight.get("seatClasses") or []
    for seat_class in seat_classes:
        for seat in seat_class.get("seats") or []:
            if seat.get("seatStatus") == "AVAILABLE":
                return seat.get("seatNumber")
    return None


def seat_status(flight, seat_number):
    for seat_class in flight.get("seatClasses") or []:
        for seat in seat_class.get("seats") or []:
            if seat.get("seatNumber") == seat_number:
                return seat.get("seatStatus")
    return None


def main():
    suffix = int(time.time())
    user_email = f"wallet.flow.{suffix}@example.com"
    user_phone = f"9{suffix % 1000000000:09d}"[:10]

    print("=== 1) Register user ===")
    register_payload = {
        "fullName": f"Wallet Flow User {suffix}",
        "email": user_email,
        "phone": user_phone,
        "password": "TestPass123",
    }
    status, body = req("POST", "/api/auth/register", register_payload)
    print("register:", status, body)
    if status not in (200, 201):
        raise SystemExit("Registration failed")

    print("=== 2) Login user ===")
    status, body = req("POST", "/api/auth/login", {"identifier": user_email, "password": "TestPass123"})
    print("login:", status, body)
    if status != 200:
        raise SystemExit("Login failed")
    login_json = parse_json(body) or {}
    token = login_json.get("token")
    if not token:
        raise SystemExit("No token returned")
    user_id = decode_user_id(token)
    if not user_id:
        raise SystemExit("Unable to decode userId from token")
    headers = {"Authorization": f"Bearer {token}"}
    print("decoded userId:", user_id)

    print("=== 3) Add money to wallet ===")
    add_amount = 10000
    status, body = req("POST", "/api/v1/wallet/add", {"amount": add_amount}, headers=headers)
    print("wallet add:", status, body)
    if status != 200:
        raise SystemExit("Wallet add failed")

    print("=== 4) Read wallet before booking ===")
    status, body = req("GET", "/api/v1/wallet", headers=headers)
    print("wallet before booking:", status, body)
    if status != 200:
        raise SystemExit("Wallet fetch before booking failed")
    wallet_before = (parse_json(body) or {}).get("balance")
    if wallet_before is None:
        raise SystemExit("Wallet balance missing before booking")

    print("=== 5) Create future flight for refund test ===")
    departure = (datetime.now(timezone.utc) + timedelta(days=10)).replace(microsecond=0)
    arrival = departure + timedelta(hours=2, minutes=30)
    flight_number = f"SKY{random.randint(1000, 9999)}"
    flight_payload = {
        "flightNumber": flight_number,
        "aircraftType": "Boeing 737",
        "sourceAirport": "BLR",
        "destinationAirport": "DEL",
        "baseFare": 1200.0,
        "taxes": 300.0,
        "businessMultiplier": 1.4,
        "departureTime": departure.isoformat().replace("+00:00", "Z"),
        "arrivalTime": arrival.isoformat().replace("+00:00", "Z"),
        "seatClasses": [
            {"classType": "ECONOMY", "className": "Economy", "rows": 3, "columnsPerRow": 3},
            {"classType": "BUSINESS", "className": "Business", "rows": 1, "columnsPerRow": 2},
        ],
    }
    status, body = req("POST", "/api/v1/flights", flight_payload, headers=headers)
    print("flight create:", status, body)
    if status not in (200, 201):
        raise SystemExit("Flight creation failed")
    flight_created = parse_json(body) or {}
    flight_id = flight_created.get("id")
    if not flight_id:
        raise SystemExit("Flight id missing")

    print("=== 6) Get flight and choose available seat ===")
    status, body = req("GET", f"/api/v1/flights/{flight_id}", headers=headers)
    print("flight get:", status)
    if status != 200:
        raise SystemExit("Flight fetch failed")
    flight_live = parse_json(body) or {}
    chosen_seat = first_available_seat(flight_live)
    if not chosen_seat:
        raise SystemExit("No available seat found")
    print("chosen seat:", chosen_seat)

    print("=== 7) Create booking with WALLET payment ===")
    total_amount = 1500.0
    booking_payload = {
        "flightId": int(flight_id),
        "userId": int(user_id),
        "seatNumbers": [chosen_seat],
        "passengerName": "Wallet Flow User",
        "passengerEmail": user_email,
        "passengerPhone": user_phone,
        "passengerAge": 30,
        "aadhaarNumber": "123412341234",
        "passportNumber": "X1234567",
        "mealPreference": "VEG",
        "wheelchairAssistance": False,
        "totalAmount": total_amount,
        "paymentMethod": "WALLET",
    }
    status, body = req("POST", "/api/v1/bookings", booking_payload, headers=headers)
    print("booking create:", status, body)
    if status not in (200, 201):
        raise SystemExit("Booking create failed")
    booking_json = parse_json(body) or {}
    booking_id = booking_json.get("id")
    if not booking_id:
        raise SystemExit("Booking id missing")

    print("=== 8) Verify wallet deducted ===")
    status, body = req("GET", "/api/v1/wallet", headers=headers)
    print("wallet after booking:", status, body)
    if status != 200:
        raise SystemExit("Wallet fetch after booking failed")
    wallet_after_booking = (parse_json(body) or {}).get("balance")

    print("=== 9) Verify seat became BOOKED ===")
    status, body = req("GET", f"/api/v1/flights/{flight_id}", headers=headers)
    if status != 200:
        raise SystemExit("Flight fetch after booking failed")
    seat_after_booking = seat_status(parse_json(body) or {}, chosen_seat)
    print("seat after booking:", seat_after_booking)

    print("=== 10) Cancel booking ===")
    status, body = req("POST", f"/api/v1/bookings/{booking_id}/cancel", headers=headers)
    print("booking cancel:", status, body)
    if status != 200:
        raise SystemExit("Cancel failed")

    print("=== 11) Verify wallet refunded ===")
    status, body = req("GET", "/api/v1/wallet", headers=headers)
    print("wallet after cancel:", status, body)
    if status != 200:
        raise SystemExit("Wallet fetch after cancel failed")
    wallet_after_cancel = (parse_json(body) or {}).get("balance")

    print("=== 12) Verify seat became AVAILABLE again ===")
    status, body = req("GET", f"/api/v1/flights/{flight_id}", headers=headers)
    if status != 200:
        raise SystemExit("Flight fetch after cancel failed")
    seat_after_cancel = seat_status(parse_json(body) or {}, chosen_seat)
    print("seat after cancel:", seat_after_cancel)

    print("=== SUMMARY ===")
    print(f"wallet before booking: {wallet_before}")
    print(f"wallet after booking:  {wallet_after_booking}")
    print(f"wallet after cancel:   {wallet_after_cancel}")
    print(f"seat after booking:    {seat_after_booking}")
    print(f"seat after cancel:     {seat_after_cancel}")

    if wallet_after_booking is None or wallet_after_cancel is None:
        raise SystemExit("Wallet values missing in summary")

    if wallet_after_booking >= wallet_before:
        raise SystemExit("Wallet was not deducted after booking")

    if wallet_after_cancel <= wallet_after_booking:
        raise SystemExit("Wallet was not refunded after cancellation")

    if seat_after_booking not in ("BOOKED", "OCCUPIED"):
        raise SystemExit("Seat was not marked booked after booking")

    if seat_after_cancel != "AVAILABLE":
        raise SystemExit("Seat was not unblocked after cancellation")

    print("PASS: End-to-end wallet booking + cancel flow works")


if __name__ == "__main__":
    main()
