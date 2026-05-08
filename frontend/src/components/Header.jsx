import React, { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { walletApi } from '../utils/apiService'

export default function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const [token, setToken] = useState(localStorage.getItem('skyline_user_token') || sessionStorage.getItem('skyline_user_token'))
  const [userName, setUserName] = useState(localStorage.getItem('skyline_user_name') || sessionStorage.getItem('skyline_user_name'))
  const [walletBalance, setWalletBalance] = useState(null)
  const [walletLoading, setWalletLoading] = useState(false)
  const [walletError, setWalletError] = useState(null)
  const [walletMenuOpen, setWalletMenuOpen] = useState(false)
  const [walletPinned, setWalletPinned] = useState(false)
  const [walletAddOpen, setWalletAddOpen] = useState(false)
  const [walletAmount, setWalletAmount] = useState('')
  const [walletAdding, setWalletAdding] = useState(false)
  const closeTimerRef = useRef(null)
  const isAdminRoute = location.pathname.startsWith('/admin')

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }

  const loadWalletBalance = async () => {
    if (!(localStorage.getItem('skyline_user_token') || sessionStorage.getItem('skyline_user_token'))) {
      setWalletBalance(null)
      return
    }

    try {
      setWalletLoading(true)
      setWalletError(null)
      const data = await walletApi.getBalance()
      const balanceValue = Number(data?.balance ?? 0)
      setWalletBalance(Number.isFinite(balanceValue) ? balanceValue : 0)
    } catch {
      setWalletError('Wallet unavailable')
      setWalletBalance(null)
    } finally {
      setWalletLoading(false)
    }
  }

  const openWalletMenu = () => {
    clearCloseTimer()
    setWalletMenuOpen(true)
    if (walletBalance === null && !walletLoading) {
      loadWalletBalance()
    }
  }

  const scheduleWalletMenuClose = () => {
    clearCloseTimer()
    closeTimerRef.current = setTimeout(() => {
      if (!walletPinned && !walletAddOpen) {
        setWalletMenuOpen(false)
      }
    }, 250)
  }

  useEffect(() => {
    const handleAuthChange = () => {
      setToken(localStorage.getItem('skyline_user_token') || sessionStorage.getItem('skyline_user_token'))
      setUserName(localStorage.getItem('skyline_user_name') || sessionStorage.getItem('skyline_user_name'))
      loadWalletBalance()
    }

    const handleWalletUpdate = () => loadWalletBalance()

    window.addEventListener('authChange', handleAuthChange)
    window.addEventListener('storage', handleAuthChange)
    window.addEventListener('walletUpdated', handleWalletUpdate)
    loadWalletBalance()

    return () => {
      window.removeEventListener('authChange', handleAuthChange)
      window.removeEventListener('storage', handleAuthChange)
      window.removeEventListener('walletUpdated', handleWalletUpdate)
      clearCloseTimer()
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('skyline_user_token')
    localStorage.removeItem('skyline_user_name')
    localStorage.removeItem('skyline_user_id')
    sessionStorage.removeItem('skyline_user_token')
    sessionStorage.removeItem('skyline_user_name')
    sessionStorage.removeItem('skyline_user_id')
    setToken(null)
    setUserName(null)
    setWalletMenuOpen(false)
    setWalletAddOpen(false)
    setWalletAmount('')
    window.dispatchEvent(new Event('authChange'))
    navigate('/login')
  }

  const handleWalletAddMoney = async () => {
    const amountValue = parseFloat(walletAmount)
    if (!walletAmount || !Number.isFinite(amountValue) || amountValue <= 0) {
      setWalletError('Enter a valid amount')
      return
    }

    try {
      setWalletAdding(true)
      setWalletError(null)
      const data = await walletApi.addMoney(amountValue)
      const balanceValue = Number(data?.balance ?? amountValue)
      setWalletBalance(Number.isFinite(balanceValue) ? balanceValue : 0)
      setWalletAmount('')
      setWalletAddOpen(false)
      window.dispatchEvent(new Event('walletUpdated'))
    } catch (error) {
      setWalletError(error.message || 'Failed to add money')
    } finally {
      setWalletAdding(false)
    }
  }

  const initials = userName ? userName.split(' ').map((part) => part[0]).join('').toUpperCase() : ''
  const displayBalance = walletBalance !== null ? `₹${walletBalance.toFixed(2)}` : '—'

  return (
    <header className="site-header">
      <div className="container header-inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link to="/" className="brand me-3">Skyline Airways</Link>
          <span className="text-small text-white-50">Premium travel</span>
        </div>

        <nav className="nav" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/flights" className="nav-link">Book Flights</Link>

          {!isAdminRoute && token ? (
            <>
              <div className="user-menu" onMouseEnter={openWalletMenu} onMouseLeave={scheduleWalletMenuClose} style={{ position: 'relative' }}>
                <button
                  type="button"
                  className="nav-link user-info"
                  onClick={() => {
                    clearCloseTimer()
                    setWalletMenuOpen((v) => !v)
                    setWalletPinned((v) => !v)
                    if (!walletMenuOpen && walletBalance === null && !walletLoading) {
                      loadWalletBalance()
                    }
                  }}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <span className="user-avatar">{initials || <i className="bi bi-person-fill"></i>}</span>
                  <span>{userName || 'User'}</span>
                  <i className="bi bi-caret-down-fill user-caret"></i>
                </button>

                {walletMenuOpen && (
                  <div className="wallet-popover" role="status" aria-live="polite" onMouseEnter={clearCloseTimer} onMouseLeave={scheduleWalletMenuClose}>
                    {!walletAddOpen ? (
                      <>
                        <div className="wallet-popover-label">My Wallet</div>
                        <div className="wallet-popover-balance">{walletLoading ? 'Loading...' : displayBalance}</div>
                        <div className="wallet-popover-subtext">{walletError ? walletError : 'Hover to view your balance'}</div>
                        <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                          <button type="button" className="wallet-popover-action" onClick={() => setWalletAddOpen(true)}>Add Money</button>
                          <button type="button" className="wallet-popover-action wallet-popover-action-secondary" onClick={() => window.open('/account/reservations', '_blank')}>
                            My Bookings
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="wallet-popover-label">Add Money</div>
                        <div className="wallet-popover-balance">{walletLoading ? 'Loading...' : displayBalance}</div>
                        <input
                          type="number"
                          className="wallet-popover-input"
                          placeholder="Enter amount"
                          value={walletAmount}
                          onChange={(e) => setWalletAmount(e.target.value)}
                          min="0"
                          step="0.01"
                        />
                        {walletError && <div className="wallet-popover-error">{walletError}</div>}
                        <div className="wallet-popover-actions">
                          <button
                            type="button"
                            className="wallet-popover-action wallet-popover-action-secondary"
                            onClick={() => {
                              setWalletAddOpen(false)
                              setWalletError(null)
                            }}
                          >
                            Cancel
                          </button>
                          <button type="button" className="wallet-popover-action" onClick={handleWalletAddMoney} disabled={walletAdding}>
                            {walletAdding ? 'Adding...' : 'Add'}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              <button className="nav-link btn-logout" onClick={handleLogout}>Logout</button>
            </>
          ) : !isAdminRoute ? (
            <>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/register" className="nav-link">Register</Link>
            </>
          ) : null}
        </nav>
      </div>
    </header>
  )
}
