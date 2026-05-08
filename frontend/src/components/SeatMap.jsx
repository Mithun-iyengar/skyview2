import React, { useState, useEffect } from 'react'
import { useToast } from './ToastProvider'

const SEAT_COLUMNS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K']
const SEAT_REFRESH_INTERVAL = 8000 // Refresh every 8 seconds to catch HOLD/BOOKED status from other users

function generateSeatLayout(classType, rows, columnsPerRow) {
  const prefix = classType === 'BUSINESS' ? 'B' : 'E'
  const seats = []

  for (let row = 1; row <= Number(rows || 0); row += 1) {
    for (let col = 0; col < Number(columnsPerRow || 0) && col < SEAT_COLUMNS.length; col += 1) {
      seats.push({
        seatNumber: `${prefix}${row}${SEAT_COLUMNS[col]}`,
        seatStatus: 'AVAILABLE',
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

export default function SeatMap({ flight, selectedSeats, setSelectedSeats, onBack, onNext, isLoading = false, onSeatStatusChange = null }) {
  const { addToast } = useToast()
  const [seatLocks, setSeatLocks] = useState({})
  const [lockTimers, setLockTimers] = useState({})
  const [error, setError] = useState(null)
  const [flightData, setFlightData] = useState(flight)
  const [refreshing, setRefreshing] = useState(false)

  const sortedSeatClasses = [...(flightData?.seatClasses || [])].map((seatClass) => {
    const rows = Number(seatClass?.rows || 0)
    const columnsPerRow = Number(seatClass?.columnsPerRow || 0)
    // Render only the seat data returned by the backend so the UI stays in sync with MySQL.
    const seats = Array.isArray(seatClass?.seats) ? seatClass.seats : []

    return {
      ...seatClass,
      rows,
      columnsPerRow,
      totalSeats: Number(seatClass?.totalSeats || rows * columnsPerRow || seats.length),
      pricePerSeat: Number(seatClass?.pricePerSeat || 0),
      seats,
    }
  }).sort((a, b) => {
    const order = { BUSINESS: 0, ECONOMY: 1 }
    return (order[a.classType] ?? 2) - (order[b.classType] ?? 2)
  })

  const allSeats = sortedSeatClasses.flatMap((seatClass) => seatClass.seats || [])
  // Count seats by actual status from database: BOOKED, HOLD, AVAILABLE, BLOCKED
  const bookedSeats = allSeats.filter((seat) => seat.seatStatus === 'BOOKED' || seat.seatStatus === 'OCCUPIED').length
  const heldSeats = allSeats.filter((seat) => seat.seatStatus === 'HOLD').length
  const blockedSeats = allSeats.filter((seat) => seat.seatStatus === 'BLOCKED').length
  const availableSeats = allSeats.filter((seat) => seat.seatStatus === 'AVAILABLE').length
  const totalSeats = allSeats.length

  // POLLING EFFECT: Refresh seat data every 8 seconds to catch HOLD/BOOKED status changes from other users
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      if (isLoading || !flight?.id) return
      
      try {
        setRefreshing(true)
        // Fetch latest flight data including current seat statuses from backend
        const response = await fetch(`/api/v1/flights/${flight.id}`, {
          headers: { 'Content-Type': 'application/json' }
        })
        
        if (response.ok) {
          const latestFlight = await response.json()
          
          // Check if any seat status changed
          const oldSeats = new Set(
            (flightData?.seatClasses || []).flatMap(sc => 
              (sc?.seats || []).map(s => `${s.seatNumber}:${s.seatStatus}`)
            )
          )
          
          const newSeats = new Set(
            (latestFlight?.seatClasses || []).flatMap(sc => 
              (sc?.seats || []).map(s => `${s.seatNumber}:${s.seatStatus}`)
            )
          )
          
          // Only update if something changed
          if (oldSeats.size !== newSeats.size || 
              ![...oldSeats].every(s => newSeats.has(s))) {
            console.log('Seat status changed, updating...')
            setFlightData(latestFlight)
            onSeatStatusChange?.()
            
            // Warn user if their selected seats are no longer available
            selectedSeats.forEach(seatNum => {
              const seatFound = latestFlight?.seatClasses?.some(sc =>
                sc.seats?.some(s => s.seatNumber === seatNum && s.seatStatus === 'AVAILABLE')
              )
              if (!seatFound) {
                addToast(`Seat ${seatNum} is no longer available`, 'warning', 3000)
              }
            })
          }
        }
      } catch (err) {
        console.warn('Failed to refresh seat data:', err)
      } finally {
        setRefreshing(false)
      }
    }, SEAT_REFRESH_INTERVAL)
    
    return () => clearInterval(pollInterval)
  }, [flight?.id, flightData, selectedSeats, onSeatStatusChange, isLoading, addToast])

  // LOCK TIMERS EFFECT: Manage countdown timers for user's seat selections
  useEffect(() => {
    const interval = setInterval(() => {
      setLockTimers(prev => {
        const updated = { ...prev }
        let hasExpired = false
        
        Object.keys(updated).forEach(seatNumber => {
          updated[seatNumber] -= 1
          if (updated[seatNumber] <= 0) {
            delete updated[seatNumber]
            delete seatLocks[seatNumber]
            hasExpired = true
          }
        })
        
        if (hasExpired) {
          setSeatLocks(prev => {
            const updated = { ...prev }
            Object.keys(updated).forEach(key => {
              if (!lockTimers[key] || lockTimers[key] <= 0) {
                delete updated[key]
              }
            })
            return updated
          })
        }
        
        return updated
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [seatLocks])

  const getSeatTypeClass = (seatType) => {
    switch (seatType) {
      case 'WINDOW': return 'window-seat'
      case 'AISLE': return 'aisle-seat'
      case 'MIDDLE': return 'middle-seat'
      default: return ''
    }
  }

  const getSeatClassPrefix = (classType) => {
    return classType === 'ECONOMY' ? 'E' : 'B'
  }

  const isSeatLocked = (seatNumber) => {
    return Boolean(seatLocks[seatNumber])
  }

  const isSeatSelected = (seatNumber) => {
    return selectedSeats.includes(seatNumber)
  }

  const handleSeatClick = (seat) => {
    setError(null)

    // Check if seat is booked/held (from database - other users' locks)
    if (seat.seatStatus === 'BOOKED' || seat.seatStatus === 'OCCUPIED') {
      addToast('This seat is already booked', 'warning', 3000)
      return
    }

    if (seat.seatStatus === 'HOLD') {
      addToast('This seat is temporarily held by another user. Please try again in a moment.', 'info', 3000)
      return
    }

    // Check if seat is blocked
    if (seat.seatStatus === 'BLOCKED') {
      addToast('This seat is not available for booking', 'warning', 3000)
      return
    }

    // Check if THIS user has it locked (own selection)
    if (isSeatLocked(seat.seatNumber) && !isSeatSelected(seat.seatNumber)) {
      addToast('This seat is temporarily held. Please try again in a moment.', 'info', 3000)
      return
    }

    if (isSeatSelected(seat.seatNumber)) {
      // Deselect the seat
      setSelectedSeats(selectedSeats.filter(s => s !== seat.seatNumber))
      const newTimers = { ...lockTimers }
      delete newTimers[seat.seatNumber]
      setLockTimers(newTimers)
      addToast(`Seat ${seat.seatNumber} deselected`, 'info', 2000)
    } else {
      // Select the seat
      if (selectedSeats.length >= 10) {
        setError('Maximum 10 seats can be selected')
        addToast('Maximum 10 seats can be selected', 'error', 3000)
        return
      }
      
      setSelectedSeats([...selectedSeats, seat.seatNumber])
      setLockTimers(prev => ({ ...prev, [seat.seatNumber]: 300 }))
      addToast(`Seat ${seat.seatNumber} selected`, 'success', 2000)
    }
  }

  const formatCountdown = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const renderSeat = (seat) => {
    const isSelected = isSeatSelected(seat.seatNumber)
    const isLocked = isSeatLocked(seat.seatNumber)
    // Database status: BOOKED, OCCUPIED, HOLD, or BLOCKED
    const isBooked = seat.seatStatus === 'BOOKED' || seat.seatStatus === 'OCCUPIED'
    const isHeldByOther = seat.seatStatus === 'HOLD'
    const isBlocked = seat.seatStatus === 'BLOCKED'
    const lockedTime = lockTimers[seat.seatNumber]

    let seatClassName = `seat-button ${getSeatTypeClass(seat.seatType)}`
    if (isBooked) seatClassName += ' occupied'          // Red - permanently booked
    else if (isBlocked) seatClassName += ' blocked'     // Gray - unavailable
    else if (isHeldByOther) seatClassName += ' held'    // Yellow - held by other user
    else if (isLocked && !isSelected) seatClassName += ' locked'  // Yellow - user's own lock
    else if (isSelected) seatClassName += ' selected'   // Blue - user selected

    return (
      <button
        key={seat.seatNumber}
        className={seatClassName}
        onClick={() => handleSeatClick(seat)}
        disabled={isBooked || isBlocked || isHeldByOther || (isLocked && !isSelected) || isLoading}
        title={`${seat.seatNumber} - ${seat.seatType} - ${seat.seatStatus}`}
        aria-label={`Seat ${seat.seatNumber}, Status: ${seat.seatStatus}`}
      >
        <span className="seat-number">{seat.seatNumber}</span>
        {(isLocked || isHeldByOther) && lockedTime && (
          <span className="lock-timer">{formatCountdown(lockedTime)}</span>
        )}
        {isBooked && <span className="occupied-icon">✓</span>}
        {isBlocked && <span className="blocked-icon">—</span>}
      </button>
    )
  }

  const renderSeatClass = (seatClass) => {
    if (!seatClass.seats || seatClass.seats.length === 0) return null

    const seatsByRow = {}
    seatClass.seats.forEach(seat => {
      if (!seatsByRow[seat.row]) seatsByRow[seat.row] = []
      seatsByRow[seat.row].push(seat)
    })

    // Sort seats in each row by column
    const columnOrder = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K']
    Object.keys(seatsByRow).forEach(row => {
      seatsByRow[row].sort((a, b) => {
        return columnOrder.indexOf(a.column) - columnOrder.indexOf(b.column)
      })
    })

    return (
      <div key={seatClass.classType} className={`seat-class-section ${seatClass.classType.toLowerCase()}`}>
        <div className="class-header">
          <h3>{seatClass.className}</h3>
          <div className="class-price-badge">₹{Number(seatClass.pricePerSeat || 0).toLocaleString('en-IN')}</div>
        </div>

        <div className="seat-grid-wrapper">
          {Object.keys(seatsByRow)
            .sort((a, b) => parseInt(a) - parseInt(b))
            .map(row => (
              <div key={row} className="seat-row">
                <span className="row-label">{row}</span>
                <div className="row-seats">
                  {seatsByRow[row].map(seat => renderSeat(seat))}
                </div>
              </div>
            ))}
        </div>
      </div>
    )
  }

  return (
    <div className="seat-map-container">
      <div className="seat-map-header">
        <h2>Select Your Seats</h2>
        <p className="seat-selection-hint">Choose up to 10 seats • 5-minute hold time</p>
      </div>

      <div className="seat-map-stats">
        <div className="seat-map-stat">
          <span>Total Seats</span>
          <strong>{totalSeats}</strong>
        </div>
        <div className="seat-map-stat">
          <span>Available</span>
          <strong>{availableSeats}</strong>
        </div>
        <div className="seat-map-stat">
          <span>Booked</span>
          <strong>{bookedSeats}</strong>
        </div>
        <div className="seat-map-stat">
          <span>Held</span>
          <strong>{heldSeats}</strong>
        </div>
        <div className="seat-map-stat">
          <span>Selected</span>
          <strong>{selectedSeats.length}</strong>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="close-error">×</button>
        </div>
      )}

      <div className="legend-section">
        <h4>Legend</h4>
        <div className="legend-grid">
          <div className="legend-item">
            <button className="seat-button window-seat" disabled></button>
            <span>Available Window Seat</span>
          </div>
          <div className="legend-item">
            <button className="seat-button aisle-seat" disabled></button>
            <span>Available Aisle Seat</span>
          </div>
          <div className="legend-item">
            <button className="seat-button middle-seat" disabled></button>
            <span>Available Middle Seat</span>
          </div>
          <div className="legend-item">
            <button className="seat-button selected" disabled></button>
            <span>Your Selection</span>
          </div>
          <div className="legend-item">
            <button className="seat-button locked" disabled></button>
            <span>Your Lock (5 min)</span>
          </div>
          <div className="legend-item">
            <button className="seat-button held" disabled></button>
            <span>Held by Other User</span>
          </div>
          <div className="legend-item">
            <button className="seat-button occupied" disabled></button>
            <span>Booked</span>
          </div>
          <div className="legend-item">
            <button className="seat-button blocked" disabled></button>
            <span>Blocked/Unavailable</span>
          </div>
        </div>
      </div>

      <div className="seat-map-content">
        {sortedSeatClasses.length > 0 ? (
          <div className="seat-classes-container">
            {sortedSeatClasses.map(renderSeatClass)}
          </div>
        ) : (
          <div className="no-seats-message">No seat information available</div>
        )}
      </div>

      <div className="seat-selection-summary">
        <div className="summary-info">
          <h3>Your Selection</h3>
          {selectedSeats.length > 0 ? (
            <div className="selected-seats-list">
              <p><strong>{selectedSeats.length} seat{selectedSeats.length !== 1 ? 's' : ''} selected:</strong></p>
              <div className="seats-tags">
                {selectedSeats.map(seat => (
                  <span key={seat} className="seat-tag">
                    {seat}
                    <span className="timer">{lockTimers[seat] ? formatCountdown(lockTimers[seat]) : ''}</span>
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p className="no-selection">Select seats to proceed</p>
          )}
        </div>
      </div>

      <div className="seat-map-actions">
        <button 
          onClick={onBack} 
          className="btn btn-secondary"
          disabled={isLoading}
        >
          ← Back to Flight Details
        </button>
        <button 
          onClick={() => onNext(selectedSeats)} 
          className="btn btn-primary" 
          disabled={selectedSeats.length === 0 || isLoading}
        >
          {isLoading ? 'Processing...' : 'Continue to Passenger Details'}
        </button>
      </div>
    </div>
  )
}