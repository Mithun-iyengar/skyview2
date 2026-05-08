const FLIGHTS_API_URLS = Array.from(new Set([
  '/api/v1/flights',
  ...(import.meta.env.VITE_FLIGHTS_API_URL ? [import.meta.env.VITE_FLIGHTS_API_URL] : [])
]))
const LOCAL_FLIGHTS_KEY = 'skyline_local_flights'
const MAX_INLINE_IMAGE_LENGTH_FOR_CACHE = 400000
const MAX_INLINE_IMAGE_LENGTH_FOR_REQUEST = 500000
const SEAT_COLUMNS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K']
const FLIGHT_REQUEST_TIMEOUT_MS = 10000

function toIsoDateTime(value) {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toISOString()
}

function isObject(value) {
  return value !== null && typeof value === 'object'
}

function parsePayload(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.flights)) return payload.flights
  return []
}

export function generateSeatLayout(classType, rows, columnsPerRow, occupiedSeatNumbers = [], maxSeats = null) {
  const prefix = classType === 'BUSINESS' ? 'B' : 'E'
  const occupiedSet = new Set((occupiedSeatNumbers || []).map(String))
  const seats = []

  for (let row = 1; row <= Number(rows || 0); row += 1) {
    for (let col = 0; col < Number(columnsPerRow || 0) && col < SEAT_COLUMNS.length; col += 1) {
      if (Number.isFinite(maxSeats) && seats.length >= maxSeats) {
        return seats
      }
      const seatNumber = `${prefix}${row}${SEAT_COLUMNS[col]}`
      seats.push({
        seatNumber,
        seatStatus: occupiedSet.has(seatNumber) ? 'OCCUPIED' : 'AVAILABLE',
        row,
        column: SEAT_COLUMNS[col],
        seatType:
          col === 0 || col === columnsPerRow - 1
            ? 'WINDOW'
            : columnsPerRow > 2 && (col === 1 || col === columnsPerRow - 2)
              ? 'AISLE'
              : 'MIDDLE',
      })
    }
  }

  return seats
}

function buildFallbackSeatClasses(totalSeats, baseFare, taxes, businessMultiplier) {
  const total = Math.max(Number(totalSeats || 0), 1)
  const businessCount = total > 1 ? Math.min(Math.max(Math.round(total * 0.25), 4), total - 1) : 0
  const economyCount = Math.max(total - businessCount, total === 1 ? 1 : 0)

  const businessColumns = businessCount <= 2 ? 1 : 2
  const economyColumns = 6
  const businessRows = Math.max(1, Math.ceil(Math.max(businessCount, 1) / businessColumns))
  const economyRows = Math.max(1, Math.ceil(Math.max(economyCount, 1) / economyColumns))
  const economyPrice = Math.round(Number(baseFare || 0) + Number(taxes || 0))
  const businessPrice = Math.round((Number(baseFare || 0) * Number(businessMultiplier || 1.5)) + Number(taxes || 0))

  const businessSeats = businessCount > 0
    ? generateSeatLayout('BUSINESS', businessRows, businessColumns, [], businessCount)
    : []
  const economySeats = economyCount > 0
    ? generateSeatLayout('ECONOMY', economyRows, economyColumns, [], economyCount)
    : []

  const classes = []
  if (businessSeats.length > 0) {
    classes.push({
      classType: 'BUSINESS',
      className: 'Business',
      rows: businessRows,
      columnsPerRow: businessColumns,
      totalSeats: businessSeats.length,
      pricePerSeat: businessPrice,
      seats: businessSeats,
    })
  }
  if (economySeats.length > 0) {
    classes.push({
      classType: 'ECONOMY',
      className: 'Economy',
      rows: economyRows,
      columnsPerRow: economyColumns,
      totalSeats: economySeats.length,
      pricePerSeat: economyPrice,
      seats: economySeats,
    })
  }

  return classes
}

async function requestFlightApi(path = '', options = {}) {
  let lastError = null

  for (const baseUrl of FLIGHTS_API_URLS) {
    try {
      const controller = new AbortController()
      const timeoutId = window.setTimeout(() => controller.abort(), FLIGHT_REQUEST_TIMEOUT_MS)
      let response
      try {
        response = await fetch(`${baseUrl}${path}`, {
          headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {})
          },
          signal: options.signal || controller.signal,
          ...options
        })
      } finally {
        window.clearTimeout(timeoutId)
      }

      if (response.ok) {
        return response
      }

      lastError = new Error(`HTTP ${response.status} from ${baseUrl}${path}`)
    } catch (error) {
      lastError = error
    }
  }

  throw lastError || new Error('Flight API unavailable')
}

function normalizeFlight(raw) {
  if (!isObject(raw)) return null

  const rawIdentifiers = [raw.id, raw._id, raw.flightId]
  const numericId = rawIdentifiers
    .filter((value) => value !== undefined && value !== null)
    .map((value) => String(value).trim())
    .find((value) => /^\d+$/.test(value))
  const id = numericId ? Number(numericId) : raw.flightNumber ?? `flight-${Date.now()}`
  const cleanFlightNumber = typeof raw.flightNumber === 'string' ? raw.flightNumber.trim() : raw.flightNumber
  const baseFare = Number(raw.baseFare ?? raw.price ?? raw.fare ?? 0)
  const taxes = Number(raw.taxes ?? 0)
  const businessMultiplier = Number(raw.businessMultiplier ?? 1.5)

  const derivedEconomySeatPrice = Math.round(Number(baseFare || 0) + Number(taxes || 0))
  const derivedBusinessSeatPrice = Math.round((Number(baseFare || 0) * Number(businessMultiplier || 1.5)) + Number(taxes || 0))

  let seatClasses = Array.isArray(raw.seatClasses)
    ? [...raw.seatClasses].map((seatClass) => {
        const rows = Number(seatClass?.rows || 0)
        const columnsPerRow = Number(seatClass?.columnsPerRow || 0)
        const seats = Array.isArray(seatClass?.seats) ? seatClass.seats : []
        const rawSeatPrice = Number(seatClass?.pricePerSeat ?? seatClass?.price ?? seatClass?.fare ?? 0)
        const fallbackSeatPrice = seatClass?.classType === 'BUSINESS' ? derivedBusinessSeatPrice : derivedEconomySeatPrice

        return {
          ...seatClass,
          rows,
          columnsPerRow,
          totalSeats: Number(seatClass?.totalSeats || rows * columnsPerRow || seats.length),
          // Accept several possible keys for price and fallback to derived class pricing
          pricePerSeat: rawSeatPrice > 0 ? rawSeatPrice : Number(fallbackSeatPrice || 0),
          seats,
        }
      }).sort((a, b) => {
        const order = { BUSINESS: 0, ECONOMY: 1 }
        return (order[a?.classType] ?? 2) - (order[b?.classType] ?? 2)
      })
    : []

  const fallbackSeatClasses = seatClasses.length === 0
    ? buildFallbackSeatClasses(raw.totalSeats, baseFare, taxes, businessMultiplier)
    : []
  if (fallbackSeatClasses.length > 0) {
    seatClasses = fallbackSeatClasses
  }

  const totalSeatsFromClasses = seatClasses.reduce((sum, seatClass) => sum + Number(seatClass.totalSeats || 0), 0)
  const totalSeats = Number(raw.totalSeats || totalSeatsFromClasses || 0)

  // If baseFare missing, try derive from seat classes (lowest price)
  let derivedBaseFare = Number.isFinite(baseFare) ? baseFare : 0
  if (!derivedBaseFare || derivedBaseFare === 0) {
    const prices = seatClasses.map((sc) => Number(sc.pricePerSeat || 0)).filter((p) => p > 0)
    if (prices.length > 0) {
      derivedBaseFare = Math.min(...prices)
    }
  }

  return {
    ...raw,
    id,
    flightNumber: cleanFlightNumber || raw.flightNo || 'Skyline',
    sourceAirport: raw.sourceAirport || raw.source || '',
    destinationAirport: raw.destinationAirport || raw.destination || '',
    departureTime: toIsoDateTime(raw.departureTime) || raw.departureTime,
    arrivalTime: toIsoDateTime(raw.arrivalTime) || raw.arrivalTime,
    baseFare: Number.isNaN(derivedBaseFare) ? 0 : derivedBaseFare,
    taxes: Number.isNaN(taxes) ? 0 : taxes,
    businessMultiplier: Number.isNaN(businessMultiplier) ? 1.5 : businessMultiplier,
    // accept alternate keys or derive from seatClasses
    economyPrice: Number(raw.economyPrice ?? raw.economyFare ?? 0) || Number(seatClasses.find(sc => sc.classType === 'ECONOMY')?.pricePerSeat ?? 0),
    businessPrice: Number(raw.businessPrice ?? raw.businessFare ?? 0) || Number(seatClasses.find(sc => sc.classType === 'BUSINESS')?.pricePerSeat ?? 0),
    totalSeats,
    flightImage: raw.flightImage || raw.image || '',
    seatClasses
  }
}

function sanitizeFlightImage(flightImage, maxLength) {
  if (typeof flightImage !== 'string') return ''
  const isInlineImage = flightImage.startsWith('data:image/')
  if (!isInlineImage) return flightImage
  if (flightImage.length <= maxLength) return flightImage
  return ''
}

function sanitizeFlightForCache(flight) {
  return {
    ...flight,
    flightImage: sanitizeFlightImage(flight.flightImage, MAX_INLINE_IMAGE_LENGTH_FOR_CACHE)
  }
}

function sanitizeFlightForRequest(flight) {
  return {
    ...flight,
    flightImage: sanitizeFlightImage(flight.flightImage, MAX_INLINE_IMAGE_LENGTH_FOR_REQUEST)
  }
}

function getLocalFlights() {
  try {
    const raw = localStorage.getItem(LOCAL_FLIGHTS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.map(normalizeFlight).filter(Boolean) : []
  } catch {
    return []
  }
}

export function getCachedFlights() {
  return getLocalFlights()
}

function setLocalFlights(flights) {
  const sanitizedFlights = flights.map(sanitizeFlightForCache)
  localStorage.setItem(LOCAL_FLIGHTS_KEY, JSON.stringify(sanitizedFlights))
}

function mergeFlights(serverFlights, localFlights) {
  const map = new Map()

  serverFlights.map(normalizeFlight).filter(Boolean).forEach((flight) => {
    map.set(flight.id, flight)
  })

  localFlights.map(normalizeFlight).filter(Boolean).forEach((flight) => {
    if (!map.has(flight.id)) {
      map.set(flight.id, flight)
    }
  })

  return Array.from(map.values())
}

export function shouldShowOnHome(flight) {
  const departure = new Date(flight?.departureTime)
  if (Number.isNaN(departure.getTime())) return true

  const now = new Date()
  const isSameDay =
    departure.getFullYear() === now.getFullYear() &&
    departure.getMonth() === now.getMonth() &&
    departure.getDate() === now.getDate()

  if (!isSameDay) return true
  const cutoff = new Date(departure.getTime() - 2 * 60 * 60 * 1000)
  return now < cutoff
}

export async function fetchFlights() {
  const localFlights = getLocalFlights()

  try {
    const response = await requestFlightApi('', { method: 'GET' })

    const payload = await response.json().catch(() => [])
    const serverFlights = parsePayload(payload)
    return mergeFlights(serverFlights, localFlights)
  } catch {
    return localFlights
  }
}

export async function fetchFlight(flightId) {
  const requestedId = String(flightId)
  const looksNumericId = /^\d+$/.test(requestedId)

  const findInLocal = () => {
    const localFlights = getLocalFlights()
    return localFlights.find((flight) => (
      String(flight.id) === requestedId ||
      String(flight.flightNumber || '').toUpperCase() === requestedId.toUpperCase()
    ))
  }

  const localFlight = findInLocal()

  try {
    if (looksNumericId) {
      const response = await requestFlightApi(`/${encodeURIComponent(requestedId)}`, { method: 'GET' })
      const payload = await response.json()
      const normalized = normalizeFlight(payload)
      if (normalized) return normalized
    }

    const flightsResponse = await requestFlightApi('', { method: 'GET' })
    const flightsPayload = await flightsResponse.json().catch(() => [])
    const serverFlights = parsePayload(flightsPayload).map(normalizeFlight).filter(Boolean)

    const matched = serverFlights.find((flight) => (
      String(flight.id) === requestedId ||
      String(flight.flightNumber || '').toUpperCase() === requestedId.toUpperCase()
    ))

    if (matched) return matched
  } catch (error) {
    if (localFlight) {
      return localFlight
    }

    throw new Error(`Failed to fetch flight: ${error.message}`)
  }

  if (localFlight) {
    return localFlight
  }

  throw new Error('Flight not found')
}

export async function createFlight(flightInput) {
  const payload = normalizeFlight(flightInput)

  if (!payload) {
    throw new Error('Invalid flight payload')
  }

  const upsertLocal = (flight) => {
    const localFlights = getLocalFlights()
    const existingIndex = localFlights.findIndex((item) => String(item.id) === String(flight.id))
    if (existingIndex >= 0) {
      localFlights[existingIndex] = flight
      setLocalFlights(localFlights)
      return
    }
    setLocalFlights([flight, ...localFlights])
  }

  const { id, ...requestPayloadRaw } = payload
  const requestPayload = sanitizeFlightForRequest(requestPayloadRaw)
  const response = await requestFlightApi('', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestPayload)
  })

  if (!response.ok) {
    throw new Error('Database save failed for flight create')
  }

  const createdPayload = await response.json().catch(() => null)
  const normalizedCreated = normalizeFlight(createdPayload)
  const createdFlight = normalizedCreated
    ? { ...payload, ...normalizedCreated, flightImage: normalizedCreated.flightImage || payload.flightImage }
    : payload
  upsertLocal(createdFlight)
  return createdFlight
}

export async function deleteFlight(flightId) {
  const id = String(flightId)

  try {
    await requestFlightApi(`/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    })
  } catch {
    // Intentionally ignore API failure; local sync still updates UI.
  }

  const localFlights = getLocalFlights()
  const updated = localFlights.filter((flight) => String(flight.id) !== id)
  setLocalFlights(updated)
}
