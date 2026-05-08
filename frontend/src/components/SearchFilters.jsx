import React, { useEffect, useState } from 'react'

export default function SearchFilters({ hideSortBy = false, onFiltersChange }) {
  const [filters, setFilters] = useState({
    source: '',
    destination: '',
    date: '',
    priceMin: 2000,
    priceMax: 50000,
    timeOfDay: 'all',
    sortBy: 'price-low'
  })

  useEffect(() => {
    if (typeof onFiltersChange === 'function') {
      onFiltersChange(filters)
    }
  }, [filters, onFiltersChange])

  const handleChange = (e) => {
    const { name, value } = e.target
    const nextFilters = {
      ...filters,
      [name]: name === 'priceMin' || name === 'priceMax' ? Number(value) : value
    }
    setFilters(nextFilters)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (typeof onFiltersChange === 'function') {
      onFiltersChange(filters)
    }
  }

  const airports = [
    { code: 'BOM', label: 'Mumbai' },
    { code: 'DEL', label: 'Delhi' },
    { code: 'BLR', label: 'Bangalore' },
    { code: 'GOI', label: 'Goa' },
    { code: 'JAI', label: 'Jaipur' },
    { code: 'MAA', label: 'Chennai' },
    { code: 'DXB', label: 'Dubai' },
    { code: 'SIN', label: 'Singapore' },
    { code: 'LHR', label: 'London' },
    { code: 'JFK', label: 'New York' }
  ]

  const timeOptions = [
    { value: 'all', label: 'All Day' },
    { value: 'morning', label: 'Morning (6AM - 12PM)' },
    { value: 'afternoon', label: 'Afternoon (12PM - 6PM)' },
    { value: 'evening', label: 'Evening (6PM - 12AM)' },
    { value: 'night', label: 'Night (12AM - 6AM)' }
  ]

  const sortOptions = [
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'duration', label: 'Duration: Shortest First' },
    { value: 'rating', label: 'Rating: Highest First' }
  ]

  return (
    <section className="search-filters-section">
      <div className="container">
        <h2 className="section-title">Find Your Perfect Flight</h2>
        
        <form className="search-filters-card" onSubmit={handleSearch}>
          <div className="filters-grid">
            {/* Source */}
            <div className="filter-group">
              <label htmlFor="source" className="filter-label">
                <i className="bi bi-geo-alt-fill"></i>
                From
              </label>
              <select
                id="source"
                name="source"
                value={filters.source}
                onChange={handleChange}
                className="filter-input"
              >
                <option value="">Select departure city</option>
                {airports.map(airport => (
                  <option key={airport.code} value={airport.code}>
                    {airport.label} ({airport.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Destination */}
            <div className="filter-group">
              <label htmlFor="destination" className="filter-label">
                <i className="bi bi-geo-alt-fill"></i>
                To
              </label>
              <select
                id="destination"
                name="destination"
                value={filters.destination}
                onChange={handleChange}
                className="filter-input"
              >
                <option value="">Select arrival city</option>
                {airports.map(airport => (
                  <option key={airport.code} value={airport.code}>
                    {airport.label} ({airport.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Date Picker */}
            <div className="filter-group">
              <label htmlFor="date" className="filter-label">
                <i className="bi bi-calendar-event"></i>
                Travel Date
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={filters.date}
                onChange={handleChange}
                className="filter-input"
              />
            </div>

            {/* Time of Day Filter */}
            <div className="filter-group">
              <label htmlFor="timeOfDay" className="filter-label">
                <i className="bi bi-clock"></i>
                Time
              </label>
              <select
                id="timeOfDay"
                name="timeOfDay"
                value={filters.timeOfDay}
                onChange={handleChange}
                className="filter-input"
              >
                {timeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            {!hideSortBy && (
              <div className="filter-group">
                <label htmlFor="sortBy" className="filter-label">
                  <i className="bi bi-funnel"></i>
                  Sort By
                </label>
                <select
                  id="sortBy"
                  name="sortBy"
                  value={filters.sortBy}
                  onChange={handleChange}
                  className="filter-input"
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Price Range Slider */}
          <details className="price-filter-details">
            <summary className="price-filter-summary">
              <i className="bi bi-cash-coin"></i>
              Price Range: ₹{filters.priceMin.toLocaleString()} - ₹{filters.priceMax.toLocaleString()}
            </summary>
            <div className="price-filter-content">
              <div className="price-input-group">
                <label htmlFor="priceMin">Min Price (₹)</label>
                <input
                  type="range"
                  id="priceMin"
                  name="priceMin"
                  min="1000"
                  max="50000"
                  step="500"
                  value={filters.priceMin}
                  onChange={handleChange}
                  className="price-slider"
                />
                <span className="price-value">₹{filters.priceMin.toLocaleString()}</span>
              </div>
              <div className="price-input-group">
                <label htmlFor="priceMax">Max Price (₹)</label>
                <input
                  type="range"
                  id="priceMax"
                  name="priceMax"
                  min="1000"
                  max="50000"
                  step="500"
                  value={filters.priceMax}
                  onChange={handleChange}
                  className="price-slider"
                />
                <span className="price-value">₹{filters.priceMax.toLocaleString()}</span>
              </div>
            </div>
          </details>
        </form>
      </div>
    </section>
  )
}
