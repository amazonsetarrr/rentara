import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import SystemOwnerDashboard from '../../pages/SystemOwnerDashboard'
import { useSystemOwnerStore } from '../../stores/systemOwnerStore'

vi.mock('../../stores/systemOwnerStore')

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('SystemOwnerDashboard', () => {
  const mockFetchMetrics = vi.fn()
  const mockFetchOrganizations = vi.fn()
  const mockLogout = vi.fn()

  const mockMetrics = {
    totalOrganizations: 25,
    activeOrganizations: 20,
    totalRevenue: 15000,
    monthlyRevenue: 2500
  }

  const mockOrganizations = [
    {
      id: '1',
      name: 'Acme Corp',
      slug: 'acme-corp',
      subscription_plan: 'pro',
      subscription_status: 'active',
      created_at: '2024-01-01'
    },
    {
      id: '2',
      name: 'Tech Solutions',
      slug: 'tech-solutions',
      subscription_plan: 'basic',
      subscription_status: 'trial',
      created_at: '2024-01-15'
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    useSystemOwnerStore.mockReturnValue({
      user: { email: 'admin@example.com', role: 'system_owner' },
      metrics: mockMetrics,
      organizations: mockOrganizations,
      loading: false,
      fetchMetrics: mockFetchMetrics,
      fetchOrganizations: mockFetchOrganizations,
      logout: mockLogout
    })
  })

  it('renders dashboard with metrics and organizations', () => {
    renderWithRouter(<SystemOwnerDashboard />)
    
    expect(screen.getByText('SuperAdmin Dashboard')).toBeInTheDocument()
    expect(screen.getByText('25')).toBeInTheDocument()
    expect(screen.getByText('Total Organizations')).toBeInTheDocument()
    expect(screen.getByText('20')).toBeInTheDocument()
    expect(screen.getByText('Active Organizations')).toBeInTheDocument()
    expect(screen.getByText('$15,000')).toBeInTheDocument()
    expect(screen.getByText('Total Revenue')).toBeInTheDocument()
    expect(screen.getByText('$2,500')).toBeInTheDocument()
    expect(screen.getByText('Monthly Revenue')).toBeInTheDocument()
  })

  it('displays organizations table', () => {
    renderWithRouter(<SystemOwnerDashboard />)
    
    expect(screen.getByText('Organizations')).toBeInTheDocument()
    expect(screen.getByText('Acme Corp')).toBeInTheDocument()
    expect(screen.getByText('Tech Solutions')).toBeInTheDocument()
    expect(screen.getByText('PRO')).toBeInTheDocument()
    expect(screen.getByText('BASIC')).toBeInTheDocument()
    expect(screen.getByText('ACTIVE')).toBeInTheDocument()
    expect(screen.getByText('TRIAL')).toBeInTheDocument()
  })

  it('opens add organization modal when button is clicked', async () => {
    renderWithRouter(<SystemOwnerDashboard />)
    
    fireEvent.click(screen.getByText('Add Organization'))
    
    await waitFor(() => {
      expect(screen.getByText('Add New Organization')).toBeInTheDocument()
    })
  })

  it('handles logout when logout button is clicked', () => {
    renderWithRouter(<SystemOwnerDashboard />)
    
    fireEvent.click(screen.getByText('Logout'))
    
    expect(mockLogout).toHaveBeenCalledOnce()
  })

  it('fetches data on component mount', () => {
    renderWithRouter(<SystemOwnerDashboard />)
    
    expect(mockFetchMetrics).toHaveBeenCalledOnce()
    expect(mockFetchOrganizations).toHaveBeenCalledOnce()
  })

  it('shows loading state', () => {
    useSystemOwnerStore.mockReturnValue({
      user: { email: 'admin@example.com' },
      metrics: null,
      organizations: [],
      loading: true,
      fetchMetrics: mockFetchMetrics,
      fetchOrganizations: mockFetchOrganizations,
      logout: mockLogout
    })

    renderWithRouter(<SystemOwnerDashboard />)
    
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('handles empty organizations list', () => {
    useSystemOwnerStore.mockReturnValue({
      user: { email: 'admin@example.com' },
      metrics: mockMetrics,
      organizations: [],
      loading: false,
      fetchMetrics: mockFetchMetrics,
      fetchOrganizations: mockFetchOrganizations,
      logout: mockLogout
    })

    renderWithRouter(<SystemOwnerDashboard />)
    
    expect(screen.getByText('No organizations found')).toBeInTheDocument()
  })
})