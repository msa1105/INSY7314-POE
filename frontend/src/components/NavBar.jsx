import { NavLink, useNavigate } from 'react-router-dom'
import { Briefcase, ClipboardList, LayoutGrid, LogOut, ShieldCheck } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import Avatar from './Avatar'

/* Lucide Contributors, n.d.
 * Lucide for React
 * Lucide Documentation
 * https://lucide.dev/guide/react
 * Accessed: 11 October 2026
 */
/* React Router, n.d.
 * NavLink
 * React Router Documentation
 * https://reactrouter.com/api/components/NavLink
 * Accessed: 11 October 2026
 */

const LINKS = {
  client: [
    { to: '/gigs', label: 'Browse gigs', icon: LayoutGrid },
    { to: '/bookings', label: 'My requests', icon: ClipboardList },
  ],
  freelancer: [
    { to: '/gigs', label: 'Browse gigs', icon: LayoutGrid },
    { to: '/my-gigs', label: 'My gigs', icon: Briefcase },
    { to: '/bookings', label: 'Requests & income', icon: ClipboardList },
  ],
  admin: [
    { to: '/gigs', label: 'Gigs', icon: LayoutGrid },
    { to: '/admin', label: 'Admin', icon: ShieldCheck },
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
          <span>HustleHub<span className="brand__plus">+</span></span>
        </NavLink>

        {user ? (
          <nav className="navbar__nav" aria-label="Main">
            {LINKS[user.role]?.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className="navbar__link">
                <Icon aria-hidden="true" />
                {label}
              </NavLink>
            ))}
            <span className="navbar__user">
              <Avatar name={user.name} />
              <span className="navbar__who">
                {user.name} <span className={`badge badge--${user.role}`}>{user.role}</span>
              </span>
            </span>
            <button type="button" className="btn btn--ghost btn--sm" onClick={handleLogout}>
              <LogOut aria-hidden="true" />
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
