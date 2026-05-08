import React, { useEffect, useMemo, useState, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import FlightListingCard from '../components/flights/FlightListingCard'
import PopularDestinationTile from '../components/flights/PopularDestinationTile'
import { fetchFlights, getCachedFlights } from '../utils/flightData'

const POPULAR_DESTINATIONS = [
  {
    city: 'Goa',
    image: '/images/destinations/goa.jpg',
  },
  {
    city: 'Mumbai',
    image: '/images/destinations/mumbai.jpg',
  },
  {
    city: 'Delhi',
    image: '/images/destinations/delhi.jpg',
  },
  {
    city: 'Dubai',
    image: '/images/destinations/dubai.jpg',
  },
  {
    city: 'Singapore',
    image: '/images/destinations/singapore.jpg',
  },
]

const AIRPORT_DIRECTORY = {
  BOM: 'Mumbai',
  DEL: 'Delhi',
  BLR: 'Bengaluru',
  HYD: 'Hyderabad',
  CCU: 'Kolkata',
  MAA: 'Chennai',
  DXB: 'Dubai',
  LHR: 'London',
  JFK: 'New York',
  CDG: 'Paris',
  SIN: 'Singapore',
  HND: 'Tokyo',
  AUS: 'Austin',
  LAX: 'Los Angeles',
  ORD: 'Chicago',
  GOI: 'Goa',
}

const AIRPORT_OPTIONS = [
  { value: '', label: 'All Airports' },
  { value: 'BOM', label: 'Mumbai (BOM)' },
  { value: 'DEL', label: 'Delhi (DEL)' },
  { value: 'BLR', label: 'Bengaluru (BLR)' },
  { value: 'HYD', label: 'Hyderabad (HYD)' },
  { value: 'CCU', label: 'Kolkata (CCU)' },
  { value: 'MAA', label: 'Chennai (MAA)' },
  { value: 'DXB', label: 'Dubai (DXB)' },
  { value: 'LHR', label: 'London (LHR)' },
  { value: 'JFK', label: 'New York (JFK)' },
  { value: 'CDG', label: 'Paris (CDG)' },
  { value: 'SIN', label: 'Singapore (SIN)' },
  { value: 'HND', label: 'Tokyo (HND)' },
  { value: 'AUS', label: 'Austin (AUS)' },
  { value: 'LAX', label: 'Los Angeles (LAX)' },
  { value: 'ORD', label: 'Chicago (ORD)' },
  { value: 'GOI', label: 'Goa (GOI)' },
]

const AIRPORT_SELECT_OPTIONS = AIRPORT_OPTIONS.filter((option) => option.value)

function getAirportLabel(value) {
  return AIRPORT_OPTIONS.find((option) => option.value === value)?.label || 'All Airports'
}

function normalize(value) {
  return String(value || '').trim().toLowerCase()
}

function airportDisplay(value) {
  const text = String(value || '').trim()
  if (!text) return ''
  return AIRPORT_DIRECTORY[text.toUpperCase()] || text
}

function TypeAheadDropdown({ label, value, onChange, options, placeholder }) {
  const [inputValue, setInputValue] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [filteredOptions, setFilteredOptions] = useState(options)
  const inputRef = useRef(null)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const currentLabel = options.find(opt => opt.value === value)?.label || ''
    setInputValue(currentLabel)
  }, [value, options])

  useEffect(() => {
    const filtered = options.filter(option =>
      option.label.toLowerCase().includes(inputValue.toLowerCase())
    )
    setFilteredOptions(filtered)
  }, [inputValue, options])

  const handleInputChange = (e) => {
    const val = e.target.value
    setInputValue(val)
    setIsOpen(true)
    if (val === '') {
      onChange('')
    }
  }

  const handleOptionSelect = (option) => {
    setInputValue(option.label)
    onChange(option.value)
    setIsOpen(false)
  }

  const handleInputFocus = () => {
    setIsOpen(true)
  }

  const handleInputBlur = () => {
    setTimeout(() => setIsOpen(false), 150)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  return (
    <div className="lux-typeahead-dropdown">
      <label className="lux-filter-label">{label}</label>
      <div className="lux-typeahead-input-wrap">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="lux-typeahead-input"
        />
        <i className="bi bi-chevron-down"></i>
        {isOpen && filteredOptions.length > 0 && (
          <div ref={dropdownRef} className="lux-typeahead-menu">
            {filteredOptions.map((option) => (
              <div
                key={option.value}
                className="lux-typeahead-option"
                onMouseDown={() => handleOptionSelect(option)}
              >
                {option.label}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function flightDestinationMatches(flight, query) {
  const target = normalize(query)
  if (!target) return true

  const destinationCode = normalize(flight.destinationAirport || flight.destination || '')
  const sourceCode = normalize(flight.sourceAirport || flight.source || '')
  const destinationCity = normalize(airportDisplay(flight.destinationAirport || flight.destination || ''))
  const sourceCity = normalize(airportDisplay(flight.sourceAirport || flight.source || ''))
  const name = normalize(flight.aircraftType || flight.flightName || flight.flightNumber || '')

  return (
    destinationCode.includes(target) ||
    destinationCity.includes(target) ||
    sourceCode.includes(target) ||
    sourceCity.includes(target) ||
    name.includes(target)
  )
}

function getTimeBucket(value) {
  if (!value) return 'unknown'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'unknown'
  const hour = date.getHours()
  if (hour >= 5 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 17) return 'afternoon'
  if (hour >= 17 && hour < 21) return 'evening'
  return 'night'
}

function getDateKey(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

export default function SearchFlights() {
  const [searchParams] = useSearchParams()

  const [allFlights, setAllFlights] = useState(() => getCachedFlights())
  const [loading, setLoading] = useState(() => getCachedFlights().length === 0)

  const [searchTerm, setSearchTerm] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [destinationFilter, setDestinationFilter] = useState('')
  const [travelDate, setTravelDate] = useState('')
  const [timeFilter, setTimeFilter] = useState('all')
  const [priceSort, setPriceSort] = useState('none')
  const [departureSort, setDepartureSort] = useState('none')
  const [priceCap, setPriceCap] = useState(200000)

  useEffect(() => {
    const destinationFromQuery = searchParams.get('destination') || ''
    if (destinationFromQuery) {
      setDestinationFilter(destinationFromQuery)
    }
  }, [searchParams])

  useEffect(() => {
    if (!searchTerm.trim()) return
    const timer = window.setTimeout(() => {
      const resultsHead = document.querySelector('.lux-results-head')
      if (resultsHead) {
        resultsHead.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 150)

    return () => window.clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    const refreshFlights = async () => {
      const hasCachedFlights = allFlights.length > 0
      if (!hasCachedFlights) {
        setLoading(true)
      }

      try {
        const flights = await fetchFlights()

        setAllFlights(flights)

        const maxPrice = flights.reduce((max, flight) => {
          const amount = Number(flight.baseFare || flight.price || 0)
          return amount > max ? amount : max
        }, 0)

        setPriceCap(200000)
      } catch {
        setAllFlights([])
        setPriceCap(200000)
      } finally {
        setLoading(false)
      }
    }

    refreshFlights()
    const handleFlightsUpdated = () => refreshFlights()
    window.addEventListener('flightsUpdated', handleFlightsUpdated)

    return () => {
      window.removeEventListener('flightsUpdated', handleFlightsUpdated)
    }
  }, [])

  const filteredFlights = useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLowerCase()
    const normalizedSourceFilter = normalize(sourceFilter)
    const normalizedDestinationFilter = normalize(destinationFilter)

    let flights = allFlights.filter((flight) => {
      const source = normalize(flight.sourceAirport || flight.source || '')
      const destination = normalize(flight.destinationAirport || flight.destination || '')
      const name = normalize(flight.aircraftType || flight.flightName || flight.flightNumber || '')
      const sourceCity = normalize(airportDisplay(flight.sourceAirport || flight.source || ''))
      const destinationCity = normalize(airportDisplay(flight.destinationAirport || flight.destination || ''))

      const matchesQuery =
        !normalizedQuery ||
        source.includes(normalizedQuery) ||
        destination.includes(normalizedQuery) ||
        flightDestinationMatches(flight, normalizedQuery) ||
        name.includes(normalizedQuery)

      const matchesSourceFilter =
        !normalizedSourceFilter ||
        source === normalizedSourceFilter ||
        sourceCity === normalizedSourceFilter ||
        source.includes(normalizedSourceFilter) ||
        sourceCity.includes(normalizedSourceFilter)

      const matchesDestinationFilter =
        !normalizedDestinationFilter ||
        destination === normalizedDestinationFilter ||
        destinationCity === normalizedDestinationFilter ||
        destination.includes(normalizedDestinationFilter) ||
        destinationCity.includes(normalizedDestinationFilter)

      const fare = Number(flight.baseFare || flight.price || 0)
      const matchesPrice = fare <= Number(priceCap)

      const matchesDate = !travelDate || getDateKey(flight.departureTime) === travelDate

      const matchesTime = timeFilter === 'all' || getTimeBucket(flight.departureTime) === timeFilter

      return matchesQuery && matchesSourceFilter && matchesDestinationFilter && matchesPrice && matchesDate && matchesTime
    })

    if (priceSort !== 'none') {
      flights = [...flights].sort((left, right) => {
        const a = Number(left.baseFare || left.price || 0)
        const b = Number(right.baseFare || right.price || 0)
        return priceSort === 'low-high' ? a - b : b - a
      })
    }

    if (departureSort !== 'none') {
      flights = [...flights].sort((left, right) => {
        const a = new Date(left.departureTime).getTime()
        const b = new Date(right.departureTime).getTime()
        if (Number.isNaN(a) || Number.isNaN(b)) return 0
        return departureSort === 'early-late' ? a - b : b - a
      })
    }

    return flights
  }, [allFlights, departureSort, destinationFilter, priceCap, priceSort, searchTerm, sourceFilter, timeFilter, travelDate])

  return (
    <section className="page search-page lux-flights-page container">
      <div className="lux-page-head">
        <h1>Luxury Flight Listings</h1>
        <p>Curated skyline routes with premium experiences</p>
      </div>

      <div className="lux-search-wrap glass-surface">
        <i className="bi bi-search"></i>
        <input
          type="text"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search by source, destination, or flight name"
          className="lux-search-input"
        />
      </div>

      <div className="lux-filters glass-surface">
        <TypeAheadDropdown
          label="Source"
          value={sourceFilter}
          onChange={setSourceFilter}
          options={AIRPORT_OPTIONS}
          placeholder="Type airport or city"
        />

        <TypeAheadDropdown
          label="Destination"
          value={destinationFilter}
          onChange={setDestinationFilter}
          options={AIRPORT_OPTIONS}
          placeholder="Type airport or city"
        />

        <div className="lux-filter-group">
          <label htmlFor="travelDate">Date</label>
          <input
            id="travelDate"
            type="date"
            value={travelDate}
            onChange={(event) => setTravelDate(event.target.value)}
          />
        </div>

        <div className="lux-filter-group">
          <label htmlFor="timeFilter">Time</label>
          <select
            id="timeFilter"
            value={timeFilter}
            onChange={(event) => setTimeFilter(event.target.value)}
          >
            <option value="all">All</option>
            <option value="morning">Morning</option>
            <option value="afternoon">Afternoon</option>
            <option value="evening">Evening</option>
            <option value="night">Night</option>
          </select>
        </div>

        <div className="lux-filter-group">
          <label htmlFor="priceSort">Sort by Price</label>
          <select
            id="priceSort"
            value={priceSort}
            onChange={(event) => setPriceSort(event.target.value)}
          >
            <option value="none">Default</option>
            <option value="low-high">Low → High</option>
            <option value="high-low">High → Low</option>
          </select>
        </div>

        <div className="lux-filter-group">
          <label htmlFor="departureSort">Sort by Departure</label>
          <select
            id="departureSort"
            value={departureSort}
            onChange={(event) => setDepartureSort(event.target.value)}
          >
            <option value="none">Default</option>
            <option value="early-late">Early → Late</option>
            <option value="late-early">Late → Early</option>
          </select>
        </div>

        <div className="lux-filter-group lux-price-group">
          <label htmlFor="priceCap">Price up to ₹{Number(priceCap).toLocaleString('en-IN')}</label>
          <input
            id="priceCap"
            type="range"
            min="0"
            max="200000"
            step="1000"
            value={priceCap}
            onChange={(event) => setPriceCap(Number(event.target.value))}
          />
        </div>
      </div>

      <div className="lux-results-head">
        <h2>Available Flights</h2>
        <span>{filteredFlights.length} result(s)</span>
      </div>

      {loading ? (
        <div className="lux-loading">Loading flights...</div>
      ) : filteredFlights.length === 0 ? (
        <div className="lux-empty glass-surface">
          No flights found for current filters. Try broadening your search.
        </div>
      ) : (
        <div className="lux-flights-grid">
          {filteredFlights.map((flight) => (
            <FlightListingCard key={flight.id || flight._id || flight.flightNumber} flight={flight} />
          ))}
        </div>
      )}

      <div className="lux-destination-section">
        <div className="lux-results-head">
          <h2>Popular Destinations</h2>
          <span>Jump directly by city</span>
        </div>
        <div className="lux-destination-grid">
          {POPULAR_DESTINATIONS.map((item) => (
            <PopularDestinationTile key={item.city} city={item.city} image={item.image} />
          ))}
        </div>
      </div>
    </section>
  )
}
