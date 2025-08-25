import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AddOrganizationModal from '../../../components/modals/AddOrganizationModal'
import { useSystemOwnerStore } from '../../../stores/systemOwnerStore'

vi.mock('../../../stores/systemOwnerStore')

describe('AddOrganizationModal', () => {
  const mockCreateOrganization = vi.fn()
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    useSystemOwnerStore.mockReturnValue({
      createOrganization: mockCreateOrganization,
      loading: false
    })
  })

  it('renders modal when isOpen is true', () => {
    render(
      <AddOrganizationModal 
        isOpen={true} 
        onClose={mockOnClose} 
      />
    )
    
    expect(screen.getByText('Add New Organization')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Organization Name')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('admin@company.com')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('does not render modal when isOpen is false', () => {
    render(
      <AddOrganizationModal 
        isOpen={false} 
        onClose={mockOnClose} 
      />
    )
    
    expect(screen.queryByText('Add New Organization')).not.toBeInTheDocument()
  })

  it('generates slug automatically from organization name', async () => {
    render(
      <AddOrganizationModal 
        isOpen={true} 
        onClose={mockOnClose} 
      />
    )
    
    const nameInput = screen.getByPlaceholderText('Organization Name')
    fireEvent.change(nameInput, { target: { value: 'Acme Corporation' } })
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('acme-corporation')).toBeInTheDocument()
    })
  })

  it('handles form submission with valid data', async () => {
    mockCreateOrganization.mockResolvedValue({ success: true })
    render(
      <AddOrganizationModal 
        isOpen={true} 
        onClose={mockOnClose} 
      />
    )
    
    fireEvent.change(screen.getByPlaceholderText('Organization Name'), {
      target: { value: 'Test Corp' }
    })
    fireEvent.change(screen.getByPlaceholderText('admin@company.com'), {
      target: { value: 'admin@testcorp.com' }
    })
    
    fireEvent.click(screen.getByRole('button', { name: /create organization/i }))
    
    await waitFor(() => {
      expect(mockCreateOrganization).toHaveBeenCalledWith({
        name: 'Test Corp',
        slug: 'test-corp',
        adminEmail: 'admin@testcorp.com',
        subscriptionPlan: 'basic'
      })
    })
  })

  it('validates required fields', async () => {
    render(
      <AddOrganizationModal 
        isOpen={true} 
        onClose={mockOnClose} 
      />
    )
    
    fireEvent.click(screen.getByRole('button', { name: /create organization/i }))
    
    await waitFor(() => {
      expect(screen.getByText('Organization name is required')).toBeInTheDocument()
      expect(screen.getByText('Admin email is required')).toBeInTheDocument()
    })
    
    expect(mockCreateOrganization).not.toHaveBeenCalled()
  })

  it('validates email format', async () => {
    render(
      <AddOrganizationModal 
        isOpen={true} 
        onClose={mockOnClose} 
      />
    )
    
    fireEvent.change(screen.getByPlaceholderText('Organization Name'), {
      target: { value: 'Test Corp' }
    })
    fireEvent.change(screen.getByPlaceholderText('admin@company.com'), {
      target: { value: 'invalid-email' }
    })
    
    fireEvent.click(screen.getByRole('button', { name: /create organization/i }))
    
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email')).toBeInTheDocument()
    })
    
    expect(mockCreateOrganization).not.toHaveBeenCalled()
  })

  it('closes modal on cancel', () => {
    render(
      <AddOrganizationModal 
        isOpen={true} 
        onClose={mockOnClose} 
      />
    )
    
    fireEvent.click(screen.getByText('Cancel'))
    
    expect(mockOnClose).toHaveBeenCalledOnce()
  })

  it('shows loading state during creation', () => {
    useSystemOwnerStore.mockReturnValue({
      createOrganization: mockCreateOrganization,
      loading: true
    })

    render(
      <AddOrganizationModal 
        isOpen={true} 
        onClose={mockOnClose} 
      />
    )
    
    expect(screen.getByText('Creating...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /creating/i })).toBeDisabled()
  })

  it('displays error message on creation failure', async () => {
    mockCreateOrganization.mockResolvedValue({ 
      success: false, 
      error: { message: 'Organization already exists' }
    })
    
    render(
      <AddOrganizationModal 
        isOpen={true} 
        onClose={mockOnClose} 
      />
    )
    
    fireEvent.change(screen.getByPlaceholderText('Organization Name'), {
      target: { value: 'Test Corp' }
    })
    fireEvent.change(screen.getByPlaceholderText('admin@company.com'), {
      target: { value: 'admin@testcorp.com' }
    })
    
    fireEvent.click(screen.getByRole('button', { name: /create organization/i }))
    
    await waitFor(() => {
      expect(screen.getByText('Organization already exists')).toBeInTheDocument()
    })
  })
})