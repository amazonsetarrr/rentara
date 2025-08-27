import { useState } from 'react'
import { propertiesService } from '../../services/properties'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Button from '../ui/Button'
import { PROPERTY_TYPES } from '../../utils/constants'

export default function EditPropertyForm({ property, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    name: property?.name || '',
    address: property?.address || '',
    city: property?.city || '',
    state: property?.state || '',
    zip_code: property?.zip_code || '',
    property_type: property?.property_type || '',
    total_units: property?.total_units || 0
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error } = await propertiesService.updateProperty(property.id, {
      ...formData,
      total_units: parseInt(formData.total_units) || 0
    })
    
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-600">{error}</p>
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

        <Input
          label="City"
          name="city"
          value={formData.city}
          onChange={handleChange}
          required
          placeholder="e.g., San Francisco"
        />

        <Input
          label="State"
          name="state"
          value={formData.state}
          onChange={handleChange}
          required
          placeholder="e.g., CA"
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
          Update Property
        </Button>
      </div>
    </form>
  )
}