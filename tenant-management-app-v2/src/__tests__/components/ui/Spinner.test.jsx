import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Spinner from '../../../components/ui/Spinner'

describe('Spinner', () => {
  it('renders with default size', () => {
    render(<Spinner />)
    
    const spinner = screen.getByRole('status')
    expect(spinner).toBeInTheDocument()
    expect(spinner).toHaveClass('w-8', 'h-8')
  })

  it('renders with small size', () => {
    render(<Spinner size="sm" />)
    
    const spinner = screen.getByRole('status')
    expect(spinner).toHaveClass('w-4', 'h-4')
  })

  it('renders with large size', () => {
    render(<Spinner size="lg" />)
    
    const spinner = screen.getByRole('status')
    expect(spinner).toHaveClass('w-12', 'h-12')
  })

  it('renders with extra large size', () => {
    render(<Spinner size="xl" />)
    
    const spinner = screen.getByRole('status')
    expect(spinner).toHaveClass('w-16', 'h-16')
  })

  it('applies custom className', () => {
    render(<Spinner className="custom-spinner" />)
    
    const spinner = screen.getByRole('status')
    expect(spinner).toHaveClass('custom-spinner')
  })

  it('has accessibility attributes', () => {
    render(<Spinner />)
    
    const spinner = screen.getByRole('status')
    expect(spinner).toHaveAttribute('role', 'status')
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('has spinning animation class', () => {
    render(<Spinner />)
    
    const spinner = screen.getByRole('status')
    expect(spinner.firstChild).toHaveClass('animate-spin')
  })
})