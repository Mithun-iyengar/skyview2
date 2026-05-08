import React from 'react'
import { useParams, Link } from 'react-router-dom'

export default function Booking() {
  const { flightId } = useParams()
  return (
    <section className="page booking container">
      <h1>Booking</h1>
      <p>Booking form for flight <strong>{flightId}</strong>.</p>
      <Link to="/payment/sample-booking-id" className="btn">Proceed to payment (demo)</Link>
    </section>
  )
}
