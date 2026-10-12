import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test } from 'vitest'
import BookingsPage from '../pages/BookingsPage'
import { loginAs, mockFetch, renderAt } from './utils'

const PENDING = {
  id: 't1', gigTitle: 'Logo Design', details: 'Logo for my bakery, warm colours.', amount: 1200,
  status: 'pending', createdAt: '2026-10-01T10:00:00Z',
  client: { id: 'c1', name: 'Alice Client' }, freelancer: { id: 'f1', name: 'Bob Freelancer' },
}
const INCOME = { totalIncome: 0, estimatedTax: 0, taxRate: '25%', bookings: 0, transactions: [] }

describe('BookingsPage', () => {
  test('freelancer accepts a pending request and the list and income reload', async () => {
    loginAs('freelancer')
    const fetchMock = mockFetch(
      [200, { count: 1, transactions: [PENDING] }],
      [200, INCOME],
      [200, { message: 'Request accepted. Payment simulated successfully.', transaction: { ...PENDING, status: 'accepted' } }],
      [200, { count: 1, transactions: [{ ...PENDING, status: 'accepted' }] }],
      [200, { ...INCOME, totalIncome: 1200, estimatedTax: 300, bookings: 1 }],
    )
    renderAt('/bookings', <BookingsPage />)

    const row = (await screen.findByText('Logo for my bakery, warm colours.')).closest('tr')
    await userEvent.click(within(row).getByRole('button', { name: /accept/i }))

    expect(await screen.findByText(/request accepted/i)).toBeInTheDocument()
    const [url, options] = fetchMock.mock.calls[2]
    expect(url).toBe('/api/transactions/t1')
    expect(options.method).toBe('PATCH')
    expect(JSON.parse(options.body)).toEqual({ status: 'accepted' })

    expect(await screen.findByText('Accepted jobs')).toBeInTheDocument()
    const incomeCard = screen.getByText('Total income').closest('.stat')
    await within(incomeCard).findByText(/1\s200,00/)
    expect(screen.queryByRole('button', { name: /accept/i })).not.toBeInTheDocument()
  })

  test('freelancer sees the API error if a request was already answered', async () => {
    loginAs('freelancer')
    mockFetch(
      [200, { count: 1, transactions: [PENDING] }],
      [200, INCOME],
      [409, { error: 'This request has already been declined.' }],
    )
    renderAt('/bookings', <BookingsPage />)

    await userEvent.click(await screen.findByRole('button', { name: /decline/i }))
    expect(await screen.findByText(/already been declined/i)).toBeInTheDocument()
  })

  test('client sees request status but cannot accept or decline', async () => {
    loginAs('client')
    mockFetch([200, { count: 1, transactions: [PENDING] }])
    renderAt('/bookings', <BookingsPage />)

    expect(await screen.findByText('Bob Freelancer')).toBeInTheDocument()
    expect(screen.getByText('pending')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /accept|decline/i })).not.toBeInTheDocument()
  })
})
