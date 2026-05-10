// Booking API utility for backend integration
const API_BASE_URL = import.meta.env.VITE_API_GATEWAY_BASE_URL || '/api/v1'

/**
 * Generates a meaningful booking reference in the format: SKY-YYMMDD-XXXXX
 * Example: SKY-260506-A1B2C or SKY-260506-12345
 */
export function generateBookingReference() {
  const now = new Date()
  const year = String(now.getFullYear()).slice(-2)
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const date = String(now.getDate()).padStart(2, '0')
  
  // Generate a random 5-character suffix using mix of numbers and letters
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let suffix = ''
  for (let i = 0; i < 5; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  return `SKY-${year}${month}${date}-${suffix}`
}

function normalizeIdentifier(value) {
  return String(value ?? '').trim().toLowerCase()
}

function normalizeBookingId(bookingId) {
  const raw = String(bookingId ?? '').trim()
  if (!raw) {
    return null
  }

  return /^\d+$/.test(raw) ? raw : null
}

function addIdentifier(seen, type, value) {
  const normalized = normalizeIdentifier(value)
  if (!normalized) {
    return false
  }

  const key = `${type}:${normalized}`
  if (seen.has(key)) {
    return true
  }

  seen.add(key)
  return false
}

function validatePassengerIdentifiers(bookingData) {
  const seen = new Set()

  const fields = [
    ['EMAIL', bookingData.passengerEmail],
    ['PHONE', bookingData.passengerPhone],
    ['AADHAAR', bookingData.aadhaarNumber],
    ['PASSPORT', bookingData.passportNumber]
  ]

  for (const [type, value] of fields) {
    if (addIdentifier(seen, type, value)) {
      throw new Error('Duplicate passenger details found in booking')
    }
  }

  const additionalPassengers = Array.isArray(bookingData.additionalPassengers) ? bookingData.additionalPassengers : []
  for (const passenger of additionalPassengers) {
    if (!passenger) {
      continue
    }

    const passengerFields = [
      ['EMAIL', passenger.email],
      ['PHONE', passenger.phone],
      ['AADHAAR', passenger.aadhaarNumber],
      ['PASSPORT', passenger.passportNumber]
    ]

    for (const [type, value] of passengerFields) {
      if (addIdentifier(seen, type, value)) {
        throw new Error('Duplicate passenger details found in booking')
      }
    }
  }
}

// Get auth token from localStorage or sessionStorage
function getAuthToken() {
  return localStorage.getItem('skyline_user_token') || sessionStorage.getItem('skyline_user_token')
}

function getStoredUserId() {
  const storedId = localStorage.getItem('skyline_user_id') || sessionStorage.getItem('skyline_user_id')
  if (storedId && /^\d+$/.test(storedId.trim())) {
    return Number(storedId.trim())
  }
  return null
}

// Get current user ID from stored value or JWT token
function getCurrentUserId() {
  const localUserId = getStoredUserId()
  if (localUserId !== null) {
    return localUserId
  }

  const token = getAuthToken()
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const rawId = payload.userId || payload.id || payload.sub
      if (rawId !== undefined && rawId !== null) {
        const normalizedId = String(rawId).trim()
        if (/^\d+$/.test(normalizedId)) {
          return Number(normalizedId)
        }
      }
    } catch (e) {
      console.error('Error decoding JWT:', e)
    }
  }

  return null
}

export const bookingApi = {
  // Seat lock API is disabled in the current booking flow.
  async lockSeats() {
    console.warn('Seat lock is disabled in the current booking flow.')
    return { success: true }
  },

  // Seat release API is disabled in the current booking flow.
  async releaseSeats() {
    console.warn('Seat release is disabled in the current booking flow.')
    return { success: true }
  },

  // Create booking with passenger details
  async createBooking(bookingData) {
    try {
      validatePassengerIdentifiers(bookingData || {})

      const response = await fetch(`${API_BASE_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(bookingData)
      })
      
      if (!response.ok) {
        const rawError = await response.text().catch(() => '')
        let parsedMessage = ''

        if (rawError) {
          try {
            const parsed = JSON.parse(rawError)
            parsedMessage = parsed?.message || parsed?.error || ''
          } catch {
            parsedMessage = rawError
          }
        }

        throw new Error(parsedMessage || `Failed to create booking: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error creating booking:', error)
      throw error
    }
  },

  // Get booking details
  async getBooking(bookingId) {
    try {
      const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch booking: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error fetching booking:', error)
      throw error
    }
  },

  // Get user's bookings
  async getUserBookings(userId) {
    const localBookings = getLocalBookings(userId)
    try {
      const response = await fetch(`${API_BASE_URL}/bookings/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      })
      
      if (!response.ok) {
        if (localBookings.length > 0) {
          return localBookings
        }
        throw new Error(`Failed to fetch bookings: ${response.status}`)
      }
      
      const data = await response.json()
      const normalized = Array.isArray(data) ? data : []

      // Prefer backend truth when available. Local fallback is only for backend failures.
      return normalized
    } catch (error) {
      console.error('Error fetching bookings:', error)
      if (localBookings.length > 0) {
        return localBookings
      }
      throw error
    }
  },

  // Cancel booking
  async cancelBooking(bookingId) {
    try {
      const normalizedBookingId = normalizeBookingId(bookingId)
      if (!normalizedBookingId) {
        throw new Error('This booking cannot be cancelled because it is not synced with the server yet. Please refresh and try again.')
      }

      const response = await fetch(`${API_BASE_URL}/bookings/${normalizedBookingId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Failed to cancel booking: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error cancelling booking:', error)
      throw error
    }
  }
}

function getLocalBookings(userId) {
  if (userId === null || userId === undefined) {
    return []
  }
  const key = `skyline_user_bookings_${userId}`
  const stored = localStorage.getItem(key)
  if (!stored) {
    return []
  }
  try {
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function addLocalBooking(userId, booking) {
  if (userId === null || userId === undefined) {
    return
  }
  const key = `skyline_user_bookings_${userId}`
  const existing = getLocalBookings(userId)
  const updated = [booking, ...existing]
  localStorage.setItem(key, JSON.stringify(updated))
}

function mergeBookings(remoteBookings, localBookings) {
  const merged = []
  const seen = new Set()

  const append = (booking) => {
    if (!booking) {
      return
    }

    const key = getBookingKey(booking)
    if (key && seen.has(key)) {
      return
    }

    if (key) {
      seen.add(key)
    }
    merged.push(booking)
  }

  remoteBookings.forEach(append)
  localBookings.forEach(append)

  merged.sort((left, right) => {
    const leftTime = new Date(left?.createdAt || 0).getTime()
    const rightTime = new Date(right?.createdAt || 0).getTime()
    return rightTime - leftTime
  })

  return merged
}

function getBookingKey(booking) {
  if (!booking || booking.id === null || booking.id === undefined || booking.id === '') {
    return null
  }

  return String(booking.id)
}

// Mark as exported if used elsewhere
export { getCurrentUserId, addLocalBooking }