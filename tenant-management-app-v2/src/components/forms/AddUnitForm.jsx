import { useState, useEffect } from 'react'
import { unitsService } from '../../services/units'
import { propertiesService } from '../../services/properties'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Button from '../ui/Button'

const UNIT_TYPES = [
  { value: 'studio', label: 'Studio' },
  { value: '1br', label: '1 Bedroom' },
  { value: '2br', label: '2 Bedroom' },
  { value: '3br', label: '3 Bedroom' },
  { value: '4br', label: '4 Bedroom' },
  { value: '5br+', label: '5+ Bedroom' }
]

const UNIT_STATUSES = [
  { value: 'vacant', label: 'Vacant' },
  { value: 'occupied', label: 'Occupied' },
  { value: 'maintenance', label: 'Under Maintenance' },
  { value: 'unavailable', label: 'Unavailable' }
]

export default function AddUnitForm({ onSuccess, onCancel, propertyId = null }) {
  const [formData, setFormData] = useState({
    property_id: propertyId || '',
    unit_number: '',
    unit_type: '',
    rent_amount: '',
    deposit_amount: '',
    square_footage: '',
    bedrooms: 0,
    bathrooms: 1,
    status: 'vacant',
    description: '',
    amenities: []
  })
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingProperties, setLoadingProperties] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadProperties()
  }, [])

  const loadProperties = async () => {
    const { data } = await propertiesService.getPropertiesOptions()
    if (data) {
      setProperties(data.map(p => ({ value: p.id, label: p.name })))
    }
    setLoadingProperties(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error } = await unitsService.createUnit({
      ...formData,
      rent_amount: parseFloat(formData.rent_amount) || null,
      deposit_amount: parseFloat(formData.deposit_amount) || null,
      square_footage: parseInt(formData.square_footage) || null,
      bedrooms: parseInt(formData.bedrooms) || 0,
      bathrooms: parseFloat(formData.bathrooms) || 1,
      amenities: formData.amenities.filter(a => a.trim())
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

  const handleAmenitiesChange = (e) => {
    const amenities = e.target.value.split(',').map(a => a.trim())
    setFormData(prev => ({ ...prev, amenities }))
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
          <Select
            label="Property"
            name="property_id"
            value={formData.property_id}
            onChange={handleChange}
            options={properties}
            required
            placeholder={loadingProperties ? "Loading properties..." : "Select a property"}
            disabled={loadingProperties || !!propertyId}
          />
        </div>

        <Input
          label="Unit Number"
          name="unit_number"
          value={formData.unit_number}
          onChange={handleChange}
          required
          placeholder="e.g., 101, A1, Unit 5"
        />

        <Select
          label="Unit Type"
          name="unit_type"
          value={formData.unit_type}
          onChange={handleChange}
          options={UNIT_TYPES}
          required
          placeholder="Select unit type"
        />

        <Input
          label="Monthly Rent"
          type="number"
          name="rent_amount"
          value={formData.rent_amount}
          onChange={handleChange}
          step="0.01"
          min="0"
          placeholder="e.g., 1250.00"
        />

        <Input
          label="Security Deposit"
          type="number"
          name="deposit_amount"
          value={formData.deposit_amount}
          onChange={handleChange}
          step="0.01"
          min="0"
          placeholder="e.g., 1250.00"
        />

        <Input
          label="Square Footage"
          type="number"
          name="square_footage"
          value={formData.square_footage}
          onChange={handleChange}
          min="0"
          placeholder="e.g., 850"
        />

        <Input
          label="Bedrooms"
          type="number"
          name="bedrooms"
          value={formData.bedrooms}
          onChange={handleChange}
          min="0"
          max="10"
        />

        <Input
          label="Bathrooms"
          type="number"
          name="bathrooms"
          value={formData.bathrooms}
          onChange={handleChange}
          step="0.5"
          min="0.5"
          max="10"
        />

        <Select
          label="Status"
          name="status"
          value={formData.status}
          onChange={handleChange}
          options={UNIT_STATUSES}
          required
        />

        <div className="md:col-span-2">
          <Input
            label="Amenities"
            name="amenities"
            value={formData.amenities.join(', ')}
            onChange={handleAmenitiesChange}
            placeholder="e.g., Balcony, In-unit laundry, Parking (separate with commas)"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Additional details about the unit..."
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-6 border-t">
        <Button variant="outline" onClick={onCancel} type="button">
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          Create Unit
        </Button>
      </div>
    </form>
  )
}