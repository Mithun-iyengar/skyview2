import json
import urllib.request
import urllib.error
import time
import random
import base64

base = 'http://localhost:8080'

def req(method, path, data=None, headers=None):
    headers = headers or {}
    url = base + path
    if data is not None:
        payload = json.dumps(data).encode('utf-8')
        headers['Content-Type'] = 'application/json'
    else:
        payload = None
    req = urllib.request.Request(url, data=payload, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return resp.status, resp.read().decode('utf-8')
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8')
        print(f'HTTPError {e.code} {e.reason} for {method} {path}: {body}')
        return e.code, body
    except Exception as e:
        print('Request error', method, path, e)
        raise

suffix = int(time.time())
user = {
    'fullName': 'Test User',
    'email': f'testuser{suffix}@example.com',
    'phone': f'555000{suffix % 10000:04d}',
    'password': 'TestPass123'
}
print('Registering user', user['email'])
status, body = req('POST', '/api/auth/register', user)
print('REGISTER', status, body)
login = {'identifier': user['email'], 'password': user['password']}
status, body = req('POST', '/api/auth/login', login)
print('LOGIN', status, body)
if status != 200:
    raise SystemExit('Login failed')
auth = json.loads(body)
token = auth.get('token')
if not token:
    raise SystemExit('No token in login response')
headers = {'Authorization': f'Bearer {token}'}
print('Token length', len(token))
status, body = req('GET', '/api/v1/flights', headers=headers)
print('FLIGHTS', status)
flights = json.loads(body) if status == 200 else []
print('Flights count', len(flights))
if not flights:
    print('No flights found, creating sample flight')
    flight_data = {
        'flightNumber': 'SKY' + str(random.randint(100, 999)),
        'aircraftType': 'Boeing 737',
        'sourceAirport': 'BLR',
        'destinationAirport': 'DEL',
        'baseFare': 1200.00,
        'taxes': 300.00,
        'businessMultiplier': 1.4,
        'departureTime': '2026-05-08T10:00:00Z',
        'arrivalTime': '2026-05-08T12:30:00Z',
        'seatClasses': [
            {'classType': 'ECONOMY', 'className': 'Economy', 'rows': 2, 'columnsPerRow': 3},
            {'classType': 'BUSINESS', 'className': 'Business', 'rows': 1, 'columnsPerRow': 2}
        ]
    }
    status, body = req('POST', '/api/v1/flights', flight_data)
    print('CREATE FLIGHT', status, body)
    if status not in (200, 201):
        raise SystemExit('Flight creation failed')
    flights = [json.loads(body)]
flight = flights[0]
print('Flight ID', flight.get('id'), 'number', flight.get('flightNumber'))
status, body = req('GET', f"/api/v1/flights/{flight['id']}", headers=headers)
print('GET FLIGHT', status)
flight_details = json.loads(body) if status == 200 else None
seat_numbers = []
if flight_details and flight_details.get('seatClasses'):
    for sc in flight_details['seatClasses']:
        for seat in sc.get('seats', []):
            if seat.get('seatStatus') == 'AVAILABLE':
                seat_numbers.append(seat['seatNumber'])
        if seat_numbers:
            break
print('First available seats', seat_numbers[:5])
if not seat_numbers:
    raise SystemExit('No available seats')
seat = seat_numbers[0]
booking_payload = {
    'flightId': flight['id'],
    'userId': 1,
    'seatNumbers': [seat],
    'passengerName': 'Test User',
    'passengerEmail': user['email'],
    'passengerPhone': user['phone'],
    'passengerAge': 30,
    'aadhaarNumber': '123412341234',
    'passportNumber': 'X1234567',
    'mealPreference': 'VEG',
    'wheelchairAssistance': False,
    'totalAmount': 1500.00,
    'paymentMethod': 'CARD'
}
parts = token.split('.')
if len(parts) == 3:
    pad = '=' * (-len(parts[1]) % 4)
    claims = json.loads(base64.urlsafe_b64decode(parts[1] + pad).decode())
    booking_payload['userId'] = int(claims.get('userId', 1))
    print('Decoded userId from token', booking_payload['userId'])
else:
    print('Could not decode token claims')
status, body = req('POST', '/api/v1/bookings', booking_payload, headers=headers)
print('BOOKING', status, body)
if status not in (200, 201):
    raise SystemExit('Booking failed')
booking = json.loads(body)
print('Booking created ID', booking.get('id'), 'status', booking.get('status'))
status, body = req('GET', f"/api/v1/bookings/{booking['id']}", headers=headers)
print('GET BOOKING', status, body)
status, body = req('GET', f"/api/v1/bookings/user/{booking_payload['userId']}", headers=headers)
print('GET USER BOOKINGS', status, body)
