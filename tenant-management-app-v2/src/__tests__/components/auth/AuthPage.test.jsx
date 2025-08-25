import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import AuthPage from '../../../pages/AuthPage'
import { useAuthStore } from '../../../stores/authStore'

vi.mock('../../../stores/authStore')

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('AuthPage', () => {
  const mockSignIn = vi.fn()
  const mockSignUp = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.mockReturnValue({
      user: null,
      loading: false,
      signIn: mockSignIn,
      signUp: mockSignUp
    })
  })

  it('renders login form by default', () => {
    renderWithRouter(<AuthPage />)
    
    expect(screen.getByText('Sign in to your account')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Email address')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('switches to signup form when create account is clicked', async () => {
    renderWithRouter(<AuthPage />)
    
    fireEvent.click(screen.getByText('Create your account'))
    
    await waitFor(() => {
      expect(screen.getByText('Create your account')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Full name')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
    })
  })

  it('handles login form submission', async () => {
    mockSignIn.mockResolvedValue({ success: true })
    renderWithRouter(<AuthPage />)
    
    fireEvent.change(screen.getByPlaceholderText('Email address'), {
      target: { value: 'test@example.com' }
    })
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'password123' }
    })
    
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123')
    })
  })

  it('handles signup form submission', async () => {
    mockSignUp.mockResolvedValue({ success: true })
    renderWithRouter(<AuthPage />)
    
    fireEvent.click(screen.getByText('Create your account'))
    
    await waitFor(() => {
      fireEvent.change(screen.getByPlaceholderText('Full name'), {
        target: { value: 'John Doe' }
      })
      fireEvent.change(screen.getByPlaceholderText('Email address'), {
        target: { value: 'john@example.com' }
      })
      fireEvent.change(screen.getByPlaceholderText('Password'), {
        target: { value: 'password123' }
      })
      fireEvent.change(screen.getByPlaceholderText('Confirm password'), {
        target: { value: 'password123' }
      })
      
      fireEvent.click(screen.getByRole('button', { name: /create account/i }))
    })
    
    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'john@example.com',
        password: 'password123',
        fullName: 'John Doe'
      })
    })
  })

  it('displays error message on login failure', async () => {
    mockSignIn.mockResolvedValue({ 
      success: false, 
      error: { message: 'Invalid credentials' }
    })
    renderWithRouter(<AuthPage />)
    
    fireEvent.change(screen.getByPlaceholderText('Email address'), {
      target: { value: 'test@example.com' }
    })
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'wrongpassword' }
    })
    
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    
    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })
  })

  it('validates password confirmation in signup', async () => {
    renderWithRouter(<AuthPage />)
    
    fireEvent.click(screen.getByText('Create your account'))
    
    await waitFor(() => {
      fireEvent.change(screen.getByPlaceholderText('Password'), {
        target: { value: 'password123' }
      })
      fireEvent.change(screen.getByPlaceholderText('Confirm password'), {
        target: { value: 'different123' }
      })
      
      fireEvent.click(screen.getByRole('button', { name: /create account/i }))
    })
    
    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
    })
    
    expect(mockSignUp).not.toHaveBeenCalled()
  })
})