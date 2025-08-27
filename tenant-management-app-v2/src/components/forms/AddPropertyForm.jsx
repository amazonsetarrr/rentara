import { useState, useEffect } from 'react'
import { propertiesService } from '../../services/properties'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Button from '../ui/Button'
import { useMalaysiaStateCity } from '../../hooks/useMalaysiaStateCity'

const PROPERTY_TYPES = [
  { value: 'apartment', label: 'Apartment Complex' },
  { value: 'house', label: 'Single Family House' },
  { value: 'duplex', label: 'Duplex' },
  { value: 'commercial', label: 'Commercial Building' },
  { value: 'condo', label: 'Condominium' }
]

export default function AddPropertyForm({ onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    zip_code: '',
    property_type: '',
    total_units: 0
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const {
    states,
    cities,
    selectedState,
    loadingStates,
    loadingCities,
    error: apiError,
    handleStateChange
  } = useMalaysiaStateCity()

  useEffect(() => {
    // Reset city when state changes
    setFormData(prev => ({ ...prev, city: '' }))
  }, [selectedState])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const submissionData = {
      ...formData,
      state: selectedState,
      total_units: parseInt(formData.total_units, 10) || 0
    }

    // Basic validation
    if (!submissionData.state || !submissionData.city) {
      setError("Please select both a state and a city.")
      setLoading(false)
      return
    }

    const { data, error } = await propertiesService.createProperty(submissionData)
    
    if (error) {
      setError(error.message)
    } else {
      onSuccess?.(data)
    }
    
    setLoading(false)
  }

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleStateSelectChange = (e) => {
    handleStateChange(e.target.value)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {(error || apiError) && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-600">{error || apiError}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <Input
            label="Property Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="e.g., Sunset Apartments"
          />
        </div>

        <div className="md:col-span-2">
          <Input
            label="Street Address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            required
            placeholder="e.g., 123 Main Street"
          />
        </div>

        <Select
          label="State"
          name="state"
          value={selectedState}
          onChange={handleStateSelectChange}
          options={states.map(s => ({ value: s, label: s }))}
          required
          placeholder={loadingStates ? "Loading states..." : "Select a state"}
          disabled={loadingStates}
        />

        <Select
          label="City"
          name="city"
          value={formData.city}
          onChange={handleChange}
          options={cities.map(c => ({ value: c, label: c }))}
          required
          placeholder={loadingCities ? "Loading cities..." : "Select a city"}
          disabled={!selectedState || loadingCities || cities.length === 0}
        />

        <Input
          label="ZIP Code"
          name="zip_code"
          value={formData.zip_code}
          onChange={handleChange}
          required
          placeholder="e.g., 94102"
        />

        <Select
          label="Property Type"
          name="property_type"
          value={formData.property_type}
          onChange={handleChange}
          options={PROPERTY_TYPES}
          required
          placeholder="Select property type"
        />

        <div className="md:col-span-2">
          <Input
            label="Total Units"
            type="number"
            name="total_units"
            value={formData.total_units}
            onChange={handleChange}
            min="0"
            placeholder="e.g., 24"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-6 border-t">
        <Button variant="outline" onClick={onCancel} type="button">
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          Create Property
        </Button>
      </div>
    </form>
  )
}