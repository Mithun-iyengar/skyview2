import React from 'react'
import { Link } from 'react-router-dom'

function formatTime(value) {
  if (!value) return '--:--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '--:--'
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function formatPrice(value) {
  const amount = Number(value || 0)
  return `₹${amount.toLocaleString('en-IN')}`
}

function getDurationText(departureTime, arrivalTime, providedDuration) {
  if (providedDuration) return providedDuration

  const dep = new Date(departureTime)
  const arr = new Date(arrivalTime)
  if (Number.isNaN(dep.getTime()) || Number.isNaN(arr.getTime()) || arr <= dep) {
    return 'Duration N/A'
  }

  const totalMinutes = Math.round((arr - dep) / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours === 0) return `${minutes}m`
  return `${hours}h ${minutes}m`
}

export default function FlightListingCard({ flight }) {
  const flightId = flight.id || flight.flightId || flight._id || flight.flightNumber
  const source = flight.sourceAirport || flight.source || 'N/A'
  const destination = flight.destinationAirport || flight.destination || 'N/A'
  const title = flight.aircraftType || flight.flightName || flight.flightNumber || 'Skyline Flight'
  const sortedSeatClasses = [...(flight.seatClasses || [])].sort((a, b) => {
    const order = { BUSINESS: 0, ECONOMY: 1 }
    return (order[a.classType] ?? 2) - (order[b.classType] ?? 2)
  })
  const fallbackEconomy = Math.round(Number(flight.baseFare || 0) + Number(flight.taxes || 0))
  const fallbackBusiness = Math.round((Number(flight.baseFare || 0) * Number(flight.businessMultiplier || 1.5)) + Number(flight.taxes || 0))
  const seatClassesWithPrice = sortedSeatClasses.map((seatClass) => {
    const seatPrice = Number(seatClass.pricePerSeat || 0)
    if (seatPrice > 0) {
      return seatClass
    }
    return {
      ...seatClass,
      pricePerSeat: seatClass.classType === 'BUSINESS' ? fallbackBusiness : fallbackEconomy,
    }
  })
  const economySeatClass = seatClassesWithPrice.find((seatClass) => seatClass.classType === 'ECONOMY')
  const startingPrice = Number(flight.economyPrice ?? economySeatClass?.pricePerSeat ?? flight.baseFare ?? 0)
  const image =
    flight.flightImage ||
    'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&h=500&fit=crop'

  return (
    <article className="lux-flight-card">
      <div className="lux-flight-media-wrap">
        <img
          src={image}
          alt={title}
          className="lux-flight-media"
          onError={(event) => {
            event.currentTarget.src =
              'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&h=500&fit=crop'
          }}
        />
        <span className="lux-flight-chip">{flight.flightNumber || 'Skyline'}</span>
      </div>

      <div className="lux-flight-body">
        <div className="lux-flight-route">
          <div className="lux-flight-airport">
            <strong>{source}</strong>
            <span>Departure</span>
          </div>
          <div className="lux-flight-route-mid">
            <i className="bi bi-airplane"></i>
            <small>{getDurationText(flight.departureTime, flight.arrivalTime, flight.duration)}</small>
          </div>
          <div className="lux-flight-airport">
            <strong>{destination}</strong>
            <span>Arrival</span>
          </div>
        </div>

        <div className="lux-flight-meta">
          <span>
            <i className="bi bi-clock"></i>
            {formatTime(flight.departureTime)} - {formatTime(flight.arrivalTime)}
          </span>
          <span>
            <i className="bi bi-stars"></i>
            {title}
          </span>
        </div>

        <div className="lux-flight-footer">
          <div className="lux-flight-price">
            {sortedSeatClasses.length > 0 ? (
              <div className="price-breakdown">
                {startingPrice > 0 && (
                  <div className="price-item from-price">
                    <span className="class-name">Economy</span>
                    <span className="price-amount">₹{startingPrice.toLocaleString('en-IN')}</span>
                  </div>
                )}
                {seatClassesWithPrice
                  .filter((seatClass) => seatClass.classType !== 'ECONOMY')
                  .map((seatClass, index) => (
                  <div key={index} className="price-item">
                    <span className="class-name">{seatClass.className}</span>
                    <span className="price-amount">₹{Number(seatClass.pricePerSeat || 0).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            ) : (
              `From ₹${Number(flight.baseFare || flight.price || 0).toLocaleString('en-IN')}`
            )}
          </div>
          <Link to={`/flight/${flightId}`} className="btn lux-book-btn">
            Book Now
          </Link>
        </div>
      </div>
    </article>
  )
}
