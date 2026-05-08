import React from 'react'
import { Link } from 'react-router-dom'

export default function DestinationCard({ destination }) {
  const { id, city, subtitle, image, flag } = destination

  return (
    <Link to={`/flights?destination=${encodeURIComponent(city)}`} className="destination-card-link">
      <div className="destination-card">
        {/* Background Image */}
        <div className="destination-image">
          <img 
            src={image} 
            alt={city}
            onError={(e) => {
              // Fallback to placeholder if image doesn't exist
              e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="500" height="500"%3E%3Crect fill="%23102a6b" width="500" height="500"/%3E%3Ctext x="50%25" y="50%25" font-size="40" fill="%23d4af37" text-anchor="middle" dy=".3em" font-weight="bold"%3EAdd Image%3C/text%3E%3C/svg%3E'
            }}
          />
          <div className="destination-overlay"></div>
        </div>

        {/* Card Content */}
        <div className="destination-content">
          <h3 className="destination-title">
            {flag && <span className="destination-flag">{flag}</span>}
            {city}
          </h3>
          <p className="destination-subtitle">{subtitle}</p>
          
          <div className="destination-cta">
            <span>Explore</span>
            <i className="bi bi-arrow-right"></i>
          </div>
        </div>

        {/* Hover Glow Effect */}
        <div className="destination-glow"></div>
      </div>
    </Link>
  )
}
