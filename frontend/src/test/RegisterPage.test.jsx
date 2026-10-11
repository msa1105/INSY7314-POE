import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test } from 'vitest'
import RegisterPage from '../pages/RegisterPage'
import { fakeToken, mockFetch, renderAt, USERS } from './utils'

async function fillForm({ name = 'Bob Freelancer', email = 'bob@test.dev', password = 'SecurePass1!', confirm = password } = {}) {
  await userEvent.type(screen.getByLabelText(/full name/i), name)
  await userEvent.type(screen.getByLabelText(/^email/i), email)
  await userEvent.type(screen.getByLabelText(/^password/i), password)
  await userEvent.type(screen.getByLabelText(/confirm password/i), confirm)
}

describe('RegisterPage', () => {
  test('rejects a weak password before contacting the server', async () => {
    const fetchMock = mockFetch()
    renderAt('/register', <RegisterPage />)

    await fillForm({ password: 'weakpass' })
    await userEvent.click(screen.getByRole('button', { name: /create account/i }))

    expect(await screen.findByText('Password must contain at least one uppercase letter.')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  test('flags mismatched passwords', async () => {
    mockFetch()
    renderAt('/register', <RegisterPage />)

    await fillForm({ confirm: 'Different1!' })
    await userEvent.click(screen.getByRole('button', { name: /create account/i }))

    expect(await screen.findByText('Passwords do not match.')).toBeInTheDocument()
  })

  test('registers a freelancer with the chosen role and goes to My gigs', async () => {
    const fetchMock = mockFetch([201, { token: fakeToken(), user: USERS.freelancer }])
    renderAt('/register', <RegisterPage />)

    await userEvent.click(screen.getByLabelText(/offer my services/i))
    await fillForm()
    await userEvent.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/my-gigs'))
    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(body).toEqual({ name: 'Bob Freelancer', email: 'bob@test.dev', password: 'SecurePass1!', role: 'freelancer' })
    expect(body).not.toHaveProperty('confirmPassword')
  })

  test('shows the server error when the email is already registered', async () => {
    mockFetch([409, { error: 'Email already registered.' }])
    renderAt('/register', <RegisterPage />)

    await fillForm()
    await userEvent.click(screen.getByRole('button', { name: /create account/i }))

    expect(await screen.findByText('Email already registered.')).toBeInTheDocument()
  })
})
