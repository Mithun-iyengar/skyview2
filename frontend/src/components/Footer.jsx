import React from 'react'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container d-flex flex-column flex-md-row justify-content-between align-items-center">
        <div>
          <strong>Skyline Airways</strong>
          <div className="text-muted">Fly premium — comfort & safety</div>
        </div>
        <div className="text-muted text-center mt-2 mt-md-0">
          <div>Contact: support@skylineairways.com | +1-800-SKY-LINE</div>
          <small className="d-block">© {new Date().getFullYear()} Skyline Airways — All rights reserved.</small>
        </div>
      </div>
    </footer>
  )
}
