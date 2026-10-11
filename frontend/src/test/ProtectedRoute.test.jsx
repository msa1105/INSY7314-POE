import { screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import ProtectedRoute from '../components/ProtectedRoute'
import { fakeToken, loginAs, renderAt, USERS } from './utils'

const page = (
  <ProtectedRoute roles={['freelancer']}>
    <p>Freelancer area</p>
  </ProtectedRoute>
)

describe('ProtectedRoute', () => {
  test('redirects logged-out users to /login', () => {
    renderAt('/my-gigs', page)
    expect(screen.queryByText('Freelancer area')).not.toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/login')
  })

  test('redirects users with the wrong role to /gigs', () => {
    loginAs('client')
    renderAt('/my-gigs', page)
    expect(screen.queryByText('Freelancer area')).not.toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/gigs')
  })

  test('renders the page for the allowed role', () => {
    loginAs('freelancer')
    renderAt('/my-gigs', page)
    expect(screen.getByText('Freelancer area')).toBeInTheDocument()
  })

  test('treats an expired token as logged out', () => {
    sessionStorage.setItem('hustlehub.session', JSON.stringify({ token: fakeToken(-60), user: USERS.freelancer }))
    renderAt('/my-gigs', page)
    expect(screen.getByTestId('location')).toHaveTextContent('/login')
  })
})
