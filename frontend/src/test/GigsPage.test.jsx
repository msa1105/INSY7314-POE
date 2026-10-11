import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test } from 'vitest'
import GigsPage from '../pages/GigsPage'
import { loginAs, mockFetch, renderAt } from './utils'

const GIGS = [
  {
    id: 'g1', title: 'Logo Design', description: 'A professional logo with revisions.',
    price: 1500, category: 'Design', freelancer: { id: 'f1', name: 'Bob Freelancer' },
  },
  {
    id: 'g2', title: '&lt;script&gt;alert(1)&lt;&#x2F;script&gt;', description: 'Bob&#x27;s escaped description.',
    price: 300, category: 'Writing', freelancer: { id: 'f2', name: 'Eve' },
  },
]

describe('GigsPage', () => {
  test('client sees gigs with Book buttons; escaped text is shown as plain text', async () => {
    loginAs('client')
    mockFetch([200, { count: 2, gigs: GIGS }])
    const { container } = renderAt('/gigs', <GigsPage />)

    expect(await screen.findByText('Logo Design')).toBeInTheDocument()
    expect(screen.getByText('by Bob Freelancer')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /book now/i })).toHaveLength(2)

    // Stored-XSS payload is decoded for display but rendered as text, never as markup
    expect(screen.getByText('<script>alert(1)</script>')).toBeInTheDocument()
    expect(screen.getByText("Bob's escaped description.")).toBeInTheDocument()
    expect(container.querySelector('script')).toBeNull()
  })

  test('client books a gig through the confirmation step', async () => {
    loginAs('client')
    const fetchMock = mockFetch(
      [200, { count: 1, gigs: [GIGS[0]] }],
      [201, { transaction: { id: 't1', amount: 1500, gigTitle: 'Logo Design', status: 'completed' } }],
    )
    renderAt('/gigs', <GigsPage />)

    await userEvent.click(await screen.findByRole('button', { name: /book now/i }))

    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText(/simulated payment/i)).toBeInTheDocument()
    await userEvent.click(within(dialog).getByRole('button', { name: /confirm & pay/i }))

    expect(await screen.findByText(/booking confirmed/i)).toBeInTheDocument()
    const [url, options] = fetchMock.mock.calls[1]
    expect(url).toBe('/api/transactions')
    expect(options.method).toBe('POST')
    expect(JSON.parse(options.body)).toEqual({ gigId: 'g1' })
    expect(options.headers.Authorization).toMatch(/^Bearer /)
  })

  test('cancelling the confirmation does not create a booking', async () => {
    loginAs('client')
    const fetchMock = mockFetch([200, { count: 1, gigs: [GIGS[0]] }])
    renderAt('/gigs', <GigsPage />)

    await userEvent.click(await screen.findByRole('button', { name: /book now/i }))
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(1) // only the gig list request
  })

  test('freelancers cannot book gigs (no Book button)', async () => {
    loginAs('freelancer')
    mockFetch([200, { count: 1, gigs: [GIGS[0]] }])
    renderAt('/gigs', <GigsPage />)

    expect(await screen.findByText('Logo Design')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /book now/i })).not.toBeInTheDocument()
  })

  test('shows a friendly error if the booking is rate limited', async () => {
    loginAs('client')
    mockFetch(
      [200, { count: 1, gigs: [GIGS[0]] }],
      [429, { error: 'Too many booking attempts. Please try again in 15 minutes.' }],
    )
    renderAt('/gigs', <GigsPage />)

    await userEvent.click(await screen.findByRole('button', { name: /book now/i }))
    await userEvent.click(screen.getByRole('button', { name: /confirm & pay/i }))

    expect(await screen.findByText(/too many booking attempts/i)).toBeInTheDocument()
  })
})
