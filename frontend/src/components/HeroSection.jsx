import React from 'react'
import { Link } from 'react-router-dom'

export default function HeroSection() {
  return (
    <section className="hero-section">
      {/* Background Video */}
      <video 
        className="hero-video" 
        autoPlay 
        muted 
        loop 
        preload="auto"
        poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1920' height='1080'%3E%3Crect fill='%23102a6b' width='1920' height='1080'/%3E%3C/svg%3E"
      >
        <source 
          src="https://videos.pexels.com/video-files/3045163/3045163-hd_1920_1080_24fps.mp4" 
          type="video/mp4" 
        />
        {/* Fallback gradient if video doesn't load */}
      </video>

      {/* Gradient Overlay */}
      <div className="hero-overlay"></div>

      {/* Hero Content */}
      <div className="hero-content container">
        <div className="hero-text">
          <h1 className="hero-title">
            <span className="hero-word">Fly</span>
            <span className="hero-word">Beyond</span>
            <span className="hero-word">Luxury</span>
          </h1>
          <p className="hero-subtitle">Fly Skyline Airways</p>
          <p className="hero-description">
            Experience premium air travel with world-class service, comfort, and hospitality
          </p>
          
          <Link to="/flights" className="btn btn-hero">
            <i className="bi bi-search"></i>
            Search Flights
          </Link>
        </div>

        {/* Floating Cards - Decorative Stats */}
        <div className="hero-stats">
          <div className="stat-card">
            <div className="stat-value">500+</div>
            <div className="stat-label">Destinations</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">1M+</div>
            <div className="stat-label">Passengers</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">24/7</div>
            <div className="stat-label">Support</div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="scroll-indicator">
        <span>Scroll to explore</span>
      </div>
    </section>
  )
}
