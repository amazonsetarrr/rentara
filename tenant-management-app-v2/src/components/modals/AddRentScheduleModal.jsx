import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Select from '../ui/Select'
import { paymentsService } from '../../services/payments'
import { tenantsService } from '../../services/tenants'
import { unitsService } from '../../services/units'
import { formatCurrency } from '../../utils/currency'

export default function AddRentScheduleModal({ isOpen, onClose, onScheduleCreated }) {
  const [formData, setFormData] = useState({
    tenant_id: '',
    unit_id: '',
    rent_amount: '',
    due_day: 1,
    start_date: '',
    end_date: '',
    late_fee_amount: '',
    late_fee_days: 7
  })
  
  const [tenants, setTenants] = useState([])
  const [units, setUnits] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isOpen) {
      loadData()
      resetForm()
    }
  }, [isOpen])

  const loadData = async () => {
    setLoadingData(true)
    try {
      const [tenantsResult, unitsResult] = await Promise.all([
        tenantsService.getTenants(),
        unitsService.getUnits()
      ])

      // Filter active tenants
      const activeTenants = (tenantsResult.data || [])
        .filter(tenant => tenant.status === 'active')
        .map(tenant => ({
          value: tenant.id,
          label: `${tenant.first_name} ${tenant.last_name}${tenant.units ? ` - Unit ${tenant.units.unit_number}` : ''}`
        }))

      setTenants(activeTenants)

      // All units for selection
      const allUnits = (unitsResult.data || []).map(unit => ({
        value: unit.id,
        label: `${unit.properties?.name} - Unit ${unit.unit_number} (${unit.unit_type})`
      }))

      setUnits(allUnits)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const resetForm = () => {
    const today = new Date()
    setFormData({
      tenant_id: '',
      unit_id: '',
      rent_amount: '',
      due_day: 1,
      start_date: today.toISOString().split('T')[0],
      end_date: '',
      late_fee_amount: '',
      late_fee_days: 7
    })
    setErrors({})
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user makes changes
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.tenant_id) {
      newErrors.tenant_id = 'Please select a tenant'
    }

    if (!formData.unit_id) {
      newErrors.unit_id = 'Please select a unit'
    }

    if (!formData.rent_amount || parseFloat(formData.rent_amount) <= 0) {
      newErrors.rent_amount = 'Please enter a valid rent amount'
    }

    if (!formData.due_day || formData.due_day < 1 || formData.due_day > 31) {
      newErrors.due_day = 'Due day must be between 1 and 31'
    }

    if (!formData.start_date) {
      newErrors.start_date = 'Please select a start date'
    }

    // Validate end date is after start date if provided
    if (formData.end_date && formData.start_date) {
      if (new Date(formData.end_date) <= new Date(formData.start_date)) {
        newErrors.end_date = 'End date must be after start date'
      }
    }

    if (formData.late_fee_amount && parseFloat(formData.late_fee_amount) < 0) {
      newErrors.late_fee_amount = 'Late fee amount cannot be negative'
    }

    if (formData.late_fee_days && (formData.late_fee_days < 1 || formData.late_fee_days > 365)) {
      newErrors.late_fee_days = 'Late fee days must be between 1 and 365'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      const scheduleData = {
        tenant_id: formData.tenant_id,
        unit_id: formData.unit_id,
        rent_amount: parseFloat(formData.rent_amount),
        due_day: parseInt(formData.due_day),
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        late_fee_amount: formData.late_fee_amount ? parseFloat(formData.late_fee_amount) : 0,
        late_fee_days: parseInt(formData.late_fee_days)
      }

      const { data, error } = await paymentsService.createRentSchedule(scheduleData)
      
      if (error) {
        throw error
      }

      // Call callback to refresh rent schedules list
      if (onScheduleCreated) {
        onScheduleCreated(data)
      }

      // Close modal and reset form
      onClose()
      resetForm()
    } catch (error) {
      console.error('Failed to create rent schedule:', error)
      setErrors({ submit: error.message || 'Failed to create rent schedule. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  // Generate options for due day
  const dueDayOptions = []
  for (let i = 1; i <= 31; i++) {
    dueDayOptions.push({ value: i, label: i.toString() })
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      title="Add Rent Schedule" 
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {loadingData ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-500">Loading tenants and units...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Tenant Selection */}
            <Select
              label="Tenant"
              value={formData.tenant_id}
              onChange={(e) => handleInputChange('tenant_id', e.target.value)}
              options={[{ value: '', label: 'Select a tenant' }, ...tenants]}
              error={errors.tenant_id}
              required
            />

            {/* Unit Selection */}
            <Select
              label="Unit"
              value={formData.unit_id}
              onChange={(e) => handleInputChange('unit_id', e.target.value)}
              options={[{ value: '', label: 'Select a unit' }, ...units]}
              error={errors.unit_id}
              required
            />

            {/* Rent Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Monthly Rent Amount (RM)"
                type="number"
                name="rent_amount"
                value={formData.rent_amount}
                onChange={(e) => handleInputChange('rent_amount', e.target.value)}
                step="0.01"
                min="0"
                placeholder="1500.00"
                error={errors.rent_amount}
                required
              />

              <Select
                label="Due Day of Month"
                value={formData.due_day}
                onChange={(e) => handleInputChange('due_day', parseInt(e.target.value))}
                options={dueDayOptions}
                error={errors.due_day}
                required
              />
            </div>

            {/* Schedule Period */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Start Date"
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={(e) => handleInputChange('start_date', e.target.value)}
                error={errors.start_date}
                required
              />

              <Input
                label="End Date (Optional)"
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={(e) => handleInputChange('end_date', e.target.value)}
                error={errors.end_date}
              />
            </div>

            {/* Late Fee Settings */}
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
              <h4 className="font-medium text-gray-900 mb-3">Late Fee Settings (Optional)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Late Fee Amount (RM)"
                  type="number"
                  name="late_fee_amount"
                  value={formData.late_fee_amount}
                  onChange={(e) => handleInputChange('late_fee_amount', e.target.value)}
                  step="0.01"
                  min="0"
                  placeholder="50.00"
                  error={errors.late_fee_amount}
                />

                <Input
                  label="Apply After Days"
                  type="number"
                  name="late_fee_days"
                  value={formData.late_fee_days}
                  onChange={(e) => handleInputChange('late_fee_days', parseInt(e.target.value))}
                  min="1"
                  max="365"
                  error={errors.late_fee_days}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Late fee will be applied automatically if payment is late by the specified number of days
              </p>
            </div>

            {/* Preview */}
            {formData.rent_amount && formData.due_day && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h4 className="font-medium text-blue-900 mb-2">Schedule Preview</h4>
                <div className="text-sm text-blue-800">
                  <p><strong>{formatCurrency(parseFloat(formData.rent_amount || 0))}</strong> due on the <strong>{formData.due_day}{getDaySuffix(formData.due_day)}</strong> of each month</p>
                  {formData.late_fee_amount && (
                    <p className="mt-1">Late fee of <strong>{formatCurrency(parseFloat(formData.late_fee_amount))}</strong> applies after {formData.late_fee_days} day{formData.late_fee_days > 1 ? 's' : ''}</p>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {errors.submit && (
          <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-md p-3">
            {errors.submit}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            loading={loading}
            disabled={loading || loadingData}
          >
            {loading ? 'Creating...' : 'Create Rent Schedule'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// Helper function to get day suffix (1st, 2nd, 3rd, etc.)
function getDaySuffix(day) {
  if (day >= 11 && day <= 13) {
    return 'th'
  }
  switch (day % 10) {
    case 1: return 'st'
    case 2: return 'nd'  
    case 3: return 'rd'
    default: return 'th'
  }
}