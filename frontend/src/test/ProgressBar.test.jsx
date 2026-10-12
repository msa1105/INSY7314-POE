import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import ProgressBar from '../components/ProgressBar'

describe('ProgressBar', () => {
  test('renders step count text and calculates width percentage correctly', () => {
    const { rerender } = render(<ProgressBar step={1} totalSteps={4} />)

    expect(screen.getByText('Step 1 of 4')).toBeInTheDocument()
    const fill = document.querySelector('.progress-bar__fill')
    expect(fill).toHaveStyle({ width: '25%' })

    rerender(<ProgressBar step={2} totalSteps={4} />)
    expect(screen.getByText('Step 2 of 4')).toBeInTheDocument()
    expect(fill).toHaveStyle({ width: '50%' })

    rerender(<ProgressBar step={4} totalSteps={4} />)
    expect(screen.getByText('Step 4 of 4')).toBeInTheDocument()
    expect(fill).toHaveStyle({ width: '100%' })
  })
})
