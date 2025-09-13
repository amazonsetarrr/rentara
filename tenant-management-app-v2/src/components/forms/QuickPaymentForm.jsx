import { useState, useEffect } from 'react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Select from '../ui/Select'
import { paymentsService } from '../../services/payments'
import { tenantsService } from '../../services/tenants'
import { supabase } from '../../services/supabase'
import { formatCurrency } from '../../utils/currency'
import { useLogger } from '../../hooks/useLogger'

export default function QuickPaymentForm({ onPaymentRecorded, onCancel }) {
  const { logFormSubmit, logError, logAction } = useLogger()
  const [formData, setFormData] = useState({
    tenant_id: '',
    payment_id: '',
    amount: '',
    payment_method_id: '',
    transaction_date: new Date().toISOString().split('T')[0],
    reference: '',
    notes: ''
  })
  
  const [tenants, setTenants] = useState([])
  const [pendingPayments, setPendingPayments] = useState([])
  const [paymentMethods, setPaymentMethods] = useState([])
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    if (formData.tenant_id) {
      loadTenantPayments(formData.tenant_id)
    } else {
      setPendingPayments([])
      setSelectedPayment(null)
      setFormData(prev => ({ ...prev, payment_id: '', amount: '' }))
    }
  }, [formData.tenant_id])

  useEffect(() => {
    if (formData.payment_id) {
      const payment = pendingPayments.find(p => p.id === formData.payment_id)
      setSelectedPayment(payment)
      if (payment) {
        const remainingAmount = payment.amount - (payment.paid_amount || 0)
        setFormData(prev => ({ ...prev, amount: remainingAmount.toString() }))
      }
    } else {
      setSelectedPayment(null)
      setFormData(prev => ({ ...prev, amount: '' }))
    }
  }, [formData.payment_id, pendingPayments])

  const loadInitialData = async () => {
    setDataLoading(true)
    try {
      const [tenantsResult, methodsResult] = await Promise.all([
        tenantsService.getTenants(),
        paymentsService.getPaymentMethods()
      ])

      if (tenantsResult.data) {
        setTenants(tenantsResult.data.map(tenant => ({
          value: tenant.id,
          label: `${tenant.full_name} ${tenant.email ? `(${tenant.email})` : ''}`
        })))
      }

      if (methodsResult.data) {
        setPaymentMethods(methodsResult.data.map(method => ({
          value: method.id,
          label: method.display_name
        })))
      }
    } catch (error) {
      logError('Failed to load payment form data', error)
    } finally {
      setDataLoading(false)
    }
  }

  const loadTenantPayments = async (tenantId) => {
    try {
      const { data } = await paymentsService.getPayments({ 
        tenant_id: tenantId,
        status: 'pending,partial,overdue' // Only show payments that can be paid
      })
      
      if (data) {
        const payablePayments = data.filter(payment => {
          const remainingAmount = payment.amount - (payment.paid_amount || 0)
          return remainingAmount > 0
        })
        setPendingPayments(payablePayments)
      }
    } catch (error) {
      logError('Failed to load tenant payments', error)
      setPendingPayments([])
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
      newErrors.tenant_id = 'Please select a tenant'
    }

    if (!formData.payment_id) {
      newErrors.payment_id = 'Please select a payment to record'
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0'
    }

    if (selectedPayment) {
      const maxAmount = selectedPayment.amount - (selectedPayment.paid_amount || 0)
      if (parseFloat(formData.amount) > maxAmount) {
        newErrors.amount = `Amount cannot exceed ${formatCurrency(maxAmount)}`
      }
    }

    if (!formData.payment_method_id) {
      newErrors.payment_method_id = 'Please select a payment method'
    }

    if (!formData.transaction_date) {
      newErrors.transaction_date = 'Transaction date is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    logFormSubmit('Quick Payment Form', {
      tenantId: formData.tenant_id,
      paymentId: formData.payment_id,
      amount: formData.amount
    })
    
    if (!validateForm()) {
      logError('Quick Payment Form Validation Failed', 'Form validation errors', { errors })
      return
    }

    setLoading(true)
    try {
      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      const transactionData = {
        payment_id: formData.payment_id,
        payment_method_id: formData.payment_method_id,
        amount: parseFloat(formData.amount),
        transaction_date: formData.transaction_date,
        reference: formData.reference,
        notes: formData.notes,
        recorded_by: user.id
      }

      const { data, error } = await paymentsService.recordPayment(transactionData)
      
      if (error) {
        throw error
      }

      logAction('Quick Payment Recorded Successfully', {
        tenantId: formData.tenant_id,
        paymentId: formData.payment_id,
        transactionId: data?.id,
        amount: parseFloat(formData.amount)
      })

      // Call callback to refresh dashboard
      if (onPaymentRecorded) {
        onPaymentRecorded()
      }

      // Reset form
      setFormData({
        tenant_id: '',
        payment_id: '',
        amount: '',
        payment_method_id: '',
        transaction_date: new Date().toISOString().split('T')[0],
        reference: '',
        notes: ''
      })
      setErrors({})
      setPendingPayments([])
      setSelectedPayment(null)

    } catch (error) {
      logError('Quick Payment Recording Failed', error, {
        paymentId: formData.payment_id,
        formData
      })
      setErrors({ submit: 'Failed to record payment. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  if (dataLoading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-sm text-gray-600">Loading payment form...</p>
      </div>
    )
  }

  return (
    <div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tenant Selection */}
          <Select
            label="Tenant"
            value={formData.tenant_id}
            onChange={(e) => handleInputChange('tenant_id', e.target.value)}
            options={[
              { value: '', label: 'Select tenant...' },
              ...tenants
            ]}
            error={errors.tenant_id}
            required
            disabled={loading}
          />

          {/* Payment Selection */}
          {formData.tenant_id && (
            <Select
              label="Payment to Record"
              value={formData.payment_id}
              onChange={(e) => handleInputChange('payment_id', e.target.value)}
              options={[
                { value: '', label: pendingPayments.length > 0 ? 'Select payment...' : 'No pending payments' },
                ...pendingPayments.map(payment => {
                  const remainingAmount = payment.amount - (payment.paid_amount || 0)
                  return {
                    value: payment.id,
                    label: `${payment.payment_type?.display_name || 'Payment'} - ${formatCurrency(remainingAmount)} (Due: ${new Date(payment.due_date).toLocaleDateString()})`
                  }
                })
              ]}
              error={errors.payment_id}
              required
              disabled={loading || pendingPayments.length === 0}
            />
          )}

          {/* Payment Details */}
          {selectedPayment && (
            <div className="bg-blue-50 p-3 rounded-lg text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-gray-600">Unit:</span>
                  <span className="ml-1 font-medium">{selectedPayment.unit?.unit_number}</span>
                </div>
                <div>
                  <span className="text-gray-600">Total:</span>
                  <span className="ml-1 font-medium">{formatCurrency(selectedPayment.amount)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Paid:</span>
                  <span className="ml-1 font-medium">{formatCurrency(selectedPayment.paid_amount || 0)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Remaining:</span>
                  <span className="ml-1 font-medium text-blue-600">
                    {formatCurrency(selectedPayment.amount - (selectedPayment.paid_amount || 0))}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Amount and Payment Method */}
          {formData.payment_id && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Payment Amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  error={errors.amount}
                  required
                  disabled={loading}
                />

                <Select
                  label="Payment Method"
                  value={formData.payment_method_id}
                  onChange={(e) => handleInputChange('payment_method_id', e.target.value)}
                  options={[
                    { value: '', label: 'Select method...' },
                    ...paymentMethods
                  ]}
                  error={errors.payment_method_id}
                  required
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Transaction Date"
                  type="date"
                  value={formData.transaction_date}
                  onChange={(e) => handleInputChange('transaction_date', e.target.value)}
                  error={errors.transaction_date}
                  required
                  disabled={loading}
                />

                <Input
                  label="Reference (Optional)"
                  type="text"
                  value={formData.reference}
                  onChange={(e) => handleInputChange('reference', e.target.value)}
                  placeholder="Check #, transaction ID..."
                  disabled={loading}
                />
              </div>

              {errors.submit && (
                <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
                  {errors.submit}
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onCancel}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="primary"
                  loading={loading}
                  disabled={loading}
                  className="flex items-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Recording...
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Record Payment
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </form>
    </div>
  )
}