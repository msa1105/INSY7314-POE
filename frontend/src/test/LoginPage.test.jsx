import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test } from 'vitest'
import LoginPage from '../pages/LoginPage'
import { fakeToken, mockFetch, renderAt, USERS } from './utils'

describe('LoginPage', () => {
  test('renders the email and password fields and a submit button', () => {
    renderAt('/login', <LoginPage />)
    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toHaveAttribute('type', 'password')
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument()
  })

  test('shows validation errors and does not call the API when fields are empty', async () => {
    const fetchMock = mockFetch()
    renderAt('/login', <LoginPage />)

    await userEvent.click(screen.getByRole('button', { name: /log in/i }))

    expect(await screen.findByText('Email is required.')).toBeInTheDocument()
    expect(screen.getByText('Password is required.')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  test('logs in with valid credentials and redirects to the gigs page', async () => {
    const fetchMock = mockFetch([200, { token: fakeToken(), user: USERS.client }])
    renderAt('/login', <LoginPage />)

    await userEvent.type(screen.getByLabelText(/email/i), 'alice@test.dev')
    await userEvent.type(screen.getByLabelText(/password/i), 'SecurePass1!')
    await userEvent.click(screen.getByRole('button', { name: /log in/i }))

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/gigs'))
    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/auth/login')
    expect(JSON.parse(options.body)).toEqual({ email: 'alice@test.dev', password: 'SecurePass1!' })
    // Session stored without any password
    expect(sessionStorage.getItem('hustlehub.session')).not.toMatch(/SecurePass1!/)
  })

  test('shows the server\'s generic error on bad credentials and clears the password', async () => {
    mockFetch([401, { error: 'Invalid email or password.' }])
    renderAt('/login', <LoginPage />)

    await userEvent.type(screen.getByLabelText(/email/i), 'alice@test.dev')
    await userEvent.type(screen.getByLabelText(/password/i), 'WrongPass1!')
    await userEvent.click(screen.getByRole('button', { name: /log in/i }))

    expect(await screen.findByText('Invalid email or password.')).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toHaveValue('')
  })

  test('never shows raw server error details on a 500', async () => {
    mockFetch([500, { error: 'MongoServerError: connection refused at 10.0.0.5', hint: 'stack...' }])
    renderAt('/login', <LoginPage />)

    await userEvent.type(screen.getByLabelText(/email/i), 'alice@test.dev')
    await userEvent.type(screen.getByLabelText(/password/i), 'SecurePass1!')
    await userEvent.click(screen.getByRole('button', { name: /log in/i }))

    expect(await screen.findByText('Something went wrong. Please try again.')).toBeInTheDocument()
    expect(screen.queryByText(/MongoServerError/)).not.toBeInTheDocument()
  })
})
