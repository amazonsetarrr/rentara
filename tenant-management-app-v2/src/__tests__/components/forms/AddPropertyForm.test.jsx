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

// Mock fetch
const mockFetch = vi.spyOn(global, 'fetch')

describe('AddPropertyForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock successful states response by default
    mockFetch.mockImplementation((url) => {
      if (url.toString().endsWith('/states')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([{ name: 'Johor' }, { name: 'Selangor' }]),
        })
      }
      if (url.toString().includes('/states/Johor')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([{ name: 'Johor Bahru' }, { name: 'Muar' }]),
        })
      }
      return Promise.resolve({ ok: false, json: () => Promise.resolve({ message: 'Not Found' }) })
    })
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
    fireEvent.change(screen.getByLabelText('ZIP Code'), { target: { value: '12345' } })
    fireEvent.change(screen.getByLabelText('Property Type'), { target: { value: 'apartment' } })
    fireEvent.change(screen.getByLabelText('Total Units'), { target: { value: '10' } })

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
        zip_code: '12345',
        property_type: 'apartment',
        total_units: 10,
      })
    })

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith({ id: 1 })
    })
  })

  it('shows an error message if fetching states fails', async () => {
    // Mock failed states response
    mockFetch.mockImplementation((url) => {
      if (url.toString().endsWith('/states')) {
        return Promise.resolve({ ok: false, status: 500 })
      }
      return Promise.resolve({ ok: false, json: () => Promise.resolve({ message: 'Not Found' }) })
    })

    render(<AddPropertyForm />)

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch states. Please try again later.')).toBeInTheDocument()
    })
  })

  it('shows an error message if fetching cities fails', async () => {
    // Mock failed cities response
    mockFetch.mockImplementation((url) => {
      if (url.toString().endsWith('/states')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([{ name: 'Johor' }]),
        })
      }
      if (url.toString().includes('/states/Johor')) {
        return Promise.resolve({ ok: false, status: 500 })
      }
      return Promise.resolve({ ok: false, json: () => Promise.resolve({ message: 'Not Found' }) })
    })

    render(<AddPropertyForm />)

    // Wait for states to load and select one
    await waitFor(() => {
      fireEvent.change(screen.getByLabelText('State'), { target: { value: 'Johor' } })
    })

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch cities for the selected state.')).toBeInTheDocument()
    })
  })
})
