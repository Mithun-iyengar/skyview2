import React from 'react'
import { Link } from 'react-router-dom'

export default function FlightCard({ flight }) {
  const {
    id,
    flightNumber,
    sourceAirport,
    destinationAirport,
    departureTime,
    baseFare,
    flightImage
  } = flight
  const displayFlightNumber = (typeof flightNumber === 'string' ? flightNumber.trim() : flightNumber) || 'Skyline'

  const formatTime = (timeStr) => {
    if (!timeStr) return '--'
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

  return (
    <div className="flight-card">
      {/* Flight Image */}
      <div className="flight-card-image">
        <img 
          src={flightImage || 'https://images.unsplash.com/photo-1606148291147-a3a89b5d27e6?w=600&h=400&fit=crop'} 
          alt={`${displayFlightNumber} flight`}
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1606148291147-a3a89b5d27e6?w=600&h=400&fit=crop'
          }}
        />
        <div className="flight-badge">
          <span className="flight-badge-label">Flight No.</span>
          <span className="badge-flight-number">{displayFlightNumber}</span>
        </div>
      </div>

      {/* Flight Details */}
      <div className="flight-card-body">
        <div className="flight-number-row">
          <span className="flight-number-label">Flight Number</span>
          <span className="flight-number-value">{displayFlightNumber}</span>
        </div>

        <div className="flight-route flight-route-preview">
          <div className="route-city route-city-preview">
            <span className="route-code">{sourceAirport}</span>
          </div>
          <div className="route-arrow route-arrow-preview">
            <i className="bi bi-arrow-right"></i>
          </div>
          <div className="route-city route-city-preview">
            <span className="route-code">{destinationAirport}</span>
          </div>
        </div>

        {/* Price and Action */}
        <div className="flight-footer">
          <div className="flight-price">
            {Number(baseFare || 0) > 0 && (
              <>
                <span className="price-label">from</span>
                <span className="price-amount">₹{baseFare?.toLocaleString()}</span>
              </>
            )}
            <span className="route-time mt-1">Departs {formatTime(departureTime)}</span>
          </div>
          <Link to={`/flight/${id}`} className="btn btn-flight-view">
            View Details
          </Link>
        </div>
      </div>
    </div>
  )
}
