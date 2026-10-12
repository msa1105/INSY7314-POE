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
  test('client sees gigs with Request buttons; escaped text is shown as plain text', async () => {
    loginAs('client')
    mockFetch([200, { count: 2, gigs: GIGS }])
    const { container } = renderAt('/gigs', <GigsPage />)

    expect(await screen.findByText('Logo Design')).toBeInTheDocument()
    expect(screen.getByText('by Bob Freelancer')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /request job/i })).toHaveLength(2)

    // Stored-XSS payload is decoded for display but rendered as text, never as markup
    expect(screen.getByText('<script>alert(1)</script>')).toBeInTheDocument()
    expect(screen.getByText("Bob's escaped description.")).toBeInTheDocument()
    expect(container.querySelector('script')).toBeNull()
  })

  test('client sends a job request with work details and their own offer', async () => {
    loginAs('client')
    const fetchMock = mockFetch(
      [200, { count: 1, gigs: [GIGS[0]] }],
      [201, { transaction: { id: 't1', amount: 1200, gigTitle: 'Logo Design', status: 'pending' } }],
    )
    renderAt('/gigs', <GigsPage />)

    await userEvent.click(await screen.findByRole('button', { name: /request job/i }))

    const dialog = screen.getByRole('dialog')
    const amount = within(dialog).getByLabelText(/your offer/i)
    expect(amount).toHaveValue(1500) // defaults to the asking price
    await userEvent.type(within(dialog).getByLabelText(/work details/i), 'Logo for my bakery, warm colours.')
    await userEvent.clear(amount)
    await userEvent.type(amount, '1200')
    await userEvent.click(within(dialog).getByRole('button', { name: /send request/i }))

    expect(await screen.findByText(/request sent/i)).toBeInTheDocument()
    const [url, options] = fetchMock.mock.calls[1]
    expect(url).toBe('/api/transactions')
    expect(options.method).toBe('POST')
    expect(JSON.parse(options.body)).toEqual({ gigId: 'g1', details: 'Logo for my bakery, warm colours.', amount: 1200 })
    expect(options.headers.Authorization).toMatch(/^Bearer /)
  })

  test('invalid request input is caught inline and nothing is sent', async () => {
    loginAs('client')
    const fetchMock = mockFetch([200, { count: 1, gigs: [GIGS[0]] }])
    renderAt('/gigs', <GigsPage />)

    await userEvent.click(await screen.findByRole('button', { name: /request job/i }))
    const dialog = screen.getByRole('dialog')
    await userEvent.type(within(dialog).getByLabelText(/work details/i), 'short')
    await userEvent.clear(within(dialog).getByLabelText(/your offer/i))
    await userEvent.click(within(dialog).getByRole('button', { name: /send request/i }))

    expect(within(dialog).getByText(/work details must be 10/i)).toBeInTheDocument()
    expect(within(dialog).getByText(/amount is required/i)).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(1) // only the gig list request
  })

  test('cancelling the request form sends nothing', async () => {
    loginAs('client')
    const fetchMock = mockFetch([200, { count: 1, gigs: [GIGS[0]] }])
    renderAt('/gigs', <GigsPage />)

    await userEvent.click(await screen.findByRole('button', { name: /request job/i }))
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(1) // only the gig list request
  })

  test('freelancers cannot request gigs (no Request button)', async () => {
    loginAs('freelancer')
    mockFetch([200, { count: 1, gigs: [GIGS[0]] }])
    renderAt('/gigs', <GigsPage />)

    expect(await screen.findByText('Logo Design')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /request job/i })).not.toBeInTheDocument()
  })

  test('shows a friendly error if requests are rate limited', async () => {
    loginAs('client')
    mockFetch(
      [200, { count: 1, gigs: [GIGS[0]] }],
      [429, { error: 'Too many booking attempts. Please try again in 15 minutes.' }],
    )
    renderAt('/gigs', <GigsPage />)

    await userEvent.click(await screen.findByRole('button', { name: /request job/i }))
    await userEvent.type(screen.getByLabelText(/work details/i), 'Logo for my bakery, warm colours.')
    await userEvent.click(screen.getByRole('button', { name: /send request/i }))

    expect(await screen.findByText(/too many booking attempts/i)).toBeInTheDocument()
  })
})
