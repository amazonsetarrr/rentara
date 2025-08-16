import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import PaymentsPage from '../../pages/PaymentsPage'
import { usePaymentStore } from '../../stores/paymentStore'

vi.mock('../../stores/paymentStore')

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('PaymentsPage', () => {
  const mockFetchPayments = vi.fn()
  const mockFetchAnalytics = vi.fn()

  const mockAnalytics = {
    totalPayments: 150000,
    pendingPayments: 25000,
    overduePayments: 8000,
    collectionRate: 92.5,
    monthlyTrend: [
      { month: 'Jan', collected: 12000, pending: 2000 },
      { month: 'Feb', collected: 13500, pending: 1800 }
    ]
  }

  const mockPayments = [
    {
      id: '1',
      tenant_name: 'John Doe',
      unit_number: 'A-101',
      amount: 1500,
      due_date: '2024-01-15',
      status: 'paid',
      payment_date: '2024-01-10',
      type: 'rent'
    },
    {
      id: '2',
      tenant_name: 'Jane Smith',
      unit_number: 'B-205',
      amount: 1200,
      due_date: '2024-01-15',
      status: 'pending',
      payment_date: null,
      type: 'rent'
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    usePaymentStore.mockReturnValue({
      payments: mockPayments,
      analytics: mockAnalytics,
      loading: false,
      error: null,
      fetchPayments: mockFetchPayments,
      fetchAnalytics: mockFetchAnalytics
    })
  })

  it('renders payments dashboard with analytics', () => {
    renderWithRouter(<PaymentsPage />)
    
    expect(screen.getByText('Rent & Payments')).toBeInTheDocument()
    expect(screen.getByText('$150,000')).toBeInTheDocument()
    expect(screen.getByText('Total Collected')).toBeInTheDocument()
    expect(screen.getByText('$25,000')).toBeInTheDocument()
    expect(screen.getByText('Pending')).toBeInTheDocument()
    expect(screen.getByText('$8,000')).toBeInTheDocument()
    expect(screen.getByText('Overdue')).toBeInTheDocument()
    expect(screen.getByText('92.5%')).toBeInTheDocument()
    expect(screen.getByText('Collection Rate')).toBeInTheDocument()
  })

  it('displays payments table with data', () => {
    renderWithRouter(<PaymentsPage />)
    
    expect(screen.getByText('Recent Payments')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    expect(screen.getByText('A-101')).toBeInTheDocument()
    expect(screen.getByText('B-205')).toBeInTheDocument()
    expect(screen.getByText('$1,500')).toBeInTheDocument()
    expect(screen.getByText('$1,200')).toBeInTheDocument()
    expect(screen.getByText('PAID')).toBeInTheDocument()
    expect(screen.getByText('PENDING')).toBeInTheDocument()
  })

  it('filters payments by status', async () => {
    renderWithRouter(<PaymentsPage />)
    
    const statusFilter = screen.getByDisplayValue('All Status')
    fireEvent.change(statusFilter, { target: { value: 'pending' } })
    
    await waitFor(() => {
      expect(mockFetchPayments).toHaveBeenCalledWith({ status: 'pending' })
    })
  })

  it('filters payments by type', async () => {
    renderWithRouter(<PaymentsPage />)
    
    const typeFilter = screen.getByDisplayValue('All Types')
    fireEvent.change(typeFilter, { target: { value: 'rent' } })
    
    await waitFor(() => {
      expect(mockFetchPayments).toHaveBeenCalledWith({ type: 'rent' })
    })
  })

  it('searches payments by tenant name', async () => {
    renderWithRouter(<PaymentsPage />)
    
    const searchInput = screen.getByPlaceholderText('Search tenant, unit...')
    fireEvent.change(searchInput, { target: { value: 'John' } })
    
    await waitFor(() => {
      expect(mockFetchPayments).toHaveBeenCalledWith({ search: 'John' })
    })
  })

  it('shows loading state', () => {
    usePaymentStore.mockReturnValue({
      payments: [],
      analytics: null,
      loading: true,
      error: null,
      fetchPayments: mockFetchPayments,
      fetchAnalytics: mockFetchAnalytics
    })

    renderWithRouter(<PaymentsPage />)
    
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('displays error message when fetch fails', () => {
    usePaymentStore.mockReturnValue({
      payments: [],
      analytics: null,
      loading: false,
      error: 'Failed to fetch payments',
      fetchPayments: mockFetchPayments,
      fetchAnalytics: mockFetchAnalytics
    })

    renderWithRouter(<PaymentsPage />)
    
    expect(screen.getByText('Failed to fetch payments')).toBeInTheDocument()
  })

  it('handles empty payments list', () => {
    usePaymentStore.mockReturnValue({
      payments: [],
      analytics: mockAnalytics,
      loading: false,
      error: null,
      fetchPayments: mockFetchPayments,
      fetchAnalytics: mockFetchAnalytics
    })

    renderWithRouter(<PaymentsPage />)
    
    expect(screen.getByText('No payments found')).toBeInTheDocument()
  })

  it('fetches data on component mount', () => {
    renderWithRouter(<PaymentsPage />)
    
    expect(mockFetchPayments).toHaveBeenCalledOnce()
    expect(mockFetchAnalytics).toHaveBeenCalledOnce()
  })

  it('opens record payment modal', async () => {
    renderWithRouter(<PaymentsPage />)
    
    fireEvent.click(screen.getByText('Record Payment'))
    
    await waitFor(() => {
      expect(screen.getByText('Record New Payment')).toBeInTheDocument()
    })
  })

  it('opens generate rent modal', async () => {
    renderWithRouter(<PaymentsPage />)
    
    fireEvent.click(screen.getByText('Generate Monthly Rent'))
    
    await waitFor(() => {
      expect(screen.getByText('Generate Monthly Rent')).toBeInTheDocument()
    })
  })
})