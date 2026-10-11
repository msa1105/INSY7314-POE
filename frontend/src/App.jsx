import { Link, Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth/AuthContext'
import NavBar from './components/NavBar'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import GigsPage from './pages/GigsPage'
import MyGigsPage from './pages/MyGigsPage'
import BookingsPage from './pages/BookingsPage'
import AdminPage from './pages/AdminPage'

function NotFound() {
  return (
    <section className="page empty">
      <h1>Page not found</h1>
      <p><Link to="/">Go home</Link></p>
    </section>
  )
}

export default function App() {
  const { user } = useAuth()

  return (
    <>
      <NavBar />
      <main className="container">
        <Routes>
          <Route path="/" element={<Navigate to={user ? '/gigs' : '/login'} replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/gigs" element={<ProtectedRoute><GigsPage /></ProtectedRoute>} />
          <Route path="/my-gigs" element={<ProtectedRoute roles={['freelancer']}><MyGigsPage /></ProtectedRoute>} />
          <Route path="/bookings" element={<ProtectedRoute roles={['client', 'freelancer']}><BookingsPage /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminPage /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </>
  )
}
