import React, { useEffect, useState } from 'react'

export default function Toast({ message, type = 'info', duration = 4000, onClose }) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (!duration) return
    const timer = setTimeout(() => {
      setIsVisible(false)
      onClose?.()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  if (!isVisible) return null

  return (
    <div className={`toast toast-${type}`}>
      <div className="toast-content">
        <span className="toast-icon">
          {type === 'success' && '✓'}
          {type === 'error' && '✕'}
          {type === 'warning' && '⚠'}
          {type === 'info' && 'ℹ'}
        </span>
        <span className="toast-message">{message}</span>
      </div>
      <button 
        className="toast-close" 
        onClick={() => {
          setIsVisible(false)
          onClose?.()
        }}
        aria-label="Close notification"
      >
        ✕
      </button>
    </div>
  )
}
