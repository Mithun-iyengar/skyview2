import React, { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'

const ADMIN_AUTH_KEY = 'skyline_admin_auth'
const ADMIN_NAME_KEY = 'skyline_admin_name'
const ADMIN_TOKEN_KEY = 'skyline_admin_token'
const ADMIN_LOGIN_URL = import.meta.env.VITE_ADMIN_LOGIN_URL || 'http://localhost:8086/api/v1/admin/auth/login'
const ADMIN_LOGIN_FALLBACK_URL = import.meta.env.VITE_ADMIN_LOGIN_FALLBACK_URL || '/api/v1/admin/auth/login'

export default function AdminLogin() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

  const isAuthed = sessionStorage.getItem(ADMIN_AUTH_KEY) === 'true'
  if (localStorage.getItem(ADMIN_AUTH_KEY) === 'true') {
    localStorage.removeItem(ADMIN_AUTH_KEY)
  }
  if (isAuthed) {
    return <Navigate to="/admin/add-flight" replace />
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    if (!username.trim() || !password.trim()) {
      setError('Username and password are required.')
      return
    }

    const login = async () => {
      const controller = new AbortController()
      const timeoutId = window.setTimeout(() => controller.abort(), 12000)

      try {
        const payload = JSON.stringify({
          username: username.trim(),
          password
        })

        let response
        try {
          response = await fetch(ADMIN_LOGIN_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            signal: controller.signal,
            body: payload
          })
        } catch {
          response = await fetch(ADMIN_LOGIN_FALLBACK_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: payload
          })
        }

        if (!response.ok && (response.status === 404 || response.status === 502 || response.status === 503)) {
          response = await fetch(ADMIN_LOGIN_FALLBACK_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: payload
          })
        }

        const data = await response.json().catch(() => ({}))

        if (!response.ok) {
          setError(data?.message || 'Invalid admin credentials. Access denied.')
          return
        }

        sessionStorage.setItem(ADMIN_AUTH_KEY, 'true')
        if (data?.name) {
          sessionStorage.setItem(ADMIN_NAME_KEY, data.name)
        }
        if (data?.token) {
          sessionStorage.setItem(ADMIN_TOKEN_KEY, data.token)
        }
        const redirectTo = location.state?.from?.pathname || '/admin/add-flight'
        navigate(redirectTo, { replace: true })
      } catch {
        setError('Unable to connect to the admin authentication server.')
      } finally {
        window.clearTimeout(timeoutId)
      }
    }

    login()
  }

  return (
    <div className="admin-login-page">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-10 col-lg-6 col-xl-5">
            <div className="admin-login-card">
              <h2 className="admin-login-title">
                <i className="bi bi-shield-lock-fill"></i> Admin Access
              </h2>
              <p className="admin-login-subtitle">Authorized users only</p>

              <form onSubmit={handleSubmit} className="admin-login-form">
                <div className="mb-3">
                  <label htmlFor="admin-username" className="form-label">Username</label>
                  <input
                    id="admin-username"
                    type="text"
                    className="form-control auth-control"
                    value={username}
                    onChange={(event) => {
                      setUsername(event.target.value)
                      if (error) setError('')
                    }}
                    placeholder="Enter admin username"
                    autoFocus
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="admin-password" className="form-label">Password</label>
                  <input
                    id="admin-password"
                    type="password"
                    className="form-control auth-control"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value)
                      if (error) setError('')
                    }}
                    placeholder="Enter admin password"
                  />
                </div>

                {error && <div className="admin-login-error">{error}</div>}

                <button type="submit" className="btn btn-add-flight w-100">
                  <i className="bi bi-box-arrow-in-right"></i> Login to Admin
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
