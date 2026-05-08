/**
 * API Service Configuration
 * Handles routing to different microservices through the API Gateway
 */

const API_GATEWAY_URL = import.meta.env.VITE_API_GATEWAY_URL || '/api'
const AUTH_SERVICE_WALLET_URL = import.meta.env.VITE_AUTH_SERVICE_WALLET_URL || 'http://localhost:8086/api'
const REQUEST_TIMEOUT_MS = 10000
const BOOKING_REQUEST_TIMEOUT_MS = 30000

function normalizeIdentifier(value) {
  return String(value ?? '').trim().toLowerCase()
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
  const primaryFields = [
    ['EMAIL', bookingData.passengerEmail],
    ['PHONE', bookingData.passengerPhone],
    ['AADHAAR', bookingData.aadhaarNumber],
    ['PASSPORT', bookingData.passportNumber]
  ]

  for (const [type, value] of primaryFields) {
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

function getAuthToken() {
  return localStorage.getItem('skyline_user_token') || sessionStorage.getItem('skyline_user_token')
}

function clearAuthState() {
  localStorage.removeItem('skyline_user_token')
  localStorage.removeItem('skyline_user_name')
  localStorage.removeItem('skyline_user_id')
  sessionStorage.removeItem('skyline_user_token')
  sessionStorage.removeItem('skyline_user_name')
  sessionStorage.removeItem('skyline_user_id')
  window.dispatchEvent(new Event('authChange'))
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController()
  const timeoutMs = Number(options.timeoutMs ?? REQUEST_TIMEOUT_MS)
  const timeoutId = window.setTimeout(() => controller.abort(new DOMException('Request timed out', 'TimeoutError')), timeoutMs)
  const { timeoutMs: _timeoutMs, signal: externalSignal, ...fetchOptions } = options

  try {
    return await fetch(url, {
      ...fetchOptions,
      signal: externalSignal || controller.signal,
    })
  } finally {
    window.clearTimeout(timeoutId)
  }
}

/**
 * Make an API request with error handling
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_GATEWAY_URL}${endpoint}`
  const authToken = getAuthToken()
  const { timeoutMs, ...requestOptions } = options
  
  try {
    const response = await fetchWithTimeout(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...requestOptions.headers
      },
      ...requestOptions,
      timeoutMs
    })

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '')
      let errorData = {}
      try {
        errorData = errorBody ? JSON.parse(errorBody) : {}
      } catch {
        errorData = { message: errorBody }
      }
      if (response.status === 401 && !options.disableAuthClearOn401) {
        clearAuthState()
      }
      const errorMessage = errorData.message || `API Error: ${response.status}`
      const error = new Error(errorMessage)
      error.status = response.status
      throw error
    }

    return await response.json()
  } catch (error) {
    if (!options.silent) {
      console.error(`API Request failed: ${endpoint}`, error)
    }
    throw error
  }
}

async function walletRequest(endpoint, options = {}) {
  try {
    return await apiRequest(endpoint, { ...options, silent: true })
  } catch (error) {
    if (/401|Unauthorized/i.test(String(error?.message || ''))) {
      throw error
    }

    // Wallet endpoints must be accessed via the configured API gateway or dev proxy.
    // Direct auth-service requests from the browser are blocked by CORS in development.
    throw error
  }
}

/**
 * Seat Management APIs
 */
export const seatApi = {
  lockSeats: async () => {
    console.warn('Seat lock is disabled in the current booking flow.')
    return { success: true }
  },

  releaseSeats: async () => {
    console.warn('Seat release is disabled in the current booking flow.')
    return { success: true }
  }
}

/**
 * Booking Management APIs
 */
export const bookingApi = {
  createBooking: async (bookingData) => {
    validatePassengerIdentifiers(bookingData || {})

    return apiRequest('/v1/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData)
    })
  },

  getBooking: async (bookingId) => {
    return apiRequest(`/v1/bookings/${bookingId}`, {
      method: 'GET'
    })
  },

  getUserBookings: async (userId) => {
    return apiRequest(`/v1/bookings/user/${userId}`, {
      method: 'GET'
    })
  }
}

/**
 * Flight Data APIs
 */
export const flightApi = {
  getFlights: async () => {
    return apiRequest('/v1/flights', {
      method: 'GET'
    })
  },

  getFlight: async (flightId) => {
    return apiRequest(`/v1/flights/${flightId}`, {
      method: 'GET'
    })
  },

  createFlight: async (flightData) => {
    return apiRequest('/v1/flights', {
      method: 'POST',
      body: JSON.stringify(flightData)
    })
  },

  deleteFlight: async (flightId) => {
    return apiRequest(`/v1/flights/${flightId}`, {
      method: 'DELETE'
    })
  }
}

/**
 * Wallet APIs
 */
export const walletApi = {
  getBalance: async () => {
    return walletRequest('/wallet', {
      method: 'GET'
    })
  },

  addMoney: async (amount) => {
    return walletRequest('/wallet/add', {
      method: 'POST',
      body: JSON.stringify({
        amount: parseFloat(amount)
      })
    })
  },

  deductMoney: async (amount) => {
    return walletRequest('/wallet/deduct', {
      method: 'POST',
      body: JSON.stringify({
        amount: parseFloat(amount)
      })
    })
  }
}

export default {
  seatApi,
  bookingApi,
  flightApi,
  walletApi
}
