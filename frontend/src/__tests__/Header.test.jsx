import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Header from '../components/Header'
import { vi } from 'vitest'

vi.mock('../utils/apiService', () => ({
  walletApi: {
    getBalance: vi.fn().mockResolvedValue({ balance: 1000 })
  }
}))

describe('Header user menu', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetAllMocks()
  })

  it('opens My Bookings in a new tab when clicked', async () => {
    // set user token and name so the user menu renders
    localStorage.setItem('skyline_user_token', 'dummy.token.value')
    localStorage.setItem('skyline_user_name', 'John Doe')

    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)

    render(<Header />)

    // hover over user-menu
    const userMenu = screen.getByText(/John Doe/i).closest('.user-menu')
    // If structure changed, fallback to finding by role
    if (userMenu) {
      fireEvent.mouseEnter(userMenu)
    } else {
      const userInfo = screen.getByText(/John Doe/i)
      fireEvent.mouseEnter(userInfo)
    }

    // wait for My Bookings button to appear
    await waitFor(() => screen.getByText(/My Bookings/i))

    const myBookingsBtn = screen.getByText(/My Bookings/i)
    fireEvent.click(myBookingsBtn)

    expect(openSpy).toHaveBeenCalledWith('/account/reservations', '_blank')

    openSpy.mockRestore()
  })
})
