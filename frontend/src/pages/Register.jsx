import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FormInput from '../components/FormInput'

export default function Register(){
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
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

  const AUTH_REGISTER_URL = import.meta.env.VITE_AUTH_REGISTER_URL || '/api/auth/register'
  const AUTH_REGISTER_FALLBACK_URL = import.meta.env.VITE_AUTH_REGISTER_FALLBACK_URL || 'http://localhost:8086/api/auth/register'

  const validate = () => {
    const e = {}
    if(!fullName.trim()) e.fullName = 'Full name is required.'
    if(!email.trim()) e.email = 'Email is required.'
    else if(!/^\S+@\S+\.\S+$/.test(email)) e.email = 'Enter a valid email address.'

    if(!phone.trim()) e.phone = 'Phone number is required.'
    else if(!/^\+?[0-9\s\-]{7,15}$/.test(phone)) e.phone = 'Enter a valid phone number.'

    if(!password || password.length < 8) e.password = 'Password must be at least 8 characters.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const onSubmit = async (ev) =>{
    ev.preventDefault()
    if(!validate()) return
    setLoading(true)
    setErrors({})

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 12000)

      const payload = {
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password
      }

      let response = null
      try {
        response = await fetch(AUTH_REGISTER_URL, {
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
        response = await fetch(AUTH_REGISTER_FALLBACK_URL, {
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
        showToast(data?.message || 'Registration failed. Please try again.', 'error')
        return
      }

      showToast('Registration successful. Please log in to continue.', 'success')
      setTimeout(() => {
        navigate('/login', { replace: true })
      }, 1400)
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
              <div className="auth-hero auth-hero-register">
                <div className="auth-hero-badge">Skyline Airways</div>
                <h1>Join the royal travel experience</h1>
                <p>
                  Create your account with your full name, email, and phone number to unlock smooth booking,
                  trip updates, and premium support.
                </p>
                <div className="auth-visual auth-boarding-card">
                  <div className="auth-flight-top">
                    <span><i className="bi bi-ticket-perforated-fill me-2"></i>Priority Membership</span>
                    <span className="auth-mini-pill gold">PREMIUM</span>
                  </div>
                  <div className="auth-board-grid">
                    <div>
                      <small>Rewards</small>
                      <strong>Sky Gold</strong>
                    </div>
                    <div>
                      <small>Access</small>
                      <strong>24/7 Concierge</strong>
                    </div>
                  </div>
                  <div className="auth-board-path">
                    <span></span>
                    <i className="bi bi-airplane-fill"></i>
                    <span></span>
                  </div>
                </div>
                <ul className="auth-features">
                  <li><i className="bi bi-person-badge-fill me-2"></i>Secure account verification</li>
                  <li><i className="bi bi-bell-fill me-2"></i>Priority booking updates</li>
                  <li><i className="bi bi-award-fill me-2"></i>Luxury-inspired interface</li>
                </ul>
              </div>

              <div className="auth-panel">
                <div className="auth-card auth-card-xl p-4 p-lg-5 w-100">
                  <h2 className="mb-2">Create your account</h2>
                  <p className="text-muted small mb-4">All fields are required for registration.</p>

                  <form onSubmit={onSubmit} className="mt-3">
                    <FormInput id="fullName" label="Full name" value={fullName} onChange={e=>setFullName(e.target.value)} error={errors.fullName} autoFocus />
                    <FormInput id="email" label="Email address" type="email" value={email} onChange={e=>setEmail(e.target.value)} error={errors.email} />
                    <FormInput id="phone" label="Phone number" type="tel" value={phone} onChange={e=>setPhone(e.target.value)} error={errors.phone} placeholder="+1 555 555 5555" />
                    <FormInput id="password" label="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} error={errors.password} />

                    <div className="d-grid mt-4">
                      <button className={`btn btn-primary btn-lg btn-royal ${loading ? 'loading' : ''}`} type="submit" disabled={loading}>
                        {loading ? <span className="spinner-border spinner-border-sm me-2" role="status"/> : null}
                        Create account
                      </button>
                    </div>

                    {toast && <div className={`toast-message ${toast.type}`} role="status">{toast.message}</div>}
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
