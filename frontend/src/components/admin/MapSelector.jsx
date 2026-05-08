import React from 'react';
import '../../styles/admin.css';

/**
 * MapSelector Component
 * Renders a lightweight Google Maps preview for selected airport
 * Clicking opens full Google Maps in a new tab
 */
const MapSelector = ({ title, airport, placeholder = 'Select an airport to preview map' }) => {
  const hasAirport = Boolean(airport);
  const airportQuery = hasAirport
    ? `${airport.name}, ${airport.city} airport`
    : '';
  const mapEmbedUrl = hasAirport
    ? `https://maps.google.com/maps?q=${encodeURIComponent(airportQuery)}&z=11&output=embed`
    : '';
  const mapOpenUrl = hasAirport
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(airportQuery)}`
    : '';

  return (
    <div className="map-selector-container">
      <h5 className="map-selector-title">{title}</h5>

      {hasAirport ? (
        <>
          <div className="map-selected-meta">
            <span className="map-selected-code">{airport.code}</span>
            <span className="map-selected-name">{airport.name}</span>
            <span className="map-selected-city">{airport.city}</span>
          </div>

          <iframe
            title={`${airport.code} map preview`}
            className="map-preview-embed"
            src={mapEmbedUrl}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />

          <a
            href={mapOpenUrl}
            target="_blank"
            rel="noreferrer"
            className="map-open-link"
          >
            <i className="bi bi-box-arrow-up-right"></i> Open in Google Maps
          </a>
        </>
      ) : (
        <div className="map-empty-state">
          <i className="bi bi-geo-alt-fill"></i>
          <span>{placeholder}</span>
        </div>
      )}
    </div>
  );
};

export default MapSelector;
