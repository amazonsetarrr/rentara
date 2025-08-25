import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import ProtectedRoute from '../../../components/auth/ProtectedRoute'
import { useAuthStore } from '../../../stores/authStore'

vi.mock('../../../stores/authStore')

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('ProtectedRoute', () => {
  it('renders children when user is authenticated', () => {
    useAuthStore.mockReturnValue({
      user: { id: '1', email: 'test@example.com' },
      loading: false
    })

    renderWithRouter(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('redirects to auth when user is not authenticated', () => {
    useAuthStore.mockReturnValue({
      user: null,
      loading: false
    })

    renderWithRouter(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('shows spinner while loading', () => {
    useAuthStore.mockReturnValue({
      user: null,
      loading: true
    })

    renderWithRouter(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })
})