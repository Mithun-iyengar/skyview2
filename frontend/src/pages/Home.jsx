import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import HeroSection from '../components/HeroSection'
import SearchFilters from '../components/SearchFilters'
import FlightCard from '../components/FlightCard'
import DestinationCard from '../components/DestinationCard'
import { fetchFlights, getCachedFlights, shouldShowOnHome } from '../utils/flightData'

export default function Home() {
  const location = useLocation()
  const [flights, setFlights] = useState(() => getCachedFlights().filter(shouldShowOnHome))
  const [loadingFlights, setLoadingFlights] = useState(() => getCachedFlights().length === 0)
  const [filters, setFilters] = useState({
    source: '',
    destination: '',
    date: '',
    priceMin: 2000,
    priceMax: 50000,
    timeOfDay: 'all',
    sortBy: 'price-low'
  })
  const [toast, setToast] = useState(null)
  const hasFetchedFlightsRef = useRef(false)

  const timeMatches = (departureTime, timeOfDay) => {
    if (!timeOfDay || timeOfDay === 'all') return true
    const date = new Date(departureTime)
    if (Number.isNaN(date.getTime())) return true
    const hour = date.getHours()

    if (timeOfDay === 'morning') return hour >= 6 && hour < 12
    if (timeOfDay === 'afternoon') return hour >= 12 && hour < 18
    if (timeOfDay === 'evening') return hour >= 18 && hour < 24
    if (timeOfDay === 'night') return hour >= 0 && hour < 6
    return true
  }

  const matchesDate = (departureTime, dateFilter) => {
    if (!dateFilter) return true
    const flightDate = new Date(departureTime)
    if (Number.isNaN(flightDate.getTime())) return true
    const selected = new Date(dateFilter)
    return flightDate.getFullYear() === selected.getFullYear()
      && flightDate.getMonth() === selected.getMonth()
      && flightDate.getDate() === selected.getDate()
  }

  const filteredFlights = useMemo(() => {
    const sourceFilter = filters.source.trim().toUpperCase()
    const destinationFilter = filters.destination.trim().toUpperCase()
    const priceMin = Number(filters.priceMin ?? 0)
    const priceMax = Number(filters.priceMax ?? Number.MAX_SAFE_INTEGER)

    const base = flights.filter((flight) => {
      const source = String(flight.sourceAirport || '').toUpperCase()
      const destination = String(flight.destinationAirport || '').toUpperCase()
      const price = Number(flight.baseFare || 0)

      return (!sourceFilter || source === sourceFilter)
        && (!destinationFilter || destination === destinationFilter)
        && (price >= priceMin && price <= priceMax)
        && matchesDate(flight.departureTime, filters.date)
        && timeMatches(flight.departureTime, filters.timeOfDay)
    })

    const sorted = [...base]
    if (filters.sortBy === 'price-high') {
      sorted.sort((a, b) => Number(b.baseFare || 0) - Number(a.baseFare || 0))
    } else if (filters.sortBy === 'duration') {
      sorted.sort((a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime())
    } else if (filters.sortBy === 'rating') {
      sorted.sort((a, b) => String(b.flightNumber || '').localeCompare(String(a.flightNumber || '')))
    } else {
      sorted.sort((a, b) => Number(a.baseFare || 0) - Number(b.baseFare || 0))
    }

    return sorted
  }, [flights, filters])

  const displayedFlights = useMemo(() => {
    return [...filteredFlights]
      .sort((a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime())
      .slice(0, 3)
  }, [filteredFlights])

  // Fetch flights from API
  useEffect(() => {
    if (hasFetchedFlightsRef.current) return
    hasFetchedFlightsRef.current = true

    const refreshFlights = async () => {
      try {
        if (flights.length === 0) {
          setLoadingFlights(true)
        }
        const flightsList = await fetchFlights()
        setFlights(flightsList.filter(shouldShowOnHome))
      } catch (error) {
        console.log('Backend not ready yet or flights not available:', error.message)
        if (flights.length === 0) {
          setFlights([]) // Show empty state
        }
      } finally {
        setLoadingFlights(false)
      }
    }

    refreshFlights()
    const handleFlightsUpdated = () => refreshFlights()
    window.addEventListener('flightsUpdated', handleFlightsUpdated)

    // Scroll to top on mount
    window.scrollTo(0, 0)

    return () => {
      window.removeEventListener('flightsUpdated', handleFlightsUpdated)
    }
  }, [])

  useEffect(() => {
    const welcomeName = location.state?.welcomeName || localStorage.getItem('skyline_user_name')
    if (!welcomeName) {
      return
    }

    setToast({ message: `Welcome, ${welcomeName}`, type: 'success' })
    window.history.replaceState({}, document.title)
  }, [location.state])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 4200)
    return () => window.clearTimeout(timer)
  }, [toast])

  // Sample Featured Flights Data - KEEP AS BACKUP (currently disabled)
  const sampleFlights = [
    {
      id: '1',
      flightNumber: 'SL101',
      aircraftType: 'Boeing 787 Dreamliner',
      sourceAirport: 'BOM',
      destinationAirport: 'DEL',
      departureTime: new Date(Date.now() + 86400000).setHours(8, 0, 0).toString(),
      arrivalTime: new Date(Date.now() + 86400000).setHours(10, 30, 0).toString(),
      baseFare: 4500,
      totalSeats: 350,
      duration: '2h 30m',
      flightImage: 'https://images.unsplash.com/photo-1606148291147-a3a89b5d27e6?w=600&h=400&fit=crop'
    },
    {
      id: '2',
      flightNumber: 'SL202',
      aircraftType: 'Airbus A380',
      sourceAirport: 'DEL',
      destinationAirport: 'GOI',
      departureTime: new Date(Date.now() + 86400000).setHours(14, 0, 0).toString(),
      arrivalTime: new Date(Date.now() + 86400000).setHours(16, 15, 0).toString(),
      baseFare: 3800,
      totalSeats: 555,
      duration: '2h 15m',
      flightImage: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&h=400&fit=crop'
    },
    {
      id: '3',
      flightNumber: 'SL303',
      aircraftType: 'Boeing 777',
      sourceAirport: 'BLR',
      destinationAirport: 'DXB',
      departureTime: new Date(Date.now() + 86400000).setHours(22, 30, 0).toString(),
      arrivalTime: new Date(Date.now() + 86400001).setHours(3, 45, 0).toString(),
      baseFare: 7200,
      totalSeats: 396,
      duration: '3h 15m',
      flightImage: 'https://images.unsplash.com/photo-1475274047050-1d0c0975c63e?w=600&h=400&fit=crop'
    },
    {
      id: '4',
      flightNumber: 'SL404',
      aircraftType: 'Airbus A350',
      sourceAirport: 'MAA',
      destinationAirport: 'SIN',
      departureTime: new Date(Date.now() + 172800000).setHours(10, 0, 0).toString(),
      arrivalTime: new Date(Date.now() + 172800000).setHours(14, 0, 0).toString(),
      baseFare: 8900,
      totalSeats: 410,
      duration: '4h',
      flightImage: 'https://images.unsplash.com/photo-1559031615-cd4628902d4a?w=600&h=400&fit=crop'
    },
    {
      id: '5',
      flightNumber: 'SL505',
      aircraftType: 'Boeing 737',
      sourceAirport: 'JAI',
      destinationAirport: 'CHE',
      departureTime: new Date(Date.now() + 172800000).setHours(18, 30, 0).toString(),
      arrivalTime: new Date(Date.now() + 172800000).setHours(21, 0, 0).toString(),
      baseFare: 2950,
      totalSeats: 189,
      duration: '2h 30m',
      flightImage: 'https://images.unsplash.com/photo-1486341781214-67235dfe9470?w=600&h=400&fit=crop'
    },
    {
      id: '6',
      flightNumber: 'SL606',
      aircraftType: 'Airbus A330',
      sourceAirport: 'COK',
      destinationAirport: 'LHR',
      departureTime: new Date(Date.now() + 259200000).setHours(20, 0, 0).toString(),
      arrivalTime: new Date(Date.now() + 259200001).setHours(6, 30, 0).toString(),
      baseFare: 12500,
      totalSeats: 295,
      duration: '9h 30m',
      flightImage: 'https://images.unsplash.com/photo-1504382301392-3cc45d338756?w=600&h=400&fit=crop'
    }
  ]

  // Sample Destination Data
  const destinations = [
    {
      id: 'goa',
      city: 'Goa',
      subtitle: 'Beaches & Culture',
      flag: '🏖️',
      image: '/images/destinations/goa.jpg'
    },
    {
      id: 'mumbai',
      city: 'Mumbai',
      subtitle: 'City of Dreams',
      flag: '🌃',
      image: '/images/destinations/mumbai.jpg'
    },
    {
      id: 'delhi',
      city: 'Delhi',
      subtitle: 'Historical Charm',
      flag: '🏛️',
      image: '/images/destinations/delhi.jpg'
    },
    {
      id: 'dubai',
      city: 'Dubai',
      subtitle: 'Luxury & Adventure',
      flag: '🌆',
      image: '/images/destinations/dubai.jpg'
    },
    {
      id: 'singapore',
      city: 'Singapore',
      subtitle: 'Modern Metropolis',
      flag: '✨',
      image: '/images/destinations/singapore.jpg'
    },
    {
      id: 'london',
      city: 'London',
      subtitle: 'Royal Excellence',
      flag: '👑',
      image: '/images/destinations/london.jpg'
    }
  ]

  return (
    <div className="home-page">
      {toast && (
        <div className={`toast-message ${toast.type}`} role="status">
          {toast.message}
        </div>
      )}
      {/* Hero Section */}
      <HeroSection />

      {/* Search & Filters Section */}
      <SearchFilters hideSortBy onFiltersChange={setFilters} />

      {/* Featured Flights Section */}
      <section className="featured-flights-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Featured Flights</h2>
            <p className="section-subtitle">
              {filteredFlights.length === 0 
                ? 'No flights available yet. Check back soon!' 
                : 'Handpicked premium routes for ultimate comfort'}
            </p>
          </div>

          {/* Loading State */}
          {loadingFlights && (
            <div className="flights-loading">
              <div className="loading-skeleton"></div>
              <div className="loading-skeleton"></div>
              <div className="loading-skeleton"></div>
              <p style={{ textAlign: 'center', color: '#6a7280', marginTop: '1rem' }}>
                Loading flights...
              </p>
            </div>
          )}

          {/* Empty State */}
          {!loadingFlights && filteredFlights.length === 0 && (
            <div className="flights-empty-state">
              <div className="empty-state-icon">
                <i className="bi bi-airplane"></i>
              </div>
              <h3>{flights.length === 0 ? 'No Flights Added Yet' : 'No Flights Match Your Filters'}</h3>
              <p>
                {flights.length === 0
                  ? 'Flights added through the admin panel will appear here.'
                  : 'Try changing the departure city, arrival city, date, time, or price range.'}
              </p>
              <div style={{ marginTop: '1.5rem' }}>
                <small style={{ color: '#6a7280' }}>
                  {flights.length === 0
                    ? '💡 Tip: Add flights from the <strong>Admin Panel</strong> to display them here'
                    : '💡 Tip: Clear the filters to see all featured flights again'}
                </small>
              </div>
            </div>
          )}

          {/* Flights Grid */}
          {!loadingFlights && filteredFlights.length > 0 && (
            <div className="flights-grid">
              {displayedFlights.map(flight => (
                <div key={flight.id || flight._id} className="flight-grid-item">
                  <FlightCard flight={flight} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Popular Destinations Section */}
      <section className="popular-destinations-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Popular Destinations</h2>
            <p className="section-subtitle">Explore our most loved routes across the globe</p>
          </div>

          <div className="destinations-grid">
            {destinations.map(destination => (
              <div key={destination.id} className="destination-grid-item">
                <DestinationCard destination={destination} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="why-choose-us-section">
        <div className="container">
          <h2 className="section-title">Why Choose Skyline Airways?</h2>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <i className="bi bi-shield-check"></i>
              </div>
              <h3>Safety First</h3>
              <p>Industry-leading safety standards and modern aircraft fleet</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <i className="bi bi-star"></i>
              </div>
              <h3>Luxury Comfort</h3>
              <p>Premium seating with entertainment and gourmet meals</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <i className="bi bi-clock-history"></i>
              </div>
              <h3>On-Time Always</h3>
              <p>99.2% on-time performance with dedicated flight operations</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <i className="bi bi-headset"></i>
              </div>
              <h3>24/7 Support</h3>
              <p>Round-the-clock customer service in multiple languages</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <i className="bi bi-award"></i>
              </div>
              <h3>Award Winning</h3>
              <p>Recognized globally for excellence and innovation</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <i className="bi bi-percent"></i>
              </div>
              <h3>Best Prices</h3>
              <p>Competitive fares with special discounts for loyalty members</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready for Your Next Adventure?</h2>
            <p>Book now and experience luxury travel at its finest</p>
            <a href="/flights" className="btn btn-cta">
              Start Booking
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
