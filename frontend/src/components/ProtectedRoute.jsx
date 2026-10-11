import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

/**
 * Guards a page: logged-out users go to /login, and users whose role is not
 * in `roles` are sent back to the gig list. This is a UX guard only – the
 * API independently rejects unauthorised requests with 401/403.
 */
export default function ProtectedRoute({ roles, children }) {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/gigs" replace />
  }
  return children
}
