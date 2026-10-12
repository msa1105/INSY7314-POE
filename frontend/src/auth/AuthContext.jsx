import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { onUnauthorized } from '../api/client'
import * as api from '../api/endpoints'

/**
 * AuthContext – holds the logged-in user and their JWT.
 *
 * The session is kept in sessionStorage (not localStorage): it is cleared
 * when the tab closes, limiting how long a token lives on the device. The
 * user object only contains id, name, email and role – never a password.
 * The role here only controls what the UI shows; the API enforces every
 * permission on its own.
 */

/* Timespace, 2014
 * Where to store JWT in browser? How to protect against CSRF?
 * Stack Overflow
 * https://stackoverflow.com/questions/27067251/where-to-store-jwt-in-browser-how-to-protect-against-csrf
 * Accessed: 11 October 2026
 */
/* MDN contributors, 2025
 * Window: sessionStorage property
 * MDN Web Docs
 * https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage
 * Accessed: 11 October 2026
 */
const STORAGE_KEY = 'hustlehub.session'
const AuthContext = createContext(null)

function loadSession() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const session = JSON.parse(raw)
    return isExpired(session.token) ? null : session
  } catch {
    return null
  }
}

/** Reads the exp claim so an expired token is discarded without a server round-trip. */
function isExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now()
  } catch {
    return true
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(loadSession)
  const [notice, setNotice] = useState('')

  const saveSession = useCallback((data) => {
    const next = { token: data.token, user: data.user }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    setSession(next)
    setNotice('')
  }, [])

  const logout = useCallback((message = '') => {
    sessionStorage.removeItem(STORAGE_KEY)
    setSession(null)
    setNotice(message)
  }, [])

  // Any 401 on an authenticated request means the token expired or was revoked
  useEffect(() => {
    onUnauthorized(() => logout('Your session has expired. Please log in again.'))
    return () => onUnauthorized(null)
  }, [logout])

  const login = useCallback(async (credentials) => saveSession(await api.login(credentials)), [saveSession])
  const register = useCallback(async (details) => saveSession(await api.register(details)), [saveSession])

  const value = useMemo(() => ({
    token: session?.token ?? null,
    user: session?.user ?? null,
    notice,
    login,
    register,
    logout,
  }), [session, notice, login, register, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
