import { useState, useEffect } from 'react'
import { tenantsService } from '../../services/tenants'
import { unitsService } from '../../services/units'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Button from '../ui/Button'

const TENANT_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending Move-in' },
  { value: 'inactive', label: 'Inactive' }
]

export default function AddTenantForm({ onSuccess, onCancel, unitId = null }) {
  const [formData, setFormData] = useState({
    unit_id: unitId || '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    lease_start_date: '',
    lease_end_date: '',
    rent_amount: '',
    deposit_paid: '',
    security_deposit: '',
    status: 'active',
    move_in_date: '',
    notes: ''
  })
  const [units, setUnits] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingUnits, setLoadingUnits] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadUnits()
  }, [])

  const loadUnits = async () => {
    const { data, error } = await unitsService.getVacantUnits()
    if (data) {
      setUnits(data.map(u => ({
        value: u.id,
        label: `${u.properties.name} - Unit ${u.unit_number} (${u.unit_type})`
      })))
    }
    setLoadingUnits(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validation
    if (new Date(formData.lease_start_date) >= new Date(formData.lease_end_date)) {
      setError('Lease end date must be after start date')
      setLoading(false)
      return
    }

    const { data, error } = await tenantsService.createTenant({
      ...formData,
      rent_amount: parseFloat(formData.rent_amount) || null,
      deposit_paid: parseFloat(formData.deposit_paid) || null,
      security_deposit: parseFloat(formData.security_deposit) || null,
      lease_start_date: formData.lease_start_date || null,
      lease_end_date: formData.lease_end_date || null,
      move_in_date: formData.move_in_date || null
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
          <Select
            label="Unit"
            name="unit_id"
            value={formData.unit_id}
            onChange={handleChange}
            options={units}
            required
            placeholder={loadingUnits ? "Loading units..." : "Select a vacant unit"}
            disabled={loadingUnits || !!unitId}
          />
        </div>

        <Input
          label="First Name"
          name="first_name"
          value={formData.first_name}
          onChange={handleChange}
          required
          placeholder="John"
        />

        <Input
          label="Last Name"
          name="last_name"
          value={formData.last_name}
          onChange={handleChange}
          required
          placeholder="Smith"
        />

        <Input
          label="Email Address"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="john.smith@email.com"
        />

        <Input
          label="Phone Number"
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="(555) 123-4567"
        />

        <Input
          label="Emergency Contact Name"
          name="emergency_contact_name"
          value={formData.emergency_contact_name}
          onChange={handleChange}
          placeholder="Jane Smith"
        />

        <Input
          label="Emergency Contact Phone"
          type="tel"
          name="emergency_contact_phone"
          value={formData.emergency_contact_phone}
          onChange={handleChange}
          placeholder="(555) 987-6543"
        />

        <Input
          label="Lease Start Date"
          type="date"
          name="lease_start_date"
          value={formData.lease_start_date}
          onChange={handleChange}
          required
        />

        <Input
          label="Lease End Date"
          type="date"
          name="lease_end_date"
          value={formData.lease_end_date}
          onChange={handleChange}
          required
        />

        <Input
          label="Monthly Rent"
          type="number"
          name="rent_amount"
          value={formData.rent_amount}
          onChange={handleChange}
          step="0.01"
          min="0"
          placeholder="1250.00"
        />

        <Input
          label="Deposit Paid"
          type="number"
          name="deposit_paid"
          value={formData.deposit_paid}
          onChange={handleChange}
          step="0.01"
          min="0"
          placeholder="1250.00"
        />

        <Input
          label="Security Deposit"
          type="number"
          name="security_deposit"
          value={formData.security_deposit}
          onChange={handleChange}
          step="0.01"
          min="0"
          placeholder="1250.00"
        />

        <Input
          label="Move-in Date"
          type="date"
          name="move_in_date"
          value={formData.move_in_date}
          onChange={handleChange}
        />

        <div className="md:col-span-2">
          <Select
            label="Status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            options={TENANT_STATUSES}
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Additional notes about the tenant..."
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-6 border-t">
        <Button variant="outline" onClick={onCancel} type="button">
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          Add Tenant
        </Button>
      </div>
    </form>
  )
}