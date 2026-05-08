import React from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { ToastProvider } from './components/ToastProvider'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import SearchFlights from './pages/SearchFlights'
import FlightDetails from './pages/FlightDetails'
import Booking from './pages/Booking'
import Confirmation from './pages/Confirmation'
import Reservations from './pages/Reservations'
import Login from './pages/Login'
import Register from './pages/Register'
import AddFlight from './pages/admin/AddFlight'
import AdminLogin from './pages/admin/AdminLogin'

function ProtectedAdminRoute({ children }) {
  const location = useLocation()
  const isAdminAuthenticated = sessionStorage.getItem('skyline_admin_auth') === 'true'

  if (!isAdminAuthenticated) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />
  }

  return children
}

export default function App() {
  return (
    <ToastProvider>
      <div className="app-shell">
        <Header />
        <main className="content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/flights" element={<SearchFlights />} />
            <Route path="/flight/:id" element={<FlightDetails />} />
            <Route path="/booking/:flightId" element={<Booking />} />
            <Route path="/confirmation/:bookingId" element={<Confirmation />} />
            <Route path="/account/reservations" element={<Reservations />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route
              path="/admin/add-flight"
              element={
                <ProtectedAdminRoute>
                  <AddFlight />
                </ProtectedAdminRoute>
              }
            />
          </Routes>
        </main>
        <Footer />
      </div>
    </ToastProvider>
  )
}
