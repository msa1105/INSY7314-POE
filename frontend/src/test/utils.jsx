import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { vi } from 'vitest'
import { AuthProvider } from '../auth/AuthContext'

/** Builds an unsigned JWT-shaped token whose exp is in the future (UI only decodes it). */
export function fakeToken(expiresInSeconds = 3600) {
  const encode = (obj) => btoa(JSON.stringify(obj)).replace(/=+$/, '')
  return `${encode({ alg: 'HS256' })}.${encode({ exp: Math.floor(Date.now() / 1000) + expiresInSeconds })}.sig`
}

export const USERS = {
  client: { id: 'c1', name: 'Alice Client', email: 'alice@test.dev', role: 'client' },
  freelancer: { id: 'f1', name: 'Bob Freelancer', email: 'bob@test.dev', role: 'freelancer' },
  admin: { id: 'a1', name: 'Ada Admin', email: 'ada@test.dev', role: 'admin' },
}

export function loginAs(role) {
  sessionStorage.setItem('hustlehub.session', JSON.stringify({ token: fakeToken(), user: USERS[role] }))
}

/** Replaces global fetch with a mock that answers each call from `responses` in order. */
export function mockFetch(...responses) {
  const fn = vi.fn()
  responses.forEach(([status, body]) => {
    fn.mockResolvedValueOnce({ ok: status >= 200 && status < 300, status, json: async () => body })
  })
  vi.stubGlobal('fetch', fn)
  return fn
}

function LocationDisplay() {
  const location = useLocation()
  return <div data-testid="location">{location.pathname}</div>
}

/**
 * Renders `element` at `path` inside the real AuthProvider and a memory
 * router. Extra routes render a simple marker so redirects can be asserted.
 */
export function renderAt(path, element, { route = path } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider>
        <Routes>
          <Route path={path} element={element} />
          <Route path="*" element={<p>Other page</p>} />
        </Routes>
        <LocationDisplay />
      </AuthProvider>
    </MemoryRouter>,
  )
}
