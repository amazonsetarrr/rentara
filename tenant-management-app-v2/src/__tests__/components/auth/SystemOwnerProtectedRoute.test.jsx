import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import SystemOwnerProtectedRoute from '../../../components/auth/SystemOwnerProtectedRoute'
import { useSystemOwnerStore } from '../../../stores/systemOwnerStore'

vi.mock('../../../stores/systemOwnerStore')

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('SystemOwnerProtectedRoute', () => {
  it('renders children when superadmin is authenticated', () => {
    useSystemOwnerStore.mockReturnValue({
      user: { id: '1', email: 'admin@example.com', role: 'system_owner' },
      loading: false
    })

    renderWithRouter(
      <SystemOwnerProtectedRoute>
        <div>SuperAdmin Content</div>
      </SystemOwnerProtectedRoute>
    )

    expect(screen.getByText('SuperAdmin Content')).toBeInTheDocument()
  })

  it('redirects to superadmin auth when user is not authenticated', () => {
    useSystemOwnerStore.mockReturnValue({
      user: null,
      loading: false
    })

    renderWithRouter(
      <SystemOwnerProtectedRoute>
        <div>SuperAdmin Content</div>
      </SystemOwnerProtectedRoute>
    )

    expect(screen.queryByText('SuperAdmin Content')).not.toBeInTheDocument()
  })

  it('shows spinner while loading', () => {
    useSystemOwnerStore.mockReturnValue({
      user: null,
      loading: true
    })

    renderWithRouter(
      <SystemOwnerProtectedRoute>
        <div>SuperAdmin Content</div>
      </SystemOwnerProtectedRoute>
    )

    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.queryByText('SuperAdmin Content')).not.toBeInTheDocument()
  })
})