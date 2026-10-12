import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi } from 'vitest'
import GigForm from '../components/GigForm'
import { ApiError } from '../api/client'

describe('GigForm', () => {
  test('renders step 1 with progress bar at 25% and navigates through steps', async () => {
    render(<GigForm onSubmit={vi.fn()} />)

    expect(screen.getByText('Step 1 of 4')).toBeInTheDocument()
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /back/i })).not.toBeInTheDocument()

    // Move to step 2
    await userEvent.click(screen.getByRole('button', { name: /next/i }))
    expect(screen.getByText('Step 2 of 4')).toBeInTheDocument()
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument()

    // Move to step 3
    await userEvent.click(screen.getByRole('button', { name: /next/i }))
    expect(screen.getByText('Step 3 of 4')).toBeInTheDocument()
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument()

    // Move to step 4
    await userEvent.click(screen.getByRole('button', { name: /next/i }))
    expect(screen.getByText('Step 4 of 4')).toBeInTheDocument()
    expect(screen.getByLabelText(/price/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /publish/i })).toBeInTheDocument()
  })

  test('submits trimmed values and shows Gig published message', async () => {
    const onSubmit = vi.fn().mockResolvedValue()
    render(<GigForm onSubmit={onSubmit} />)

    // Step 1: Title
    await userEvent.type(screen.getByLabelText(/title/i), '  Website Copywriting  ')
    await userEvent.click(screen.getByRole('button', { name: /next/i }))

    // Step 2: Description
    await userEvent.type(screen.getByLabelText(/description/i), 'Engaging copy for your landing page.')
    await userEvent.click(screen.getByRole('button', { name: /next/i }))

    // Step 3: Category
    await userEvent.selectOptions(screen.getByLabelText(/category/i), 'Writing')
    await userEvent.click(screen.getByRole('button', { name: /next/i }))

    // Step 4: Price & Publish
    await userEvent.type(screen.getByLabelText(/price/i), '750')
    await userEvent.click(screen.getByRole('button', { name: /publish/i }))

    expect(onSubmit).toHaveBeenCalledWith({
      title: 'Website Copywriting',
      description: 'Engaging copy for your landing page.',
      price: 750,
      category: 'Writing',
    })
    expect(await screen.findByText('Gig published')).toBeInTheDocument()
  })

  test('back button returns to previous step preserving entered values', async () => {
    render(<GigForm onSubmit={vi.fn()} />)

    await userEvent.type(screen.getByLabelText(/title/i), 'Modern Logo Design')
    await userEvent.click(screen.getByRole('button', { name: /next/i }))

    expect(screen.getByText('Step 2 of 4')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /back/i }))

    expect(screen.getByText('Step 1 of 4')).toBeInTheDocument()
    expect(screen.getByLabelText(/title/i)).toHaveValue('Modern Logo Design')
  })

  test('shows validation errors when publishing with invalid fields', async () => {
    const onSubmit = vi.fn()
    render(<GigForm onSubmit={onSubmit} />)

    // Advance to step 4 without filling in fields
    await userEvent.click(screen.getByRole('button', { name: /next/i }))
    await userEvent.click(screen.getByRole('button', { name: /next/i }))
    await userEvent.click(screen.getByRole('button', { name: /next/i }))
    await userEvent.click(screen.getByRole('button', { name: /publish/i }))

    // Should return to first invalid step (step 1: Title)
    expect(screen.getByText('Step 1 of 4')).toBeInTheDocument()
    expect(screen.getByText('Title is required.')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
