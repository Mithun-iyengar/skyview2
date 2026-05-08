import React from 'react'
import { Link } from 'react-router-dom'

export default function PopularDestinationTile({ city, image }) {
  return (
    <Link to={`/flights?destination=${encodeURIComponent(city)}`} className="lux-destination-tile">
      <div className="lux-destination-media">
        <img
          src={image}
          alt={city}
          onError={(event) => {
            event.currentTarget.src =
              'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=500&h=350&fit=crop'
          }}
        />
      </div>
      <div className="lux-destination-overlay">
        <h3>{city}</h3>
      </div>
    </Link>
  )
}
