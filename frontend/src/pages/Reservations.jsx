import React, { useEffect, useState } from 'react'
import { bookingApi, getCurrentUserId } from '../utils/bookingApi'

function formatDate(value) {
  if (!value) {
    return '—'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  return date.toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

function formatAmount(value) {
  if (value === null || value === undefined || value === '') {
    return '—'
  }

  const amount = Number(value)
  if (Number.isNaN(amount)) {
    return '—'
  }

  return `₹${amount.toLocaleString('en-IN')}`
}

export default function Reservations() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [successBanner, setSuccessBanner] = useState('')
  const [userId, setUserId] = useState(null)

  useEffect(() => {
    const message = sessionStorage.getItem('skyline_booking_success')
    if (message) {
      setSuccessBanner(message)
      sessionStorage.removeItem('skyline_booking_success')
    }
  }, [])

  useEffect(() => {
    async function fetchBookings() {
      const currentUserId = getCurrentUserId()
      setUserId(currentUserId)
      if (!currentUserId) {
        setError('Please sign in to view your bookings.')
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)
      try {
        const data = await bookingApi.getUserBookings(currentUserId)
        const normalized = Array.isArray(data) ? data : []
        normalized.sort((a, b) => {
          const left = new Date(a?.createdAt || 0).getTime()
          const right = new Date(b?.createdAt || 0).getTime()
          return right - left
        })
        setBookings(normalized)
      } catch (err) {
        setError(err.message || 'Failed to load bookings')
      } finally {
        setLoading(false)
      }
    }

    fetchBookings()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0f1f] via-[#0f1a35] to-[#1a0f2e] relative overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 right-10 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          
          {/* Page Header */}
          <div className="mb-12">
            <h1 className="text-6xl md:text-7xl font-black text-[#0a0f1f] mb-2 tracking-tight drop-shadow-lg">
              My Reservations
            </h1>
            <p className="text-gray-400 text-lg font-light">
              Manage your premium flight bookings with Skyline Airways
            </p>
            <div className="w-20 h-1 bg-gradient-to-r from-[#D4AF37] to-transparent mt-6" />
          </div>

          {/* Success Message */}
          {successBanner && (
            <div className="mb-8 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl backdrop-blur-md">
              <p className="text-emerald-300 font-semibold flex items-center gap-2">
                <span className="text-lg">✓</span>
                {successBanner}
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-8 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl backdrop-blur-md">
              <p className="text-rose-300 font-semibold flex items-center gap-2">
                <span className="text-lg">⚠</span>
                {error}
              </p>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-12 h-12 rounded-full border-4 border-gray-700 border-t-[#D4AF37] animate-spin mb-4" />
              <p className="text-white font-bold text-lg">Loading your reservations...</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && bookings.length === 0 && (
            <div className="text-center py-16">
              <p className="text-gray-400 text-lg mb-6">
                {userId ? 'No active bookings' : 'Please sign in to view your bookings'}
              </p>
              <a href="/flights" className="inline-block px-8 py-3 bg-[#D4AF37] text-[#0a0f1f] font-bold rounded-lg hover:bg-[#e5c158] transition-colors">
                Book a Flight
              </a>
            </div>
          )}

          {/* Bookings List */}
          {!loading && bookings.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  style={{
                    width: '100%',
                    maxWidth: 980,
                    margin: '0 auto',
                    background: 'linear-gradient(135deg,#0b0f1a 0%, #111827 100%)',
                    borderRadius: 20,
                    boxShadow: '0 24px 48px rgba(2,6,23,0.6)',
                    border: '1px solid rgba(212,175,55,0.08)',
                    overflow: 'hidden',
                    color: '#fff'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '26px 28px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div>
                      <div style={{ fontSize: 12, color: '#9ca3af', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6 }}>Booking Reference</div>
                      <div style={{ fontSize: 28, fontWeight: 900, color: '#fff' }}>#{booking.id}</div>
                    </div>
                    <div style={{ padding: '8px 14px', borderRadius: 9999, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', border: '1px solid rgba(255,255,255,0.06)' }}>
                      {booking.status || 'Unknown'}
                    </div>
                  </div>

                  <div style={{ padding: '26px 28px' }}>
                    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 18 }}>
                      <div style={{ flex: '1 1 240px' }}>
                        <div style={{ fontSize: 12, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 8 }}>Flight</div>
                        {booking.flightId ? (
                          <a href={`/flight/${booking.flightId}`} target="_blank" rel="noreferrer" style={{ color: '#D4AF37', fontSize: 20, fontWeight: 900, textDecoration: 'none' }}>
                            View Flight #{booking.flightId}
                          </a>
                        ) : (
                          <div style={{ color: '#9ca3af' }}>—</div>
                        )}
                      </div>

                      <div style={{ flex: '1 1 200px' }}>
                        <div style={{ fontSize: 12, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 8 }}>Booked On</div>
                        <div style={{ fontWeight: 700 }}>{formatDate(booking.createdAt)}</div>
                      </div>

                      <div style={{ flex: '1 1 220px' }}>
                        <div style={{ fontSize: 12, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 8 }}>Seats</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                          {Array.isArray(booking.seatNumbers) && booking.seatNumbers.length > 0 ? (
                            booking.seatNumbers.map((seat, idx) => (
                              <div key={idx} style={{ padding: '6px 12px', background: 'rgba(212,175,55,0.08)', color: '#fff', fontWeight: 800, borderRadius: 8, border: '1px solid rgba(212,175,55,0.12)' }}>{seat}</div>
                            ))
                          ) : (
                            <div style={{ color: '#9ca3af' }}>—</div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ height: 1, background: 'rgba(255,255,255,0.04)', margin: '18px 0' }} />

                    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                      <div style={{ flex: '1 1 320px' }}>
                        <div style={{ fontSize: 12, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 8 }}>Primary Passenger</div>
                        {booking.passengerName ? (
                          <div>
                            <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 6 }}>{booking.passengerName}</div>
                            <div style={{ color: '#9ca3af', fontSize: 14 }}>
                              <div>📧 {booking.passengerEmail || '—'}</div>
                              <div>📱 {booking.passengerPhone || '—'}</div>
                            </div>
                          </div>
                        ) : (
                          <div style={{ color: '#9ca3af' }}>—</div>
                        )}
                      </div>

                      <div style={{ flex: '0 0 auto' }}>
                        <div style={{ fontSize: 12, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 8 }}>Total Amount</div>
                        <div style={{ fontSize: 36, fontWeight: 900, color: '#D4AF37' }}>{formatAmount(booking.totalAmount)}</div>
                      </div>
                    </div>

                    {Array.isArray(booking.additionalPassengers) && booking.additionalPassengers.length > 0 && (
                      <div style={{ marginTop: 18 }}>
                        <div style={{ height: 1, background: 'rgba(255,255,255,0.04)', margin: '18px 0' }} />
                        <div style={{ fontSize: 12, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 12 }}>Additional Passengers</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
                          {booking.additionalPassengers.map((passenger, idx) => (
                            <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 10, padding: 12 }}>
                              <div style={{ fontWeight: 800, color: '#fff', marginBottom: 6 }}>{passenger.fullName || passenger.name || 'Unnamed'}</div>
                              <div style={{ color: '#9ca3af', fontSize: 13 }}>
                                <div>Age: {passenger.age || '—'}</div>
                                <div className="capitalize">Meal: {passenger.mealPreference || '—'}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
