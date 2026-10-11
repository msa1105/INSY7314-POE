import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi } from 'vitest'
import GigForm from '../components/GigForm'
import { ApiError } from '../api/client'

describe('GigForm', () => {
  test('shows field errors for invalid input and does not submit', async () => {
    const onSubmit = vi.fn()
    render(<GigForm onSubmit={onSubmit} />)

    await userEvent.type(screen.getByLabelText(/title/i), 'abc')
    await userEvent.click(screen.getByRole('button', { name: /create gig/i }))

    expect(screen.getByText('Title must be 5–100 characters.')).toBeInTheDocument()
    expect(screen.getByText('Description is required.')).toBeInTheDocument()
    expect(screen.getByText('Price is required.')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  test('submits trimmed values with a numeric price and resets', async () => {
    const onSubmit = vi.fn().mockResolvedValue()
    render(<GigForm onSubmit={onSubmit} />)

    await userEvent.type(screen.getByLabelText(/title/i), '  Website Copywriting  ')
    await userEvent.type(screen.getByLabelText(/description/i), 'Engaging copy for your landing page.')
    await userEvent.type(screen.getByLabelText(/price/i), '750')
    await userEvent.type(screen.getByLabelText(/category/i), 'Writing')
    await userEvent.click(screen.getByRole('button', { name: /create gig/i }))

    expect(onSubmit).toHaveBeenCalledWith({
      title: 'Website Copywriting',
      description: 'Engaging copy for your landing page.',
      price: 750,
      category: 'Writing',
    })
    expect(screen.getByLabelText(/title/i)).toHaveValue('')
  })

  test('edit mode pre-fills decoded values and shows server validation errors', async () => {
    const onSubmit = vi.fn().mockRejectedValue(
      new ApiError(422, 'Validation failed.', [{ field: 'price', message: 'Price must be a number between 1 and 1 000 000.' }]),
    )
    const gig = { id: 'g1', title: 'Bob&#x27;s Logos', description: 'Logos &amp; branding done well.', price: 900, category: 'Design' }
    render(<GigForm initialGig={gig} onSubmit={onSubmit} onCancel={() => {}} />)

    expect(screen.getByLabelText(/title/i)).toHaveValue("Bob's Logos")
    expect(screen.getByLabelText(/description/i)).toHaveValue('Logos & branding done well.')

    await userEvent.click(screen.getByRole('button', { name: /save changes/i }))

    expect(await screen.findByText('Validation failed.')).toBeInTheDocument()
    expect(screen.getByText('Price must be a number between 1 and 1 000 000.')).toBeInTheDocument()
  })
})
