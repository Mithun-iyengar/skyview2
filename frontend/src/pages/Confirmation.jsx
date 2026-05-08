import React, { useEffect, useState } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { useToast } from '../components/ToastProvider'
import '../styles/flights.css'

export default function Confirmation() {
  const { bookingId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { addToast } = useToast()
  
  const [bookingData] = useState(location.state?.bookingData || null)
  const [payment] = useState(location.state?.payment || null)
  const [confirmationTime] = useState(new Date().toLocaleString('en-IN'))

  useEffect(() => {
    if (bookingData) {
      addToast(`✓ Your booking #${bookingId} has been successfully confirmed!`, 'success', 5000)
    } else {
      // If no booking data in state, redirect after a delay
      setTimeout(() => navigate('/flights'), 3000)
    }
  }, [bookingId, bookingData, navigate, addToast])

  if (!bookingData) {
    return (
      <section className="page confirmation container">
        <div className="loading-message">
          <div className="spinner"></div>
          <p>Loading confirmation details...</p>
        </div>
      </section>
    )
  }

  return (
    <section className="page confirmation container">
      <div className="confirmation-container" style={{ maxWidth: '700px', margin: '40px auto' }}>
        
        {/* Success Header */}
        <div className="confirmation-header" style={{ textAlign: 'center', marginBottom: '40px', padding: '40px', background: 'linear-gradient(135deg, #1F4DA0 0%, #D4AF37 100%)', borderRadius: '12px', color: 'white' }}>
          <div style={{ fontSize: '3rem', marginBottom: '15px' }}>✓</div>
          <h1 style={{ margin: '0 0 10px 0', fontSize: '2rem' }}>Booking Confirmed!</h1>
          <p style={{ margin: '10px 0 0 0', opacity: 0.9, fontSize: '1.1rem' }}>Your flight booking is now confirmed</p>
        </div>

        {/* Booking Details Card */}
        <div className="confirmation-card" style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
          
          <div style={{ marginBottom: '25px', paddingBottom: '25px', borderBottom: '2px solid #f0f0f0' }}>
            <h3 style={{ color: '#1F4DA0', marginBottom: '15px', fontSize: '1.2rem' }}>Booking Reference</h3>
            <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px', border: '2px dashed #D4AF37' }}>
              <p style={{ margin: 0, color: '#999', fontSize: '0.9rem', marginBottom: '8px' }}>Booking ID</p>
              <p style={{ margin: 0, color: '#1F4DA0', fontSize: '1.8rem', fontWeight: '700', fontFamily: 'monospace' }}>#{bookingId}</p>
            </div>
            <p style={{ margin: '15px 0 0 0', color: '#666', fontSize: '0.9rem' }}>Confirmed on: {confirmationTime}</p>
          </div>

          <div style={{ marginBottom: '25px', paddingBottom: '25px', borderBottom: '2px solid #f0f0f0' }}>
            <h3 style={{ color: '#1F4DA0', marginBottom: '15px', fontSize: '1.2rem' }}>Passenger Details</h3>
            <div style={{ display: 'grid', gap: '12px' }}>
              <div>
                <p style={{ margin: '0 0 5px 0', color: '#999', fontSize: '0.9rem', fontWeight: '600' }}>Name</p>
                <p style={{ margin: 0, color: '#333', fontSize: '1.1rem' }}>{bookingData.passengerName}</p>
              </div>
              <div>
                <p style={{ margin: '0 0 5px 0', color: '#999', fontSize: '0.9rem', fontWeight: '600' }}>Email</p>
                <p style={{ margin: 0, color: '#333', fontSize: '1rem' }}>{bookingData.passengerEmail}</p>
              </div>
              <div>
                <p style={{ margin: '0 0 5px 0', color: '#999', fontSize: '0.9rem', fontWeight: '600' }}>Phone</p>
                <p style={{ margin: 0, color: '#333', fontSize: '1rem' }}>{bookingData.passengerPhone}</p>
              </div>
              <div>
                <p style={{ margin: '0 0 5px 0', color: '#999', fontSize: '0.9rem', fontWeight: '600' }}>Age</p>
                <p style={{ margin: 0, color: '#333', fontSize: '1rem' }}>{bookingData.passengerAge} years old</p>
              </div>
              <div>
                <p style={{ margin: '0 0 5px 0', color: '#999', fontSize: '0.9rem', fontWeight: '600' }}>Meal Preference</p>
                <p style={{ margin: 0, color: '#333', fontSize: '1rem', textTransform: 'capitalize' }}>{bookingData.mealPreference || 'Standard'}</p>
              </div>
              {bookingData.wheelchairAssistance && (
                <div style={{ background: '#e7f3ff', padding: '10px', borderRadius: '6px', borderLeft: '4px solid #1F4DA0' }}>
                  <p style={{ margin: 0, color: '#1F4DA0', fontSize: '0.9rem', fontWeight: '600' }}>♿ Wheelchair Assistance Requested</p>
                </div>
              )}
            </div>
          </div>

          {bookingData.additionalPassengers && bookingData.additionalPassengers.length > 0 && (
            <div style={{ marginBottom: '25px', paddingBottom: '25px', borderBottom: '2px solid #f0f0f0' }}>
              <h3 style={{ color: '#1F4DA0', marginBottom: '15px', fontSize: '1.2rem' }}>Co-Passengers</h3>
              <div style={{ display: 'grid', gap: '15px' }}>
                {bookingData.additionalPassengers.map((passenger, idx) => (
                  <div key={idx} style={{ background: '#f9f9f9', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #D4AF37' }}>
                    <p style={{ margin: '0 0 10px 0', color: '#1F4DA0', fontSize: '0.95rem', fontWeight: '700' }}>Passenger {idx + 2}</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <p style={{ margin: '0 0 3px 0', color: '#999', fontSize: '0.85rem', fontWeight: '600' }}>Name</p>
                        <p style={{ margin: 0, color: '#333', fontSize: '0.95rem' }}>{passenger.fullName}</p>
                      </div>
                      <div>
                        <p style={{ margin: '0 0 3px 0', color: '#999', fontSize: '0.85rem', fontWeight: '600' }}>Age</p>
                        <p style={{ margin: 0, color: '#333', fontSize: '0.95rem' }}>{passenger.age} years old</p>
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <p style={{ margin: '0 0 3px 0', color: '#999', fontSize: '0.85rem', fontWeight: '600' }}>Meal Preference</p>
                        <p style={{ margin: 0, color: '#333', fontSize: '0.95rem', textTransform: 'capitalize' }}>{passenger.mealPreference}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginBottom: '25px', paddingBottom: '25px', borderBottom: '2px solid #f0f0f0' }}>
            <h3 style={{ color: '#1F4DA0', marginBottom: '15px', fontSize: '1.2rem' }}>Selected Seats</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {bookingData.seatNumbers.map((seat, idx) => (
                <div key={idx} style={{ background: '#1F4DA0', color: 'white', padding: '10px 16px', borderRadius: '6px', fontSize: '1rem', fontWeight: '650' }}>
                  Seat {seat}
                </div>
              ))}
            </div>
            <p style={{ margin: '15px 0 0 0', color: '#666', fontSize: '0.9rem' }}>Total Seats: {bookingData.seatNumbers.length}</p>
          </div>

          <div style={{ marginBottom: '0', paddingBottom: '0' }}>
            <h3 style={{ color: '#1F4DA0', marginBottom: '15px', fontSize: '1.2rem' }}>Payment Details</h3>
            <div style={{ background: 'linear-gradient(135deg, rgba(31, 77, 160, 0.05) 0%, rgba(212, 175, 55, 0.05) 100%)', padding: '20px', borderRadius: '8px', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#333', fontSize: '1.1rem', fontWeight: '600' }}>Total Amount Paid:</span>
                <span style={{ color: '#D4AF37', fontSize: '1.5rem', fontWeight: '700' }}>₹{bookingData.totalAmount.toLocaleString('en-IN')}</span>
              </div>
              <p style={{ margin: '12px 0 0 0', color: '#666', fontSize: '0.9rem' }}>Transaction ID: {payment?.id || 'PENDING'}</p>
            </div>
          </div>
        </div>

        {/* Important Information */}
        <div style={{ background: '#fff3cd', border: '1px solid #ffc107', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
          <h4 style={{ margin: '0 0 12px 0', color: '#856404' }}>📧 Next Steps</h4>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#856404', fontSize: '0.95rem', lineHeight: '1.6' }}>
            <li>A confirmation email has been sent to <strong>{bookingData.passengerEmail}</strong></li>
            <li>Please check your email for boarding pass and flight details</li>
            <li>Arrive at the airport <strong>2 hours before departure</strong></li>
            <li>Bring your valid identification and Aadhar card</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <button
            onClick={() => navigate('/account/reservations')}
            style={{
              background: '#f8f9fa',
              border: '2px solid #ddd',
              color: '#333',
              padding: '14px 20px',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            View My Bookings
          </button>
          
          <button
            onClick={() => navigate('/flights')}
            style={{
              background: 'linear-gradient(135deg, #1F4DA0 0%, #D4AF37 100%)',
              border: 'none',
              color: 'white',
              padding: '14px 20px',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            Book Another Flight
          </button>
        </div>

        <p style={{ textAlign: 'center', marginTop: '30px', color: '#666', fontSize: '0.9rem' }}>
          Need help? Contact our support team at <strong>support@skylineairways.com</strong> or <strong>1800-SKYLINE</strong>
        </p>
      </div>
    </section>
  )
}
