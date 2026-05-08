import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import Reservations from '../pages/Reservations'
import { vi } from 'vitest'

vi.mock('../utils/bookingApi', () => ({
  bookingApi: {
    getUserBookings: vi.fn()
  },
  getCurrentUserId: vi.fn()
}))

import { bookingApi, getCurrentUserId } from '../utils/bookingApi'

describe('Reservations page', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('renders bookings returned by API', async () => {
    const mockBookings = [
      {
        id: 123,
        flightId: 45,
        seatNumbers: ['1A', '1B'],
        totalAmount: 7999.5,
        passengerName: 'John Doe',
        passengerEmail: 'john@example.com',
        passengerPhone: '9999999999',
        additionalPassengers: [{ fullName: 'Jane Doe', age: 28, mealPreference: 'Veg' }],
        createdAt: new Date().toISOString(),
        status: 'CONFIRMED'
      },
      {
        id: 124,
        flightId: 46,
        seatNumbers: ['2A'],
        totalAmount: 4299,
        passengerName: 'Alice Smith',
        passengerEmail: 'alice@example.com',
        passengerPhone: '8888888888',
        additionalPassengers: [],
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        status: 'PENDING'
      }
    ]

    getCurrentUserId.mockReturnValue(1)
    bookingApi.getUserBookings.mockResolvedValue(mockBookings)

    render(<Reservations />)

    await waitFor(() => expect(bookingApi.getUserBookings).toHaveBeenCalled())

    expect(screen.getByText('#123')).toBeInTheDocument()
    expect(screen.getByText('#124')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Alice Smith')).toBeInTheDocument()
    // flight link should be present and open in new tab
    const flightLink = screen.getByText(/View Flight #45/i)
    expect(flightLink).toBeInTheDocument()
    expect(flightLink.closest('a')).toHaveAttribute('href', '/flight/45')
    expect(flightLink.closest('a')).toHaveAttribute('target', '_blank')
  })
})
