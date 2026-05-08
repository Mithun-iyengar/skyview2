import React, { useEffect, useState } from 'react'

/**
 * SeatClassConfiguration Component
 * Allows admin to configure Economy and Business class seating
 * Auto-generates seat numbers based on configuration
 */
export default function SeatClassConfiguration({ seatClasses, onChange, pricing = {} }) {
  const [expandedClass, setExpandedClass] = useState('ECONOMY')
  const [localConfig, setLocalConfig] = useState(
    seatClasses || [
      {
        classType: 'ECONOMY',
        className: 'Economy',
        rows: 10,
        columnsPerRow: 6,
        pricePerSeat: 0,
        totalSeats: 60,
        previewSeats: []
      },
      {
        classType: 'BUSINESS',
        className: 'Business',
        rows: 4,
        columnsPerRow: 2,
        pricePerSeat: 0,
        totalSeats: 8,
        previewSeats: []
      }
    ]
  )

  useEffect(() => {
    if (Array.isArray(seatClasses) && seatClasses.length > 0) {
      setLocalConfig(seatClasses)
    }
  }, [seatClasses])

  const formatCurrency = (amount) => `₹ ${Number(amount || 0).toLocaleString('en-IN')}`

  const generateSeatPreview = (rows, columns, classType) => {
    const seats = []
    const columns_arr = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K']
    const prefix = classType === 'ECONOMY' ? 'E' : 'B'

    for (let row = 1; row <= rows; row++) {
      for (let col = 0; col < columns && col < columns_arr.length; col++) {
        seats.push(`${prefix}${row}${columns_arr[col]}`)
      }
    }
    return seats
  }

  const getClassPrice = (classType) => {
    return classType === 'ECONOMY' ? pricing.economy : pricing.business
  }

  const handleClassChange = (classType, field, value) => {
    const updatedConfig = localConfig.map((config) => {
      if (config.classType === classType) {
        const updated = {
          ...config,
          [field]: field === 'className' ? value : parseInt(value, 10)
        }

        const rows = field === 'rows' ? parseInt(value, 10) : config.rows
        const columns = field === 'columnsPerRow' ? parseInt(value, 10) : config.columnsPerRow
        updated.totalSeats = Number.isFinite(rows) && Number.isFinite(columns) ? rows * columns : 0
        updated.previewSeats = Number.isFinite(rows) && Number.isFinite(columns)
          ? generateSeatPreview(rows, columns, classType)
          : []
        
        return updated
      }
      return config
    })

    setLocalConfig(updatedConfig)
    onChange(updatedConfig)
  }

  return (
    <div className="seat-class-config">
      <h3 className="admin-card-title">
        <i className="bi bi-airplane-engines"></i> Seating Classes & Pricing
      </h3>
      <p className="seat-config-description">
        Configure Economy and Business class details. Seats are auto-generated based on layout.
      </p>

      <div className="seat-class-tabs">
        {localConfig.map((config) => (
          <button
            key={config.classType}
            className={`seat-class-tab ${expandedClass === config.classType ? 'active' : ''}`}
            type="button"
            onClick={() => setExpandedClass(config.classType)}
          >
            <span className={`tab-icon ${config.classType.toLowerCase()}`}>
              {config.classType === 'ECONOMY' ? '✈️' : '💼'}
            </span>
            {config.className} ({config.totalSeats} seats)
          </button>
        ))}
      </div>

      {localConfig.map((config) => (
        expandedClass === config.classType && (
          <div key={config.classType} className="seat-class-panel">
            <div className="row g-4 align-items-start">
              <div className="col-12 col-lg-6">
                <div className="form-row">
                  <div className="form-group">
                    <label>Class Name</label>
                    <input
                      type="text"
                      value={config.className}
                      onChange={(e) => handleClassChange(config.classType, 'className', e.target.value)}
                      placeholder="e.g., Economy, Premium Economy, Business"
                      className="auth-control"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Number of Rows</label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={config.rows}
                      onChange={(e) => handleClassChange(config.classType, 'rows', e.target.value)}
                      className="auth-control"
                    />
                    <small>Number of seat rows in {config.className} class</small>
                  </div>

                  <div className="form-group">
                    <label>Seats per Row</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={config.columnsPerRow}
                      onChange={(e) => handleClassChange(config.classType, 'columnsPerRow', e.target.value)}
                      className="auth-control"
                    />
                    <small>Number of seats per row</small>
                  </div>
                </div>

                <div className={`pricing-summary-badge ${config.classType.toLowerCase()}`}>
                  <span className="label">Price per Seat</span>
                  <strong>{formatCurrency(getClassPrice(config.classType))}</strong>
                </div>
              </div>

              <div className="col-12 col-lg-6">
                <div className="seat-summary">
                  <div className="summary-item">
                    <span>Total Seats:</span>
                    <strong>{config.totalSeats}</strong>
                  </div>
                  <div className="summary-item">
                    <span>Rows × Columns:</span>
                    <strong>{config.rows} × {config.columnsPerRow}</strong>
                  </div>
                  <div className="summary-item highlight">
                    <span>Total Revenue (if full):</span>
                    <strong>{formatCurrency(config.totalSeats * (getClassPrice(config.classType) || 0))}</strong>
                  </div>
                </div>

                <div className="seat-preview">
                  <h4>Seat Layout Preview ({config.classType})</h4>
                  <div className="seat-grid">
                    {config.previewSeats.length > 0 ? (
                      config.previewSeats.map((seat, index) => (
                        <div key={index} className={`seat-item ${config.classType.toLowerCase()}`}>
                          {seat}
                        </div>
                      ))
                    ) : (
                      <p className="no-seats">Configure rows and columns above</p>
                    )}
                  </div>
                  <small className="seat-preview-note">
                    Seats are auto-generated by row and column (e.g., E1A, E1B, B1A, B1B)
                  </small>
                </div>
              </div>
            </div>
          </div>
        )
      ))}
    </div>
  )
}
