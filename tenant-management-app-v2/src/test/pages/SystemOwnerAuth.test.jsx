import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import SystemOwnerAuth from '../../pages/SystemOwnerAuth'
import { useSystemOwnerStore } from '../../stores/systemOwnerStore'

vi.mock('../../stores/systemOwnerStore')

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('SystemOwnerAuth', () => {
  const mockLogin = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    useSystemOwnerStore.mockReturnValue({
      user: null,
      loading: false,
      error: null,
      login: mockLogin
    })
  })

  it('renders login form', () => {
    renderWithRouter(<SystemOwnerAuth />)
    
    expect(screen.getByText('SuperAdmin Portal')).toBeInTheDocument()
    expect(screen.getByText('Sign in to your account')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Email address')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('handles form submission with valid credentials', async () => {
    mockLogin.mockResolvedValue({ success: true })
    renderWithRouter(<SystemOwnerAuth />)
    
    fireEvent.change(screen.getByPlaceholderText('Email address'), {
      target: { value: 'admin@example.com' }
    })
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'password123' }
    })
    
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('admin@example.com', 'password123')
    })
  })

  it('displays loading state during authentication', () => {
    useSystemOwnerStore.mockReturnValue({
      user: null,
      loading: true,
      error: null,
      login: mockLogin
    })
    
    renderWithRouter(<SystemOwnerAuth />)
    
    expect(screen.getByText('Signing in...')).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('displays error message on login failure', () => {
    useSystemOwnerStore.mockReturnValue({
      user: null,
      loading: false,
      error: 'Invalid credentials',
      login: mockLogin
    })
    
    renderWithRouter(<SystemOwnerAuth />)
    
    expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    renderWithRouter(<SystemOwnerAuth />)
    
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    
    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument()
      expect(screen.getByText('Password is required')).toBeInTheDocument()
    })
    
    expect(mockLogin).not.toHaveBeenCalled()
  })

  it('validates email format', async () => {
    renderWithRouter(<SystemOwnerAuth />)
    
    fireEvent.change(screen.getByPlaceholderText('Email address'), {
      target: { value: 'invalid-email' }
    })
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'password123' }
    })
    
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email')).toBeInTheDocument()
    })
    
    expect(mockLogin).not.toHaveBeenCalled()
  })
})