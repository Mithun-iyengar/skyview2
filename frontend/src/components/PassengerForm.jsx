import React, { useState } from 'react'

export default function PassengerForm({ flight, selectedSeats, onBack, onNext, isLoading = false }) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    age: '',
    aadhaarNumber: '',
    passportNumber: '',
    mealPreference: 'standard',
    wheelchairAssistance: false
  })
  const [additionalPassengers, setAdditionalPassengers] = useState(
    Array.from({ length: Math.max((selectedSeats?.length || 0) - 1, 0) }, () => ({
      fullName: '',
      age: '',
      email: '',
      phone: '',
      passportNumber: '',
      mealPreference: 'standard'
    }))
  )
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleAdditionalPassengerChange = (index, field, value) => {
    setAdditionalPassengers((prev) =>
      prev.map((passenger, passengerIndex) =>
        passengerIndex === index ? { ...passenger, [field]: value } : passenger
      )
    )

    const errorKey = `additionalPassengers.${index}.${field}`
    if (errors[errorKey]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[errorKey]
        return newErrors
      })
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    // Validate that number of passengers matches number of selected seats
    const requiredPassengers = selectedSeats?.length || 0
    const providedPassengers = 1 + (additionalPassengers?.filter(p => p.fullName?.trim()).length || 0)
    
    if (providedPassengers < requiredPassengers) {
      newErrors.seatsPassengers = `You have selected ${requiredPassengers} seat(s) but only provided ${providedPassengers} passenger(s). Please add ${requiredPassengers - providedPassengers} more passenger(s).`
    }
    
    if (!formData.fullName.trim() || formData.fullName.trim().length < 3) {
      newErrors.fullName = 'Full name must be at least 3 characters'
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.email.trim() || !emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    
    const phoneRegex = /^[0-9]{10}$/
    if (!formData.phone.trim() || !phoneRegex.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Phone must be 10 digits'
    }
    
    const ageNum = parseInt(formData.age)
    if (!formData.age || isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
      newErrors.age = 'Valid age between 1 and 120 is required'
    }
    
    const aadhaarRegex = /^[0-9]{12}$/
    if (!formData.aadhaarNumber.trim() || !aadhaarRegex.test(formData.aadhaarNumber.replace(/\D/g, ''))) {
      newErrors.aadhaarNumber = 'Aadhaar must be 12 digits'
    }

    const passportRegex = /^[A-Za-z0-9]{6,20}$/
    if (formData.passportNumber.trim() && !passportRegex.test(formData.passportNumber.trim())) {
      newErrors.passportNumber = 'Passport number must be 6 to 20 alphanumeric characters'
    }

    additionalPassengers.forEach((passenger, index) => {
      const nameKey = `additionalPassengers.${index}.fullName`
      const ageKey = `additionalPassengers.${index}.age`
      const emailKey = `additionalPassengers.${index}.email`
      const phoneKey = `additionalPassengers.${index}.phone`
      const passportKey = `additionalPassengers.${index}.passportNumber`

      if (!passenger.fullName.trim() || passenger.fullName.trim().length < 3) {
        newErrors[nameKey] = 'Name must be at least 3 characters'
      }

      const passengerAge = parseInt(passenger.age)
      if (!passenger.age || isNaN(passengerAge) || passengerAge < 1 || passengerAge > 120) {
        newErrors[ageKey] = 'Valid age between 1 and 120 is required'
      }

      const passengerEmail = passenger.email.trim()
      if (passengerEmail && !emailRegex.test(passengerEmail)) {
        newErrors[emailKey] = 'Please enter a valid email address'
      }

      const passengerPhone = passenger.phone.trim()
      if (passengerPhone && !phoneRegex.test(passengerPhone.replace(/\D/g, ''))) {
        newErrors[phoneKey] = 'Phone must be 10 digits'
      }

      const passengerPassport = passenger.passportNumber.trim()
      if (passengerPassport && !passportRegex.test(passengerPassport)) {
        newErrors[passportKey] = 'Passport number must be 6 to 20 alphanumeric characters'
      }
    })

    validateDuplicatePassengers(newErrors)
    
    // Check for duplicate passenger names within the booking
    const normalizedPrimaryName = (formData.fullName || '').trim().toLowerCase()
    const additionalNames = additionalPassengers
      .filter(p => p.fullName?.trim())
      .map(p => p.fullName.trim().toLowerCase())
    
    if (additionalNames.includes(normalizedPrimaryName)) {
      newErrors.bookingPassengerName = '❌ Primary passenger name cannot be the same as any additional passengers. Each passenger must have a unique name.'
    }
    
    // Check for duplicate names among additional passengers
    const nameSet = new Set()
    additionalPassengers.forEach((passenger, index) => {
      const normalizedName = (passenger.fullName || '').trim().toLowerCase()
      if (!normalizedName) return
      
      if (nameSet.has(normalizedName)) {
        newErrors[`additionalPassengers.${index}.fullName`] = 'Duplicate name found. Each passenger must have a unique name.'
      } else {
        nameSet.add(normalizedName)
      }
    })
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateDuplicatePassengers = (newErrors) => {
    const normalized = (value) => value?.trim().toLowerCase() || ''
    
    // Separate sets for each identifier type to detect duplicates per type
    const emailMap = new Map()      // email -> [errorKeys]
    const phoneMap = new Map()      // phone -> [errorKeys]
    const aadhaarMap = new Map()    // aadhaar -> [errorKeys]
    const passportMap = new Map()   // passport -> [errorKeys]

    const registerIdentifier = (map, normalizedValue, errorKey, type) => {
      if (!normalizedValue) return // Skip empty values
      
      if (!map.has(normalizedValue)) {
        map.set(normalizedValue, [])
      }
      map.get(normalizedValue).push({ errorKey, type })
    }

    // Register primary passenger identifiers
    registerIdentifier(emailMap, normalized(formData.email), 'email', 'email')
    registerIdentifier(phoneMap, normalized(formData.phone), 'phone', 'phone')
    registerIdentifier(aadhaarMap, normalized(formData.aadhaarNumber), 'aadhaarNumber', 'aadhaar')
    registerIdentifier(passportMap, normalized(formData.passportNumber), 'passportNumber', 'passport')

    // Register additional passengers' identifiers
    additionalPassengers.forEach((passenger, index) => {
      registerIdentifier(
        emailMap,
        normalized(passenger.email),
        `additionalPassengers.${index}.email`,
        'email'
      )
      registerIdentifier(
        phoneMap,
        normalized(passenger.phone),
        `additionalPassengers.${index}.phone`,
        'phone'
      )
      registerIdentifier(
        aadhaarMap,
        normalized(passenger.aadhaarNumber),
        `additionalPassengers.${index}.aadhaarNumber`,
        'aadhaar'
      )
      registerIdentifier(
        passportMap,
        normalized(passenger.passportNumber),
        `additionalPassengers.${index}.passportNumber`,
        'passport'
      )
    })

    // Check for duplicates in each identifier type
    let duplicateFound = false
    const processDuplicates = (map, identifierType) => {
      map.forEach((entries, normalizedValue) => {
        if (entries.length > 1) {
          duplicateFound = true
          entries.forEach(({ errorKey, type }) => {
            newErrors[errorKey] = `Duplicate ${type} address across passengers`
          })
        }
      })
    }

    processDuplicates(emailMap, 'email')
    processDuplicates(phoneMap, 'phone')
    processDuplicates(aadhaarMap, 'aadhaar')
    processDuplicates(passportMap, 'passport')

    if (duplicateFound) {
      newErrors.bookingDuplicate = 
        '⚠️ Duplicate passenger details detected. Each passenger must have unique Aadhaar, Passport, Email, and Phone numbers within the same booking.'
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validateForm()) {
      onNext({
        ...formData,
        additionalPassengers
      })
    } else {
      // Scroll to top to show errors
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const calculateTotalPrice = () => {
    if (!flight || !flight.seatClasses) return 0
    
    let total = 0
    selectedSeats.forEach(seatNumber => {
      const matchingClass = flight.seatClasses.find(sc => {
        const prefix = sc.classType === 'ECONOMY' ? 'E' : 'B'
        return seatNumber.startsWith(prefix)
      })
      if (matchingClass) {
        total += Number(matchingClass.pricePerSeat || 0)
      }
    })
    return total
  }

  return (
    <div className="passenger-form-container" style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
      <div className="form-header" style={{ 
        background: 'linear-gradient(135deg, #1F4DA0 0%, #2D63C4 100%)',
        padding: '40px',
        borderRadius: '16px',
        color: 'white',
        marginBottom: '40px',
        boxShadow: '0 8px 32px rgba(31, 77, 160, 0.25)'
      }}>
        <h2 style={{ margin: '0 0 28px 0', fontSize: '2rem', fontWeight: '700' }}>✈️ Passenger Information</h2>
      </div>
      {errors.bookingDuplicate && (
        <div style={{
          marginBottom: '20px',
          padding: '18px 22px',
          background: '#ffe6e6',
          border: '1px solid #ffb3b3',
          color: '#a12a2a',
          borderRadius: '12px'
        }}>
          {errors.bookingDuplicate}
        </div>
      )}
      {errors.seatsPassengers && (
        <div style={{
          marginBottom: '20px',
          padding: '18px 22px',
          background: '#fff3cd',
          border: '1px solid #ffc107',
          color: '#856404',
          borderRadius: '12px',
          fontWeight: '600'
        }}>
          ⚠️ {errors.seatsPassengers}
        </div>
      )}
      {errors.bookingPassengerName && (
        <div style={{
          marginBottom: '20px',
          padding: '18px 22px',
          background: '#ffe6e6',
          border: '1px solid #ffb3b3',
          color: '#a12a2a',
          borderRadius: '12px',
          fontWeight: '600'
        }}>
          {errors.bookingPassengerName}
        </div>
      )}
        
        <div className="booking-summary" style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px'
        }}>
          <div className="summary-row" style={{
            background: 'rgba(255, 255, 255, 0.15)',
            padding: '18px 20px',
            borderRadius: '12px',
            backdropFilter: 'blur(10px)',
            border: '1.5px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}>
            <span className="summary-label" style={{ display: 'block', fontSize: '0.8rem', color: '#0a0f1f', fontWeight: '700', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.95 }}>Flight Number</span>
            <span className="summary-value" style={{ fontSize: '1.6rem', fontWeight: '700', color: '#0a0f1f', textShadow: '0 2px 8px rgba(255,255,255,0.0)' }}>{flight?.flightNumber}</span>
          </div>
          <div className="summary-row" style={{
            background: 'rgba(212, 175, 55, 0.15)',
            padding: '18px 20px',
            borderRadius: '12px',
            backdropFilter: 'blur(10px)',
            border: '1.5px solid rgba(212, 175, 55, 0.4)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}>
            <span className="summary-label" style={{ display: 'block', fontSize: '0.8rem', color: '#0a0f1f', fontWeight: '700', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.95 }}>Route</span>
            <span className="summary-value" style={{ fontSize: '1.4rem', fontWeight: '700', color: '#0a0f1f', textShadow: '0 2px 8px rgba(255,255,255,0.0)' }}>{flight?.sourceAirport} → {flight?.destinationAirport}</span>
          </div>
          <div className="summary-row" style={{
            background: 'rgba(31, 77, 160, 0.55)',
            padding: '22px 20px',
            borderRadius: '12px',
            backdropFilter: 'blur(10px)',
            border: '2.5px solid rgba(255, 215, 0, 0.85)',
            boxShadow: '0 12px 40px rgba(255, 215, 0, 0.4), inset 0 0 25px rgba(255, 255, 255, 0.15)'
          }}>
            <span className="summary-label" style={{ display: 'block', fontSize: '0.75rem', color: '#0a0f1f', fontWeight: '700', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 1 }}>Selected Seats</span>
            <span className="summary-value seat-list" style={{ fontSize: '1.8rem', fontWeight: '900', color: '#FFFACD', textShadow: '0 4px 12px rgba(0,0,0,0.7), 0 0 8px rgba(255,215,0,0.4)' }}>{selectedSeats.join(', ')}</span>
          </div>
          <div className="summary-row highlight" style={{
            background: 'rgba(255, 215, 0, 0.2)',
            padding: '18px 20px',
            borderRadius: '12px',
            backdropFilter: 'blur(10px)',
            border: '2px solid rgba(255, 215, 0, 0.6)',
            boxShadow: '0 8px 32px rgba(255, 215, 0, 0.15)'
          }}>
            <span className="summary-label" style={{ display: 'block', fontSize: '0.8rem', color: '#0a0f1f', fontWeight: '700', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.95 }}>Total Price</span>
            <span className="summary-value price-highlight" style={{ fontSize: '1.8rem', fontWeight: '700', color: '#0a0f1f', textShadow: '0 2px 8px rgba(255,255,255,0.0)' }}>₹{calculateTotalPrice().toLocaleString('en-IN')}</span>
          </div>
        </div>

      <form onSubmit={handleSubmit} className="passenger-form">
        {/* PRIMARY PASSENGER SECTION */}
        <div className="form-section" style={{
          background: 'white',
          padding: '36px',
          borderRadius: '14px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          marginBottom: '28px',
          border: '1px solid #f0f0f0'
        }}>
          <h3 style={{
            color: '#1F4DA0',
            fontSize: '1.4rem',
            fontWeight: '700',
            marginBottom: '28px',
            paddingBottom: '16px',
            borderBottom: '2px solid #D4AF37'
          }}>👤 Primary Passenger Details</h3>

          <div className="form-group">
            <label htmlFor="fullName" style={{
              display: 'block',
              fontSize: '0.95rem',
              fontWeight: '600',
              color: '#333',
              marginBottom: '10px'
            }}>Full Name <span className="required" style={{ color: '#e74c3c' }}>*</span></label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Enter your full name"
              className={errors.fullName ? 'input-error' : ''}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '14px 16px',
                border: errors.fullName ? '2px solid #e74c3c' : '2px solid #ddd',
                borderRadius: '10px',
                fontSize: '1rem',
                transition: 'all 0.3s ease',
                fontFamily: 'inherit'
              }}
            />
            {errors.fullName && <span className="error-message" style={{
              color: '#e74c3c',
              fontSize: '0.85rem',
              marginTop: '6px',
              display: 'block'
            }}>{errors.fullName}</span>}
          </div>

          <div className="form-row" style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '24px',
            marginTop: '20px'
          }}>
            <div className="form-group">
              <label htmlFor="email" style={{
                display: 'block',
                fontSize: '0.95rem',
                fontWeight: '600',
                color: '#333',
                marginBottom: '10px'
              }}>Email Address <span className="required" style={{ color: '#e74c3c' }}>*</span></label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your.email@example.com"
                className={errors.email ? 'input-error' : ''}
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: errors.email ? '2px solid #e74c3c' : '2px solid #ddd',
                  borderRadius: '10px',
                  fontSize: '1rem',
                  transition: 'all 0.3s ease',
                  fontFamily: 'inherit'
                }}
              />
              {errors.email && <span className="error-message" style={{
                color: '#e74c3c',
                fontSize: '0.85rem',
                marginTop: '6px',
                display: 'block'
              }}>{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="phone" style={{
                display: 'block',
                fontSize: '0.95rem',
                fontWeight: '600',
                color: '#333',
                marginBottom: '10px'
              }}>Phone Number <span className="required" style={{ color: '#e74c3c' }}>*</span></label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="10-digit phone number"
                className={errors.phone ? 'input-error' : ''}
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: errors.phone ? '2px solid #e74c3c' : '2px solid #ddd',
                  borderRadius: '10px',
                  fontSize: '1rem',
                  transition: 'all 0.3s ease',
                  fontFamily: 'inherit'
                }}
              />
              {errors.phone && <span className="error-message" style={{
                color: '#e74c3c',
                fontSize: '0.85rem',
                marginTop: '6px',
                display: 'block'
              }}>{errors.phone}</span>}
            </div>
          </div>

          <div className="form-row" style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '24px',
            marginTop: '20px'
          }}>
            <div className="form-group">
              <label htmlFor="age" style={{
                display: 'block',
                fontSize: '0.95rem',
                fontWeight: '600',
                color: '#333',
                marginBottom: '10px'
              }}>Age <span className="required" style={{ color: '#e74c3c' }}>*</span></label>
              <input
                type="number"
                id="age"
                name="age"
                value={formData.age}
                onChange={handleChange}
                placeholder="Age"
                min="1"
                max="120"
                className={errors.age ? 'input-error' : ''}
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: errors.age ? '2px solid #e74c3c' : '2px solid #ddd',
                  borderRadius: '10px',
                  fontSize: '1rem',
                  transition: 'all 0.3s ease',
                  fontFamily: 'inherit'
                }}
              />
              {errors.age && <span className="error-message" style={{
                color: '#e74c3c',
                fontSize: '0.85rem',
                marginTop: '6px',
                display: 'block'
              }}>{errors.age}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="aadhaarNumber" style={{
                display: 'block',
                fontSize: '0.95rem',
                fontWeight: '600',
                color: '#333',
                marginBottom: '10px'
              }}>Aadhaar Number <span className="required" style={{ color: '#e74c3c' }}>*</span></label>
              <input
                type="text"
                id="aadhaarNumber"
                name="aadhaarNumber"
                value={formData.aadhaarNumber}
                onChange={handleChange}
                placeholder="12-digit Aadhaar number"
                maxLength="12"
                className={errors.aadhaarNumber ? 'input-error' : ''}
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: errors.aadhaarNumber ? '2px solid #e74c3c' : '2px solid #ddd',
                  borderRadius: '10px',
                  fontSize: '1rem',
                  transition: 'all 0.3s ease',
                  fontFamily: 'inherit'
                }}
              />
              {errors.aadhaarNumber && <span className="error-message" style={{
                color: '#e74c3c',
                fontSize: '0.85rem',
                marginTop: '6px',
                display: 'block'
              }}>{errors.aadhaarNumber}</span>}
            </div>
          </div>

          <div className="form-row" style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '24px',
            marginTop: '20px'
          }}>
            <div className="form-group">
              <label htmlFor="passportNumber" style={{
                display: 'block',
                fontSize: '0.95rem',
                fontWeight: '600',
                color: '#333',
                marginBottom: '10px'
              }}>Passport Number <span style={{ color: '#666', fontWeight: '500' }}>(Optional)</span></label>
              <input
                type="text"
                id="passportNumber"
                name="passportNumber"
                value={formData.passportNumber}
                onChange={handleChange}
                placeholder="Passport number"
                className={errors.passportNumber ? 'input-error' : ''}
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: errors.passportNumber ? '2px solid #e74c3c' : '2px solid #ddd',
                  borderRadius: '10px',
                  fontSize: '1rem',
                  transition: 'all 0.3s ease',
                  fontFamily: 'inherit'
                }}
              />
              {errors.passportNumber && <span className="error-message" style={{
                color: '#e74c3c',
                fontSize: '0.85rem',
                marginTop: '6px',
                display: 'block'
              }}>{errors.passportNumber}</span>}
            </div>
          </div>

          {/* Preferences */}
          <div style={{ marginTop: '28px', paddingTop: '28px', borderTop: '1px solid #f0f0f0' }}>
            <h4 style={{
              color: '#1F4DA0',
              fontSize: '1.1rem',
              fontWeight: '700',
              marginBottom: '20px'
            }}>🍽️ Preferences</h4>

            <div className="form-group">
              <label htmlFor="mealPreference" style={{
                display: 'block',
                fontSize: '0.95rem',
                fontWeight: '600',
                color: '#333',
                marginBottom: '10px'
              }}>Meal Preference</label>
              <select
                id="mealPreference"
                name="mealPreference"
                value={formData.mealPreference}
                onChange={handleChange}
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '2px solid #ddd',
                  borderRadius: '10px',
                  fontSize: '1rem',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  fontFamily: 'inherit'
                }}
              >
                <option value="standard">Standard Meal</option>
                <option value="vegetarian">Vegetarian</option>
                <option value="vegan">Vegan</option>
                <option value="gluten-free">Gluten Free</option>
                <option value="halal">Halal</option>
                <option value="kosher">Kosher</option>
              </select>
            </div>

            <div className="form-group checkbox-group" style={{ marginTop: '16px' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                fontSize: '0.95rem',
                color: '#333'
              }}>
                <input
                  type="checkbox"
                  name="wheelchairAssistance"
                  checked={formData.wheelchairAssistance}
                  onChange={handleChange}
                  disabled={isLoading}
                  style={{
                    width: '18px',
                    height: '18px',
                    cursor: 'pointer',
                    marginRight: '10px'
                  }}
                />
                <span>I require wheelchair assistance</span>
              </label>
            </div>
          </div>
        </div>

        {/* ADDITIONAL PASSENGERS SECTION */}
        {additionalPassengers.length > 0 && (
          <div style={{ marginBottom: '28px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
              padding: '28px',
              borderRadius: '14px',
              border: '2px solid #D4AF37',
              marginBottom: '20px'
            }}>
              <h3 style={{
                color: '#1F4DA0',
                fontSize: '1.3rem',
                fontWeight: '700',
                margin: '0 0 10px 0'
              }}>👥 Co-Passengers</h3>
              <p style={{
                margin: '0',
                color: '#666',
                fontSize: '0.9rem'
              }}>
                For each co-passenger, <strong>Name</strong> and <strong>Age</strong> are required. Email, phone number, and passport number are optional.
              </p>
            </div>

            {additionalPassengers.map((passenger, index) => {
              const nameErrorKey = `additionalPassengers.${index}.fullName`
              const ageErrorKey = `additionalPassengers.${index}.age`
              const emailErrorKey = `additionalPassengers.${index}.email`
              const phoneErrorKey = `additionalPassengers.${index}.phone`
              const passportErrorKey = `additionalPassengers.${index}.passportNumber`

              return (
                <div key={index} className="form-section" style={{
                  background: 'white',
                  padding: '28px',
                  borderRadius: '14px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  marginBottom: '20px',
                  border: '1px solid #e8e8e8',
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    background: '#D4AF37',
                    color: 'white',
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    fontWeight: '700'
                  }}>
                    {index + 2}
                  </div>
                  <h4 style={{
                    color: '#1F4DA0',
                    fontSize: '1.1rem',
                    fontWeight: '700',
                    marginBottom: '20px',
                    marginTop: '0'
                  }}>Passenger {index + 2}</h4>

                  <div className="form-row" style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '20px'
                  }}>
                    <div className="form-group">
                      <label htmlFor={`additional-fullName-${index}`} style={{
                        display: 'block',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        color: '#333',
                        marginBottom: '8px'
                      }}>Full Name <span className="required" style={{ color: '#e74c3c' }}>*</span></label>
                      <input
                        type="text"
                        id={`additional-fullName-${index}`}
                        value={passenger.fullName}
                        onChange={(e) => handleAdditionalPassengerChange(index, 'fullName', e.target.value)}
                        placeholder="Enter passenger full name"
                        className={errors[nameErrorKey] ? 'input-error' : ''}
                        disabled={isLoading}
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          border: errors[nameErrorKey] ? '2px solid #e74c3c' : '2px solid #ddd',
                          borderRadius: '8px',
                          fontSize: '0.95rem',
                          transition: 'all 0.3s ease',
                          fontFamily: 'inherit'
                        }}
                      />
                      {errors[nameErrorKey] && <span className="error-message" style={{
                        color: '#e74c3c',
                        fontSize: '0.8rem',
                        marginTop: '4px',
                        display: 'block'
                      }}>{errors[nameErrorKey]}</span>}
                    </div>

                    <div className="form-group">
                      <label htmlFor={`additional-age-${index}`} style={{
                        display: 'block',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        color: '#333',
                        marginBottom: '8px'
                      }}>Age <span className="required" style={{ color: '#e74c3c' }}>*</span></label>
                      <input
                        type="number"
                        id={`additional-age-${index}`}
                        value={passenger.age}
                        onChange={(e) => handleAdditionalPassengerChange(index, 'age', e.target.value)}
                        placeholder="Age"
                        min="1"
                        max="120"
                        className={errors[ageErrorKey] ? 'input-error' : ''}
                        disabled={isLoading}
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          border: errors[ageErrorKey] ? '2px solid #e74c3c' : '2px solid #ddd',
                          borderRadius: '8px',
                          fontSize: '0.95rem',
                          transition: 'all 0.3s ease',
                          fontFamily: 'inherit'
                        }}
                      />
                      {errors[ageErrorKey] && <span className="error-message" style={{
                        color: '#e74c3c',
                        fontSize: '0.8rem',
                        marginTop: '4px',
                        display: 'block'
                      }}>{errors[ageErrorKey]}</span>}
                    </div>
                  </div>

                  <div className="form-row" style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '20px',
                    marginTop: '16px'
                  }}>
                    <div className="form-group">
                      <label htmlFor={`additional-email-${index}`} style={{
                        display: 'block',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        color: '#666',
                        marginBottom: '8px'
                      }}>Email Address (Optional)</label>
                      <input
                        type="email"
                        id={`additional-email-${index}`}
                        value={passenger.email}
                        onChange={(e) => handleAdditionalPassengerChange(index, 'email', e.target.value)}
                        placeholder="passenger.email@example.com"
                        className={errors[emailErrorKey] ? 'input-error' : ''}
                        disabled={isLoading}
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          border: errors[emailErrorKey] ? '2px solid #e74c3c' : '2px solid #ddd',
                          borderRadius: '8px',
                          fontSize: '0.95rem',
                          transition: 'all 0.3s ease',
                          fontFamily: 'inherit'
                        }}
                      />
                      {errors[emailErrorKey] && <span className="error-message" style={{
                        color: '#e74c3c',
                        fontSize: '0.8rem',
                        marginTop: '4px',
                        display: 'block'
                      }}>{errors[emailErrorKey]}</span>}
                    </div>

                    <div className="form-group">
                      <label htmlFor={`additional-phone-${index}`} style={{
                        display: 'block',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        color: '#666',
                        marginBottom: '8px'
                      }}>Phone Number (Optional)</label>
                      <input
                        type="tel"
                        id={`additional-phone-${index}`}
                        value={passenger.phone}
                        onChange={(e) => handleAdditionalPassengerChange(index, 'phone', e.target.value)}
                        placeholder="10-digit phone number"
                        className={errors[phoneErrorKey] ? 'input-error' : ''}
                        disabled={isLoading}
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          border: errors[phoneErrorKey] ? '2px solid #e74c3c' : '2px solid #ddd',
                          borderRadius: '8px',
                          fontSize: '0.95rem',
                          transition: 'all 0.3s ease',
                          fontFamily: 'inherit'
                        }}
                      />
                      {errors[phoneErrorKey] && <span className="error-message" style={{
                        color: '#e74c3c',
                        fontSize: '0.8rem',
                        marginTop: '4px',
                        display: 'block'
                      }}>{errors[phoneErrorKey]}</span>}
                    </div>
                  </div>

                  <div className="form-row" style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr',
                    gap: '20px',
                    marginTop: '16px'
                  }}>
                    <div className="form-group">
                      <label htmlFor={`additional-passport-${index}`} style={{
                        display: 'block',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        color: '#666',
                        marginBottom: '8px'
                      }}>Passport Number (Optional)</label>
                      <input
                        type="text"
                        id={`additional-passport-${index}`}
                        value={passenger.passportNumber}
                        onChange={(e) => handleAdditionalPassengerChange(index, 'passportNumber', e.target.value)}
                        placeholder="Passport number"
                        className={errors[passportErrorKey] ? 'input-error' : ''}
                        disabled={isLoading}
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          border: errors[passportErrorKey] ? '2px solid #e74c3c' : '2px solid #ddd',
                          borderRadius: '8px',
                          fontSize: '0.95rem',
                          transition: 'all 0.3s ease',
                          fontFamily: 'inherit'
                        }}
                      />
                      {errors[passportErrorKey] && <span className="error-message" style={{
                        color: '#e74c3c',
                        fontSize: '0.8rem',
                        marginTop: '4px',
                        display: 'block'
                      }}>{errors[passportErrorKey]}</span>}
                    </div>
                  </div>

                  <div className="form-group" style={{ marginTop: '16px' }}>
                    <label htmlFor={`additional-mealPreference-${index}`} style={{
                      display: 'block',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      color: '#333',
                      marginBottom: '8px'
                    }}>Meal Preference</label>
                    <select
                      id={`additional-mealPreference-${index}`}
                      value={passenger.mealPreference}
                      onChange={(e) => handleAdditionalPassengerChange(index, 'mealPreference', e.target.value)}
                      disabled={isLoading}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        border: '2px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '0.95rem',
                        backgroundColor: 'white',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        fontFamily: 'inherit'
                      }}
                    >
                      <option value="standard">Standard Meal</option>
                      <option value="vegetarian">Vegetarian</option>
                      <option value="vegan">Vegan</option>
                      <option value="gluten-free">Gluten Free</option>
                      <option value="halal">Halal</option>
                      <option value="kosher">Kosher</option>
                    </select>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* FORM ACTIONS - BOTTOM */}
        <div className="form-actions" style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          marginTop: '40px',
          paddingTop: '20px',
          borderTop: '2px solid #f0f0f0'
        }}>
          <button 
            type="button" 
            onClick={onBack} 
            className="btn btn-secondary"
            disabled={isLoading}
            style={{
              padding: '16px 24px',
              fontSize: '1rem',
              fontWeight: '600',
              borderRadius: '10px',
              border: '2px solid #1F4DA0',
              background: 'white',
              color: '#1F4DA0',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              opacity: isLoading ? 0.6 : 1
            }}
            onMouseEnter={(e) => !isLoading && (e.target.style.background = '#f0f0f0')}
            onMouseLeave={(e) => (e.target.style.background = 'white')}
          >
            ← Back to Seats
          </button>
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={isLoading}
            style={{
              padding: '16px 24px',
              fontSize: '1rem',
              fontWeight: '700',
              borderRadius: '10px',
              border: 'none',
              background: isLoading ? '#bbb' : 'linear-gradient(135deg, #1F4DA0 0%, #D4AF37 100%)',
              color: 'white',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 6px 20px rgba(31, 77, 160, 0.3)',
              opacity: isLoading ? 0.7 : 1
            }}
            onMouseEnter={(e) => !isLoading && (e.target.boxShadow = '0 8px 28px rgba(31, 77, 160, 0.4)')}
          >
            {isLoading ? '⏳ Processing...' : 'Proceed to Payment →'}
          </button>
        </div>
      </form>
    </div>
  )
}