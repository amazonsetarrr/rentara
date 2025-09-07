import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import App from '../App'
import { useAuthStore } from '../stores/authStore'

vi.mock('../stores/authStore')

// Mock all page components
vi.mock('../pages/AuthPage', () => ({
  default: () => <div>Auth Page</div>
}))

vi.mock('../pages/Dashboard', () => ({
  default: () => <div>Dashboard</div>
}))

vi.mock('../pages/PaymentsPage', () => ({
  default: () => <div>Payments Page</div>
}))

vi.mock('../SuperAdminApp', () => ({
  default: () => <div>SuperAdmin App</div>
}))

vi.mock('../components/layout/Layout', () => ({
  default: ({ children }) => <div data-testid="layout">{children}</div>
}))

vi.mock('../components/auth/ProtectedRoute', () => ({
  default: ({ children }) => <div data-testid="protected-route">{children}</div>
}))

describe('App', () => {
  const mockCheckAuth = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.mockReturnValue({
      user: null,
      loading: false,
      checkAuth: mockCheckAuth
    })
  })

  it('shows loading spinner when loading', () => {
    useAuthStore.mockReturnValue({
      user: null,
      loading: true,
      checkAuth: mockCheckAuth
    })

    render(<App />)
    
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('calls checkAuth on mount', () => {
    render(<App />)
    
    expect(mockCheckAuth).toHaveBeenCalledOnce()
  })

  it('renders SuperAdmin app for /superadmin routes', async () => {
    Object.defineProperty(window, 'location', {
      value: { pathname: '/superadmin' },
      writable: true
    })

    render(<App />)
    
    await waitFor(() => {
      expect(screen.getByText('SuperAdmin App')).toBeInTheDocument()
    })
  })

  it('redirects to dashboard when user is authenticated and on root', async () => {
    useAuthStore.mockReturnValue({
      user: { id: 'user-123', email: 'test@example.com' },
      loading: false,
      checkAuth: mockCheckAuth
    })

    render(<App />)
    
    await waitFor(() => {
      expect(screen.getByTestId('layout')).toBeInTheDocument()
    })
  })

  it('redirects to auth when user is not authenticated and on root', async () => {
    useAuthStore.mockReturnValue({
      user: null,
      loading: false,
      checkAuth: mockCheckAuth
    })

    render(<App />)
    
    await waitFor(() => {
      expect(screen.getByTestId('layout')).toBeInTheDocument()
    })
  })

  it('renders auth page when not authenticated', async () => {
    Object.defineProperty(window, 'location', {
      value: { pathname: '/auth' },
      writable: true
    })

    useAuthStore.mockReturnValue({
      user: null,
      loading: false,
      checkAuth: mockCheckAuth
    })

    render(<App />)
    
    await waitFor(() => {
      expect(screen.getByText('Auth Page')).toBeInTheDocument()
    })
  })

  it('renders dashboard when authenticated', async () => {
    Object.defineProperty(window, 'location', {
      value: { pathname: '/dashboard' },
      writable: true
    })

    useAuthStore.mockReturnValue({
      user: { id: 'user-123' },
      loading: false,
      checkAuth: mockCheckAuth
    })

    render(<App />)
    
    await waitFor(() => {
      expect(screen.getByTestId('protected-route')).toBeInTheDocument()
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
    })
  })

  it('renders payments page when authenticated', async () => {
    Object.defineProperty(window, 'location', {
      value: { pathname: '/payments' },
      writable: true
    })

    useAuthStore.mockReturnValue({
      user: { id: 'user-123' },
      loading: false,
      checkAuth: mockCheckAuth
    })

    render(<App />)
    
    await waitFor(() => {
      expect(screen.getByTestId('protected-route')).toBeInTheDocument()
      expect(screen.getByText('Payments Page')).toBeInTheDocument()
    })
  })

  it('renders placeholder for reports page', async () => {
    Object.defineProperty(window, 'location', {
      value: { pathname: '/reports' },
      writable: true
    })

    useAuthStore.mockReturnValue({
      user: { id: 'user-123' },
      loading: false,
      checkAuth: mockCheckAuth
    })

    render(<App />)
    
    await waitFor(() => {
      expect(screen.getByText('Reports')).toBeInTheDocument()
      expect(screen.getByText('Coming soon...')).toBeInTheDocument()
    })
  })

  it('renders placeholder for settings page', async () => {
    Object.defineProperty(window, 'location', {
      value: { pathname: '/settings' },
      writable: true
    })

    useAuthStore.mockReturnValue({
      user: { id: 'user-123' },
      loading: false,
      checkAuth: mockCheckAuth
    })

    render(<App />)
    
    await waitFor(() => {
      expect(screen.getByText('Settings')).toBeInTheDocument()
      expect(screen.getByText('Coming soon...')).toBeInTheDocument()
    })
  })
})