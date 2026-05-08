import { describe, it, expect, beforeEach, vi } from 'vitest'
import { bookingApi, getCurrentUserId, generateBookingReference } from '../utils/bookingApi'

function createStorageMock() {
  const store = {}
  return {
    getItem: vi.fn((key) => (Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null)),
    setItem: vi.fn((key, value) => {
      store[key] = String(value)
    }),
    removeItem: vi.fn((key) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach((key) => delete store[key])
    }),
  }
}

describe('bookingApi', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.stubGlobal('localStorage', createStorageMock())
    vi.stubGlobal('sessionStorage', createStorageMock())
  })

  it('reads the current user id from a stored JWT in sessionStorage', () => {
    const payload = { userId: 42 }
    const token = `header.${btoa(JSON.stringify(payload))}.signature`
    sessionStorage.setItem('skyline_user_token', token)

    expect(getCurrentUserId()).toBe(42)
  })

  it('calls the correct bookings endpoint with Authorization header', async () => {
    const response = { ok: true, json: async () => [] }
    const tokenPayload = { userId: 99 }
    const token = `header.${btoa(JSON.stringify(tokenPayload))}.signature`
    localStorage.setItem('skyline_user_token', token)

    global.fetch = vi.fn().mockResolvedValue(response)

    await bookingApi.getUserBookings(99)

    expect(global.fetch).toHaveBeenCalledWith('/api/v1/bookings/user/99', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
  })

  it('returns both backend and local bookings for the same user', async () => {
    const tokenPayload = { userId: 99 }
    const token = `header.${btoa(JSON.stringify(tokenPayload))}.signature`
    localStorage.setItem('skyline_user_token', token)

    localStorage.setItem('skyline_user_bookings_99', JSON.stringify([
      {
        id: 'local-1',
        flightId: 46,
        createdAt: new Date(Date.now() - 1000).toISOString(),
        status: 'CONFIRMED'
      }
    ]))

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ([
        {
          id: 123,
          flightId: 45,
          createdAt: new Date().toISOString(),
          status: 'CONFIRMED'
        }
      ])
    })

    const bookings = await bookingApi.getUserBookings(99)

    expect(bookings).toHaveLength(2)
    expect(bookings.map((booking) => booking.id)).toEqual(expect.arrayContaining([123, 'local-1']))
  })

  it('rejects duplicate passenger details before sending a booking request', async () => {
    const bookingData = {
      flightId: 45,
      userId: 99,
      passengerEmail: 'john@example.com',
      passengerPhone: '9999999999',
      aadhaarNumber: '123456789012',
      additionalPassengers: [
        {
          fullName: 'Jane Doe',
          email: 'john@example.com',
          phone: '8888888888',
          aadhaarNumber: '123456789013'
        }
      ]
    }

    global.fetch = vi.fn()

    await expect(bookingApi.createBooking(bookingData)).rejects.toThrow('Duplicate passenger details found in booking')
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('generates meaningful booking references in format SKY-YYMMDD-XXXXX', () => {
    const ref = generateBookingReference()
    
    // Should match pattern SKY-YYMMDD-XXXXX
    expect(ref).toMatch(/^SKY-\d{6}-[A-Z0-9]{5}$/)
    
    // Should start with SKY
    expect(ref.startsWith('SKY-')).toBe(true)
    
    // Should contain today's date (approximately)
    const today = new Date()
    const yy = String(today.getFullYear()).slice(-2)
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const dd = String(today.getDate()).padStart(2, '0')
    const dateString = `${yy}${mm}${dd}`
    
    expect(ref).toContain(dateString)
  })

  it('generates unique booking references', () => {
    const refs = new Set()
    for (let i = 0; i < 100; i++) {
      refs.add(generateBookingReference())
    }
    
    // Most generated references should be unique (allowing for rare collisions)
    expect(refs.size).toBeGreaterThan(95)
  })
})
