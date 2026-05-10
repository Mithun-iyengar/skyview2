import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchFlight } from '../utils/flightData'
import { walletApi } from '../utils/apiService'
import { bookingApi } from '../utils/bookingApi'
import SeatMap from '../components/SeatMap'
import PassengerForm from '../components/PassengerForm'
import { useToast } from '../components/ToastProvider'

export default function FlightDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToast } = useToast()
  
  const [flight, setFlight] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedSeats, setSelectedSeats] = useState([])
  const [processingBooking, setProcessingBooking] = useState(false)
  const [currentStep, setCurrentStep] = useState('details') // details, seats, passenger
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [pendingPassengerData, setPendingPassengerData] = useState(null)
  const [pendingTotalAmount, setPendingTotalAmount] = useState(0)
  const [walletBalance, setWalletBalance] = useState(null)
  const [confirmingWalletPayment, setConfirmingWalletPayment] = useState(false)
  const [bookingConfirmed, setBookingConfirmed] = useState(false)
  const [bookingSuccessMessage, setBookingSuccessMessage] = useState('')

  const sortedSeatClasses = [...(flight?.seatClasses || [])].sort((a, b) => {
    const order = { BUSINESS: 0, ECONOMY: 1 }
    return (order[a.classType] ?? 2) - (order[b.classType] ?? 2)
  })

  const economySeatClass = sortedSeatClasses.find((seatClass) => seatClass.classType === 'ECONOMY')
  const businessSeatClass = sortedSeatClasses.find((seatClass) => seatClass.classType === 'BUSINESS')
  const economyPrice = Number(flight?.economyPrice ?? economySeatClass?.pricePerSeat ?? 0)
  const businessPrice = Number(flight?.businessPrice ?? businessSeatClass?.pricePerSeat ?? 0)
  const allSeats = sortedSeatClasses.flatMap((seatClass) => seatClass.seats || [])
  const isBookedSeat = (seat) => seat?.seatStatus === 'BOOKED' || seat?.seatStatus === 'OCCUPIED'
  const bookedSeats = allSeats.filter(isBookedSeat)
  const availableSeats = allSeats.filter((seat) => seat?.seatStatus === 'AVAILABLE')
  const totalSeats = allSeats.length || Number(flight?.totalSeats || 0)
  const serviceLabels = [
    ['meals', 'Meals'],
    ['wifi', 'WiFi'],
    ['baggage', 'Extra Baggage'],
    ['entertainment', 'Entertainment'],
    ['priorityBoarding', 'Priority Boarding'],
  ]
  // Normalize flight.services which may be an object {meals: true},
  // an array ['meals','wifi'] or a string. Provide robust detection.
  const hasServiceValue = (svc, key) => {
    if (!svc) return false
    if (typeof svc === 'string') {
      try {
        return hasServiceValue(JSON.parse(svc), key)
      } catch {
        return String(svc).toLowerCase().includes(String(key).toLowerCase())
      }
    }
    if (Array.isArray(svc)) {
      try {
        // array may be ['meals','wifi'] or [{ name: 'meals' }, 'wifi']
        const normalized = svc.map((s) => {
          if (!s && s !== 0) return ''
          if (typeof s === 'object') return String(s.name || s.key || JSON.stringify(s)).toLowerCase()
          return String(s).toLowerCase()
        })
        const set = new Set(normalized.map((s) => s.trim()))
        if (set.has(key.toLowerCase())) return true
        // also check key in variants
        const variants = [key, key.replace(/([A-Z])/g, '_$1').toLowerCase(), key.replace(/([A-Z])/g, '-$1').toLowerCase()]
        return variants.some((v) => set.has(v))
      } catch {
        return false
      }
    }
    if (typeof svc === 'object') {
      // check direct key, case-insensitive, snake_case and kebab-case variants
      try {
        if (Object.prototype.hasOwnProperty.call(svc, key)) return Boolean(svc[key])
        const lowerMap = Object.keys(svc).reduce((acc, k) => { acc[k.toLowerCase()] = svc[k]; return acc }, {})
        if (Object.prototype.hasOwnProperty.call(lowerMap, key.toLowerCase())) return Boolean(lowerMap[key.toLowerCase()])
        const snake = key.replace(/([A-Z])/g, '_$1').toLowerCase()
        if (Object.prototype.hasOwnProperty.call(lowerMap, snake)) return Boolean(lowerMap[snake])
        const kebab = key.replace(/([A-Z])/g, '-$1').toLowerCase()
        if (Object.prototype.hasOwnProperty.call(lowerMap, kebab)) return Boolean(lowerMap[kebab])
        // fallback: any key that contains the service key
        return Object.keys(lowerMap).some((k) => k.includes(key.toLowerCase()) && Boolean(lowerMap[k]))
      } catch {
        return false
      }
    }
    // fallback: string search
    try {
      return String(svc).toLowerCase().includes(String(key).toLowerCase())
    } catch {
      return false
    }
  }

  const hasService = (key) => hasServiceValue(flight?.services, key)

  const availableServices = serviceLabels.filter(([key]) => hasService(key))

  useEffect(() => {
    const loadFlight = async () => {
      try {
        setLoading(true)
        const flightData = await fetchFlight(id)
        setFlight(flightData)
      } catch (err) {
        setError(err.message || 'Failed to load flight details')
        addToast('Failed to load flight details', 'error', 4000)
      } finally {
        setLoading(false)
      }
    }

    loadFlight()
    window.scrollTo(0, 0)
  }, [id, addToast])

  const formatTime = (timeStr) => {
    if (!timeStr) return '--:--'
    try {
      return new Date(timeStr).toLocaleTimeString('en-IN', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      })
    } catch {
      return timeStr
    }
  }

  const formatDate = (timeStr) => {
    if (!timeStr) return '--'
    try {
      return new Date(timeStr).toLocaleDateString('en-IN', { 
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    } catch {
      return timeStr
    }
  }

  const getDuration = (departure, arrival) => {
    if (!departure || !arrival) return 'N/A'
    try {
      const dep = new Date(departure)
      const arr = new Date(arrival)
      if (isNaN(dep.getTime()) || isNaN(arr.getTime())) return 'N/A'
      const diff = arr - dep
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      return `${hours}h ${minutes}m`
    } catch {
      return 'N/A'
    }
  }

  const handleStartBooking = () => {
    setCurrentStep('seats')
    addToast('Select your seats to continue', 'info', 3000)
  }

  const handleSeatsSelected = (seats) => {
    setSelectedSeats(seats)
    setCurrentStep('passenger')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const getCurrentUserId = () => {
    const localUserId = localStorage.getItem('skyline_user_id') || sessionStorage.getItem('skyline_user_id')
    if (localUserId) {
      const normalizedLocalId = String(localUserId).trim()
      if (/^\d+$/.test(normalizedLocalId)) {
        return Number(normalizedLocalId)
      }
    }

    const token = localStorage.getItem('skyline_user_token') || sessionStorage.getItem('skyline_user_token')
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        const rawId = payload.userId ?? payload.id ?? payload.sub
        if (rawId !== undefined && rawId !== null) {
          const normalizedTokenId = String(rawId).trim()
          if (/^\d+$/.test(normalizedTokenId)) {
            return Number(normalizedTokenId)
          }
        }
      } catch {
        // ignore invalid token payload
      }
    }

    return null
  }

  const parseNumericId = (value) => {
    if (value === undefined || value === null) return null
    const normalized = String(value).trim()
    const exactMatch = normalized.match(/^\d+$/)
    if (exactMatch) {
      const numeric = Number(exactMatch[0])
      return Number.isFinite(numeric) ? numeric : null
    }
    return null
  }

  const ensureAuthenticated = () => {
    const token = localStorage.getItem('skyline_user_token') || sessionStorage.getItem('skyline_user_token')
    if (token) return true

    addToast('Please sign in to continue booking.', 'error', 3500)
    navigate('/login')
    return false
  }

  const calculateBookingAmount = () => {
    if (!flight || !Array.isArray(selectedSeats)) return 0
    let totalAmount = 0

    selectedSeats.forEach((seatNumber) => {
      const classInfo = flight.seatClasses?.find((seatClass) => {
        const prefix = seatClass.classType === 'ECONOMY' ? 'E' : 'B'
        return seatNumber.startsWith(prefix)
      })

      if (classInfo) {
        totalAmount += Number(classInfo.pricePerSeat || 0)
      }
    })

    return Math.round(totalAmount)
  }

  const handlePassengerSubmit = async (passengerData) => {
    if (!ensureAuthenticated()) {
      return
    }

    try {
      const totalAmount = calculateBookingAmount()
      setPendingPassengerData(passengerData)
      setPendingTotalAmount(totalAmount)

      const wallet = await walletApi.getBalance()
      setWalletBalance(Number(wallet?.balance ?? 0))
      setConfirmModalOpen(true)
    } catch (err) {
      addToast(err.message || 'Unable to load wallet details', 'error', 4000)
      setCurrentStep('passenger')
    }
  }

  const handleApproveWalletPayment = async () => {
    if (!pendingPassengerData) return
    if (!ensureAuthenticated()) return

    if (!Array.isArray(selectedSeats) || selectedSeats.length === 0) {
      addToast('Please select at least one seat before confirming your booking.', 'error', 5000)
      setConfirmModalOpen(false)
      return
    }

    const userId = getCurrentUserId()
    if (!userId) {
      throw new Error('Unable to determine your account. Please sign out and sign in again before confirming payment.')
    }

    const resolveFlightId = async () => {
      const candidateValues = [flight?.flightId, flight?.id, id]
      for (const candidate of candidateValues) {
        const parsedId = parseNumericId(candidate)
        if (Number.isFinite(parsedId)) {
          return parsedId
        }
      }

      if (flight?.flightNumber) {
        try {
          const resolvedFlight = await fetchFlight(flight.flightNumber)
          if (resolvedFlight) {
            const resolvedId = parseNumericId(resolvedFlight?.flightId ?? resolvedFlight?.id)
            if (Number.isFinite(resolvedId)) {
              setFlight(resolvedFlight)
              return resolvedId
            }
          }
        } catch {
          // if fallback fails, continue to null return below
        }
      }

      if (typeof id === 'string') {
        const parsedRouteId = parseNumericId(id)
        if (Number.isFinite(parsedRouteId)) {
          return parsedRouteId
        }
      }

      return null
    }

    const flightId = await resolveFlightId()
    if (!Number.isFinite(flightId)) {
      console.error('Flight ID resolution failed', {
        routeId: id,
        flightObject: flight,
        resolvedId: flightId
      })
      throw new Error('Invalid flight identifier. Please refresh the page or select a valid flight before confirming payment.')
    }

    try {
      setProcessingBooking(true)
      setConfirmingWalletPayment(true)

      const latestWallet = await walletApi.getBalance()
      const latestBalance = Number(latestWallet?.balance ?? 0)
      setWalletBalance(latestBalance)

      if (latestBalance < pendingTotalAmount) {
        throw new Error('Insufficient funds in wallet. Please add money to continue booking.')
      }

      // Create booking in backend with wallet payment
      const backendBookingData = {
        flightId,
        userId,
        seatNumbers: selectedSeats,
        passengerName: pendingPassengerData.fullName,
        passengerEmail: pendingPassengerData.email,
        passengerPhone: pendingPassengerData.phone,
        passengerAge: parseInt(pendingPassengerData.age, 10),
        aadhaarNumber: pendingPassengerData.aadhaarNumber,
        passportNumber: pendingPassengerData.passportNumber,
        mealPreference: pendingPassengerData.mealPreference,
        wheelchairAssistance: pendingPassengerData.wheelchairAssistance,
        totalAmount: pendingTotalAmount,
        additionalPassengers: pendingPassengerData.additionalPassengers || [],
        paymentMethod: 'WALLET'
      }

      try {
        await bookingApi.createBooking(backendBookingData)
      } catch (backendError) {
        console.error('Backend booking creation failed:', backendError)
        throw backendError
      }

      window.dispatchEvent(new Event('walletUpdated'))

      const successText = `Booking confirmed. ₹${pendingTotalAmount.toLocaleString('en-IN')} has been deducted from your wallet.`
      setBookingSuccessMessage(successText)
      setBookingConfirmed(true)
      setConfirmModalOpen(false)
      addToast('Booking confirmed and wallet updated successfully.', 'success', 4500)
      
      // Refresh flight data to get updated seat statuses
      try {
        setTimeout(async () => {
          const latestFlightData = await fetchFlight(id)
          setFlight(latestFlightData)
          setSelectedSeats([])
        }, 1500)
      } catch (err) {
        console.warn('Failed to refresh flight data after booking:', err)
      }
    } catch (err) {
      const message = err?.message || 'Failed to complete booking'

      if (message.includes('401') || message.toLowerCase().includes('unauthorized')) {
        addToast('Session expired. Please sign in again.', 'error', 4500)
        navigate('/login')
        return
      }

      if (message.toLowerCase().includes('insufficient')) {
        addToast('Insufficient funds in wallet. Please add money and try again.', 'error', 5000)
      } else {
        addToast(message, 'error', 5000)
      }
    } finally {
      setConfirmingWalletPayment(false)
      setProcessingBooking(false)
    }
  }

  const handleBackStep = () => {
    if (currentStep === 'passenger') {
      setCurrentStep('seats')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (currentStep === 'seats') {
      setCurrentStep('details')
      setSelectedSeats([])
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  if (loading) {
    return (
      <section className="page flight-details container">
        <div className="loading-message">
          <div className="spinner"></div>
          <p>Loading flight details...</p>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="page flight-details container">
        <div className="error-message">
          <h2>Oops!</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/flights')} className="btn btn-primary">
            Back to All Flights
          </button>
        </div>
      </section>
    )
  }

  if (!flight) {
    return (
      <section className="page flight-details container">
        <div className="error-message">
          <h2>Flight Not Found</h2>
          <p>The flight you're looking for doesn't exist.</p>
          <button onClick={() => navigate('/flights')} className="btn btn-primary">
            Back to All Flights
          </button>
        </div>
      </section>
    )
  }

  // Render details step
  if (currentStep === 'details') {
    return (
      <section className="page flight-details container">
        <button onClick={() => navigate('/flights')} className="back-link">
          ← Back to Flights
        </button>

        <div className="flight-details-hero fade-in">
          <div className="flight-image-container">
            <img 
              src={flight.flightImage || 'https://images.unsplash.com/photo-1606148291147-a3a89b5d27e6?w=800&h=400&fit=crop'} 
              alt={flight.flightNumber}
              className="flight-detail-image"
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1606148291147-a3a89b5d27e6?w=800&h=400&fit=crop'
              }}
            />
          </div>

          <div className="flight-details-main">
            <div className="flight-header">
              <div>
                <h1>{flight.flightNumber}</h1>
                <p className="aircraft-type">{flight.aircraftType}</p>
              </div>
              <div className="flight-badge">Premium Airline</div>
            </div>

            <div className="route-section">
              <div className="route-segment">
                <div className="airport-info">
                  <div className="airport-code">{flight.sourceAirport}</div>
                  <div className="time">{formatTime(flight.departureTime)}</div>
                  <div className="date">{formatDate(flight.departureTime)}</div>
                </div>
              </div>

              <div className="route-divider">
                <div className="duration-info">
                  <span>{getDuration(flight.departureTime, flight.arrivalTime)}</span>
                  <svg viewBox="0 0 100 20" className="route-line">
                    <line x1="0" y1="10" x2="100" y2="10" stroke="var(--royal-gold)" strokeWidth="2"/>
                    <polygon points="100,10 90,5 90,15" fill="var(--royal-gold)"/>
                  </svg>
                </div>
              </div>

              <div className="route-segment">
                <div className="airport-info">
                  <div className="airport-code">{flight.destinationAirport}</div>
                  <div className="time">{formatTime(flight.arrivalTime)}</div>
                  <div className="date">{formatDate(flight.arrivalTime)}</div>
                </div>
              </div>
            </div>

            <div className="seat-classes-info">
              <h3>Available Seat Classes</h3>
              <div className="classes-grid">
                {sortedSeatClasses
                  .filter((seatClass) => {
                    // hide economy entries with zero price (these are often placeholders)
                    if ((seatClass.classType === 'ECONOMY') && Number(seatClass.pricePerSeat || 0) === 0) return false
                    return true
                  })
                  .map((seatClass, index) => (
                  <div key={index} className="class-card">
                    <div className="class-name">{seatClass.className}</div>
                    <div className="class-details">
                      <div className="detail-row">
                        <span className="label">Total Seats:</span>
                        <span className="value">{seatClass.totalSeats}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Booked Seats:</span>
                        <span className="value">{(seatClass.seats || []).filter((seat) => seat.seatStatus === 'BOOKED' || seat.seatStatus === 'OCCUPIED').length}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Available Seats:</span>
                        <span className="value">{(seatClass.seats || []).filter((seat) => seat.seatStatus === 'AVAILABLE').length}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Price per Seat:</span>
                        <span className="price-value">₹{Number(seatClass.pricePerSeat || 0).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="seat-classes-info">
              <h3>Flight Summary</h3>
              <div className="classes-grid">
                <div className="class-card">
                  <div className="class-name">Seat Inventory</div>
                  <div className="class-details">
                    <div className="detail-row"><span className="label">Total:</span><span className="value">{totalSeats}</span></div>
                    <div className="detail-row"><span className="label">Booked:</span><span className="value">{bookedSeats.length}</span></div>
                    <div className="detail-row"><span className="label">Available:</span><span className="value">{availableSeats.length}</span></div>
                  </div>
                </div>
                <div className="class-card">
                  <div className="class-name">Services</div>
                  <div className="class-details">
                    {availableServices.length > 0 ? availableServices.map(([key, label]) => (
                      <div key={key} className="detail-row">
                        <span className="label">{label}</span>
                        <span className="value">Included</span>
                      </div>
                    )) : (
                      <div className="detail-row"><span className="label">Services</span><span className="value">None listed</span></div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flight-actions">
              <button 
                onClick={() => navigate('/flights')} 
                className="btn btn-secondary"
              >
                ← View Other Flights
              </button>
              <button 
                onClick={handleStartBooking} 
                className="btn btn-primary"
              >
                Book This Flight →
              </button>
            </div>
          </div>
        </div>
      </section>
    )
  }

  // Render seats selection step
  if (currentStep === 'seats') {
    return (
      <section className="page flight-details booking container">
        <button onClick={handleBackStep} className="back-link">
          ← Back to Flight Details
        </button>

        <SeatMap 
          flight={flight} 
          selectedSeats={selectedSeats} 
          setSelectedSeats={setSelectedSeats}
          onBack={handleBackStep}
          onNext={handleSeatsSelected}
          isLoading={processingBooking}
        />
      </section>
    )
  }

  // Render passenger details step
  if (currentStep === 'passenger') {
    return (
      <section className="page flight-details booking container">
        <button onClick={handleBackStep} className="back-link">
          ← Back to Seat Selection
        </button>

        {confirmModalOpen && (
          <div className="booking-confirm-overlay" role="dialog" aria-modal="true" aria-label="Booking payment confirmation">
            <div className="booking-confirm-card">
              <div className="booking-confirm-header">
                <h3>Confirm Wallet Payment</h3>
                <p>Please review the final amount before confirming your booking.</p>
              </div>

              <div className="booking-confirm-body">
                <div className="booking-confirm-row">
                  <span>Total Booking Amount</span>
                  <strong>₹{Number(pendingTotalAmount || 0).toLocaleString('en-IN')}</strong>
                </div>
                <div className="booking-confirm-row">
                  <span>Available Wallet Balance</span>
                  <strong>₹{Number(walletBalance || 0).toLocaleString('en-IN')}</strong>
                </div>
                <div className="booking-confirm-row booking-confirm-highlight">
                  <span>Balance After Deduction</span>
                  <strong>₹{Math.max(0, Number(walletBalance || 0) - Number(pendingTotalAmount || 0)).toLocaleString('en-IN')}</strong>
                </div>
              </div>

              {Number(walletBalance || 0) < Number(pendingTotalAmount || 0) && (
                <div className="booking-confirm-alert-error">
                  Insufficient funds in wallet. Please add money to continue.
                </div>
              )}

              <div className="booking-confirm-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setConfirmModalOpen(false)}
                  disabled={confirmingWalletPayment}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleApproveWalletPayment}
                  disabled={confirmingWalletPayment || Number(walletBalance || 0) < Number(pendingTotalAmount || 0)}
                >
                  {confirmingWalletPayment ? 'Processing...' : 'Confirm & Deduct from Wallet'}
                </button>
              </div>
            </div>
          </div>
        )}

        <PassengerForm 
          flight={flight}
          selectedSeats={selectedSeats}
          onBack={handleBackStep}
          onNext={handlePassengerSubmit}
          isLoading={processingBooking}
        />

        {bookingConfirmed && (
          <div className="booking-success-overlay" role="alertdialog" aria-modal="true" aria-label="Booking confirmed">
            <div className="booking-success-card">
              <div className="booking-success-header">
                <h3>Booking Confirmed</h3>
                <p>{bookingSuccessMessage}</p>
              </div>
              <div className="booking-success-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => navigate('/account/reservations')}
                >
                  View My Reservations
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    )
  }
}
