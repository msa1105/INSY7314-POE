import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

const LINKS = {
  client: [
    { to: '/gigs', label: 'Browse gigs' },
    { to: '/bookings', label: 'My bookings' },
  ],
  freelancer: [
    { to: '/gigs', label: 'Browse gigs' },
    { to: '/my-gigs', label: 'My gigs' },
    { to: '/bookings', label: 'Bookings & income' },
  ],
  admin: [
    { to: '/gigs', label: 'Gigs' },
    { to: '/admin', label: 'Admin' },
  ],
}

export default function NavBar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <header className="navbar">
      <div className="navbar__inner">
        <NavLink to={user ? '/gigs' : '/login'} className="brand">
          <span className="brand__mark" aria-hidden="true">H</span>
          HustleHub<span className="brand__plus">+</span>
        </NavLink>

        {user ? (
          <nav className="navbar__nav" aria-label="Main">
            {LINKS[user.role]?.map((link) => (
              <NavLink key={link.to} to={link.to} className="navbar__link">
                {link.label}
              </NavLink>
            ))}
            <span className="navbar__user">
              {user.name} <span className={`badge badge--${user.role}`}>{user.role}</span>
            </span>
            <button type="button" className="btn btn--ghost btn--sm" onClick={handleLogout}>
              Log out
            </button>
          </nav>
        ) : (
          <nav className="navbar__nav" aria-label="Main">
            <NavLink to="/login" className="navbar__link">Log in</NavLink>
            <NavLink to="/register" className="btn btn--primary btn--sm">Sign up</NavLink>
          </nav>
        )}
      </div>
    </header>
  )
}
