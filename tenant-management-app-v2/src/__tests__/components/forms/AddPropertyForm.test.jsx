import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AddPropertyForm from '../../../components/forms/AddPropertyForm'
import { propertiesService } from '../../../services/properties'

// Mock the propertiesService
vi.mock('../../../services/properties', () => ({
  propertiesService: {
    createProperty: vi.fn(),
  },
}))

// Mock the Malaysian data import
vi.mock('../../../data/malaysianStatesCities.json', () => ({
  default: {
    states: [
      {
        name: 'Johor',
        cities: ['Johor Bahru', 'Muar', 'Batu Pahat']
      },
      {
        name: 'Selangor', 
        cities: ['Petaling Jaya', 'Shah Alam', 'Subang Jaya']
      }
    ]
  }
}))

describe('AddPropertyForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Clear localStorage before each test
    localStorage.clear()
  })

  it('renders the form and allows property creation with state and city dropdowns', async () => {
    const onSuccess = vi.fn()
    const onCancel = vi.fn()
    render(<AddPropertyForm onSuccess={onSuccess} onCancel={onCancel} />)

    // Wait for states to load
    await waitFor(() => {
      expect(screen.getByLabelText('State')).toBeInTheDocument()
    })

    // Fill out the form
    fireEvent.change(screen.getByLabelText('Property Name'), { target: { value: 'Test Property' } })
    fireEvent.change(screen.getByLabelText('Street Address'), { target: { value: '123 Test St' } })
    fireEvent.change(screen.getByLabelText('Postcode'), { target: { value: '12345' } })
    fireEvent.change(screen.getByLabelText('Property Type'), { target: { value: 'apartment' } })

    // Select a state
    fireEvent.change(screen.getByLabelText('State'), { target: { value: 'Johor' } })

    // Wait for cities to load
    await waitFor(() => {
      expect(screen.getByLabelText('City')).toBeEnabled()
      expect(screen.getByText('Johor Bahru')).toBeInTheDocument()
    })

    // Select a city
    fireEvent.change(screen.getByLabelText('City'), { target: { value: 'Johor Bahru' } })

    // Mock successful property creation
    propertiesService.createProperty.mockResolvedValue({ data: { id: 1 }, error: null })

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: 'Create Property' }))

    await waitFor(() => {
      expect(propertiesService.createProperty).toHaveBeenCalledWith({
        name: 'Test Property',
        address: '123 Test St',
        city: 'Johor Bahru',
        state: 'Johor',
        postcode: '12345',
        property_type: 'apartment',
      })
    })

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith({ id: 1 })
    })
  })

  it('loads states from local data successfully', async () => {
    render(<AddPropertyForm />)

    // Wait for states to load from local data
    await waitFor(() => {
      expect(screen.getByText('Johor')).toBeInTheDocument()
      expect(screen.getByText('Selangor')).toBeInTheDocument()
    })
  })

  it('loads cities when a state is selected', async () => {
    render(<AddPropertyForm />)

    // Wait for states to load
    await waitFor(() => {
      expect(screen.getByText('Johor')).toBeInTheDocument()
    })

    // Select a state
    fireEvent.change(screen.getByLabelText('State'), { target: { value: 'Johor' } })

    // Wait for cities to load
    await waitFor(() => {
      expect(screen.getByText('Johor Bahru')).toBeInTheDocument()
      expect(screen.getByText('Muar')).toBeInTheDocument()
      expect(screen.getByText('Batu Pahat')).toBeInTheDocument()
    })
  })

  it('shows validation error when state and city are not selected', async () => {
    const onSuccess = vi.fn()
    render(<AddPropertyForm onSuccess={onSuccess} />)

    // Fill out other required fields
    fireEvent.change(screen.getByLabelText('Property Name'), { target: { value: 'Test Property' } })
    fireEvent.change(screen.getByLabelText('Street Address'), { target: { value: '123 Test St' } })
    fireEvent.change(screen.getByLabelText('Postcode'), { target: { value: '12345' } })
    fireEvent.change(screen.getByLabelText('Property Type'), { target: { value: 'apartment' } })

    // Submit without selecting state and city
    fireEvent.click(screen.getByRole('button', { name: 'Create Property' }))

    await waitFor(() => {
      expect(screen.getByText('Please select both a state and a city.')).toBeInTheDocument()
    })
  })
})