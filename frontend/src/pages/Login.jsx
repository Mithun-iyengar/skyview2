import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FormInput from '../components/FormInput'

export default function Login(){
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 4200)
    return () => window.clearTimeout(timer)
  }, [toast])

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
  }

  const AUTH_LOGIN_URL = import.meta.env.VITE_AUTH_LOGIN_URL || '/api/auth/login'
  const AUTH_LOGIN_FALLBACK_URL = import.meta.env.VITE_AUTH_LOGIN_FALLBACK_URL || 'http://localhost:8086/api/auth/login'

  const extractUserIdFromToken = (token) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload?.userId || payload?.id || null
    } catch {
      return null
    }
  }

  const onSubmit = async (ev) =>{
    ev.preventDefault()
    setError(null)
    if(!identifier) { setError('Please enter your email, phone, or username.'); return }
    if(!password) { setError('Please enter your password.'); return }
    setLoading(true)

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 12000)

      const payload = {
        identifier: identifier.trim(),
        password
      }

      let response = null
      try {
        response = await fetch(AUTH_LOGIN_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          signal: controller.signal,
          body: JSON.stringify(payload)
        })
      } catch {
        response = null
      }

      if (!response || response.status === 502 || response.status === 503 || response.status === 504) {
        response = await fetch(AUTH_LOGIN_FALLBACK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        })
      }

      clearTimeout(timeoutId)

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        showToast(data?.message || 'Unable to sign in. Please try again.', 'error')
        return
      }

      if (data?.token && data?.name) {
        localStorage.setItem('skyline_user_token', data.token)
        localStorage.setItem('skyline_user_name', data.name)
        sessionStorage.setItem('skyline_user_token', data.token)
        sessionStorage.setItem('skyline_user_name', data.name)
        const userId = extractUserIdFromToken(data.token)
        if (userId !== null && userId !== undefined) {
          localStorage.setItem('skyline_user_id', String(userId))
          sessionStorage.setItem('skyline_user_id', String(userId))
        }
        window.dispatchEvent(new Event('authChange'))
        navigate('/', { replace: true, state: { welcomeName: data.name } })
        return
      }

      showToast('Login succeeded, but the application did not return user details.', 'error')
    } catch {
      showToast('Unable to connect to server. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="page auth py-4 py-lg-5">
      <div className="container">
        <div className="row justify-content-center g-4">
          <div className="col-12">
            <div className="auth-shell bg-glass">
              <div className="auth-hero auth-hero-login">
                <div className="auth-hero-badge">Skyline Airways</div>
                <h1>Welcome back to premium travel</h1>
                <p>
                  Sign in with your email, phone number, or username to manage bookings, payments, and trip details.
                </p>
                <div className="auth-visual auth-flight-card">
                  <div className="auth-flight-top">
                    <span><i className="bi bi-airplane-engines-fill me-2"></i>Executive Flight Access</span>
                    <span className="auth-mini-pill">LIVE</span>
                  </div>
                  <div className="auth-route">
                    <div>
                      <small>Departure</small>
                      <strong>Dubai DXB</strong>
                    </div>
                    <span className="auth-route-line" aria-hidden="true">
                      <i className="bi bi-airplane-fill"></i>
                    </span>
                    <div className="text-end">
                      <small>Arrival</small>
                      <strong>London LHR</strong>
                    </div>
                  </div>
                  <div className="auth-mini-stats">
                    <div><i className="bi bi-shield-check"></i><span>Secure sign in</span></div>
                    <div><i className="bi bi-stars"></i><span>Priority support</span></div>
                  </div>
                </div>
                <ul className="auth-features">
                  <li><i className="bi bi-lightning-charge-fill me-2"></i>Fast booking access</li>
                  <li><i className="bi bi-shield-lock-fill me-2"></i>Secure trip management</li>
                  <li><i className="bi bi-gem me-2"></i>Elegant royal interface</li>
                </ul>
              </div>

              <div className="auth-panel">
                <div className="auth-card auth-card-xl p-4 p-lg-5 w-100">
                  <h2 className="mb-2">Sign in</h2>
                  <p className="text-muted small mb-4">Use your email, phone number, or username.</p>

                  <form onSubmit={onSubmit} className="mt-3">
                    <FormInput id="identifier" label="Email, phone or username" value={identifier} onChange={e=>setIdentifier(e.target.value)} error={null} autoFocus />
                    <FormInput id="password" label="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} error={null} />

                    {toast && <div className={`toast-message ${toast.type}`} role="status">{toast.message}</div>}
                    {error && <div className="auth-alert auth-alert-error mb-3">{error}</div>}

                    <div className="d-grid mt-4">
                      <button className={`btn btn-primary btn-lg btn-royal ${loading ? 'loading' : ''}`} type="submit" disabled={loading}>
                        {loading ? <span className="spinner-border spinner-border-sm me-2" role="status"/> : null}
                        Sign in
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
