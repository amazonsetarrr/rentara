import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Select from '../ui/Select'
import { paymentsService } from '../../services/payments'
import { tenantsService } from '../../services/tenants'
import { unitsService } from '../../services/units'
import { supabase } from '../../services/supabase'
import { useLogger } from '../../hooks/useLogger'

export default function AddPaymentModal({ isOpen, onClose, onPaymentCreated }) {
  const { logModalOpen, logModalClose, logFormSubmit, logError } = useLogger()
  const [formData, setFormData] = useState({
    tenant_id: '',
    unit_id: '',
    payment_type_id: '',
    amount: '',
    description: '',
    due_date: new Date().toISOString().split('T')[0],
    is_recurring: false,
    recurring_period: ''
  })
  const [tenants, setTenants] = useState([])
  const [units, setUnits] = useState([])
  const [paymentTypes, setPaymentTypes] = useState([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isOpen) {
      logModalOpen('Add Payment Modal')
      loadData()
    }
  }, [isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = async () => {
    try {
      const [tenantsResult, unitsResult, paymentTypesResult] = await Promise.all([
        tenantsService.getTenants(),
        unitsService.getUnits(),
        paymentsService.getPaymentTypes()
      ])

      if (tenantsResult.data) {
        setTenants(tenantsResult.data.map(tenant => ({
          value: tenant.id,
          label: `${tenant.full_name} (${tenant.email})`
        })))
      }

      if (unitsResult.data) {
        setUnits(unitsResult.data.map(unit => ({
          value: unit.id,
          label: `Unit ${unit.unit_number} - ${unit.properties?.name || 'Unknown Property'}`
        })))
      }

      if (paymentTypesResult.data) {
        setPaymentTypes(paymentTypesResult.data.map(type => ({
          value: type.id,
          label: type.display_name
        })))
      }
    } catch (error) {
      logError('Failed to load modal data', error)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.tenant_id) {
      newErrors.tenant_id = 'Tenant is required'
    }

    if (!formData.unit_id) {
      newErrors.unit_id = 'Unit is required'
    }

    if (!formData.payment_type_id) {
      newErrors.payment_type_id = 'Payment type is required'
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0'
    }

    if (!formData.due_date) {
      newErrors.due_date = 'Due date is required'
    }

    if (!formData.description?.trim()) {
      newErrors.description = 'Description is required'
    }

    if (formData.is_recurring && !formData.recurring_period) {
      newErrors.recurring_period = 'Recurring period is required for recurring payments'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    logFormSubmit('Add Payment Form', formData)
    
    if (!validateForm()) {
      logError('Form Validation Failed', 'Add Payment form validation errors', { errors })
      return
    }

    setLoading(true)
    try {
      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      const paymentData = {
        ...formData,
        amount: parseFloat(formData.amount),
        created_by: user.id
      }

      const { error } = await paymentsService.createPayment(paymentData)
      
      if (error) {
        throw error
      }

      // Call callback to refresh payments list
      if (onPaymentCreated) {
        onPaymentCreated()
      }

      // Close modal and reset form
      onClose()
      resetForm()
    } catch (error) {
      logError('Payment Creation Failed', error, { formData })
      setErrors({ submit: 'Failed to create payment. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      tenant_id: '',
      unit_id: '',
      payment_type_id: '',
      amount: '',
      description: '',
      due_date: new Date().toISOString().split('T')[0],
      is_recurring: false,
      recurring_period: ''
    })
    setErrors({})
  }

  const handleClose = () => {
    logModalClose('Add Payment Modal')
    resetForm()
    onClose()
  }

  const recurringPeriodOptions = [
    { value: '', label: 'Select period' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'yearly', label: 'Yearly' }
  ]

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      title="Add New Payment" 
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Tenant and Unit Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Tenant"
            value={formData.tenant_id}
            onChange={(e) => handleInputChange('tenant_id', e.target.value)}
            options={[
              { value: '', label: 'Select tenant' },
              ...tenants
            ]}
            error={errors.tenant_id}
            required
          />

          <Select
            label="Unit"
            value={formData.unit_id}
            onChange={(e) => handleInputChange('unit_id', e.target.value)}
            options={[
              { value: '', label: 'Select unit' },
              ...units
            ]}
            error={errors.unit_id}
            required
          />
        </div>

        {/* Payment Type and Amount */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Payment Type"
            value={formData.payment_type_id}
            onChange={(e) => handleInputChange('payment_type_id', e.target.value)}
            options={[
              { value: '', label: 'Select payment type' },
              ...paymentTypes
            ]}
            error={errors.payment_type_id}
            required
          />

          <Input
            label="Amount"
            type="number"
            step="0.01"
            min="0.01"
            value={formData.amount}
            onChange={(e) => handleInputChange('amount', e.target.value)}
            error={errors.amount}
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={3}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.description ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Payment description..."
            required
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
          )}
        </div>

        {/* Due Date */}
        <Input
          label="Due Date"
          type="date"
          value={formData.due_date}
          onChange={(e) => handleInputChange('due_date', e.target.value)}
          error={errors.due_date}
          required
        />

        {/* Recurring Payment Options */}
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              id="is_recurring"
              type="checkbox"
              checked={formData.is_recurring}
              onChange={(e) => handleInputChange('is_recurring', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="is_recurring" className="ml-2 block text-sm text-gray-700">
              This is a recurring payment
            </label>
          </div>

          {formData.is_recurring && (
            <Select
              label="Recurring Period"
              value={formData.recurring_period}
              onChange={(e) => handleInputChange('recurring_period', e.target.value)}
              options={recurringPeriodOptions}
              error={errors.recurring_period}
              required
            />
          )}
        </div>

        {errors.submit && (
          <div className="text-red-600 text-sm">{errors.submit}</div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4">
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
            variant="primary"
            loading={loading}
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Payment'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}