import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Select from '../ui/Select'
import { paymentsService } from '../../services/payments'
import { supabase } from '../../services/supabase'
import { formatCurrency } from '../../utils/currency'
import { useLogger } from '../../hooks/useLogger'

export default function RecordPaymentModal({ isOpen, onClose, payment, onPaymentRecorded }) {
  const { logModalOpen, logModalClose, logFormSubmit, logError, logAction } = useLogger()
  const [formData, setFormData] = useState({
    amount: '',
    payment_method_id: '',
    transaction_date: new Date().toISOString().split('T')[0],
    reference: '',
    notes: ''
  })
  const [paymentMethods, setPaymentMethods] = useState([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isOpen) {
      logModalOpen('Record Payment Modal', { paymentId: payment?.id })
      loadPaymentMethods()
      // Set default amount to remaining balance
      if (payment) {
        const remainingAmount = payment.amount - (payment.paid_amount || 0)
        setFormData(prev => ({
          ...prev,
          amount: remainingAmount.toString()
        }))
      }
    }
  }, [isOpen, payment, logModalOpen])

  const loadPaymentMethods = async () => {
    const { data } = await paymentsService.getPaymentMethods()
    if (data) {
      setPaymentMethods(data.map(method => ({
        value: method.id,
        label: method.display_name
      })))
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

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0'
    }

    const maxAmount = payment.amount - (payment.paid_amount || 0)
    if (parseFloat(formData.amount) > maxAmount) {
      newErrors.amount = `Amount cannot exceed ${formatCurrency(maxAmount)}`
    }

    if (!formData.payment_method_id) {
      newErrors.payment_method_id = 'Payment method is required'
    }

    if (!formData.transaction_date) {
      newErrors.transaction_date = 'Transaction date is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    logFormSubmit('Record Payment Form', {
      paymentId: payment?.id,
      amount: formData.amount,
      paymentMethodId: formData.payment_method_id
    })
    
    if (!validateForm()) {
      logError('Form Validation Failed', 'Record Payment form validation errors', { errors })
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
        payment_id: payment.id,
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

      logAction('Payment Recorded Successfully', {
        paymentId: payment.id,
        transactionId: data?.id,
        amount: parseFloat(formData.amount)
      })

      // Call callback to refresh payments list
      if (onPaymentRecorded) {
        onPaymentRecorded()
      }

      // Close modal and reset form
      onClose()
      setFormData({
        amount: '',
        payment_method_id: '',
        transaction_date: new Date().toISOString().split('T')[0],
        reference: '',
        notes: ''
      })
      setErrors({})
    } catch (error) {
      logError('Payment Recording Failed', error, {
        paymentId: payment?.id,
        formData
      })
      setErrors({ submit: 'Failed to record payment. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    logModalClose('Record Payment Modal', { paymentId: payment?.id })
    setFormData({
      amount: '',
      payment_method_id: '',
      transaction_date: new Date().toISOString().split('T')[0],
      reference: '',
      notes: ''
    })
    setErrors({})
    onClose()
  }

  if (!payment) {
    return null
  }

  const remainingAmount = payment.amount - (payment.paid_amount || 0)

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      title="Record Payment" 
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Payment Info */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Payment Details</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Tenant:</span>
              <span className="ml-2 font-medium">{payment.tenant?.full_name}</span>
            </div>
            <div>
              <span className="text-gray-600">Unit:</span>
              <span className="ml-2 font-medium">{payment.unit?.unit_number}</span>
            </div>
            <div>
              <span className="text-gray-600">Type:</span>
              <span className="ml-2 font-medium">{payment.payment_type?.display_name}</span>
            </div>
            <div>
              <span className="text-gray-600">Due Date:</span>
              <span className="ml-2 font-medium">
                {new Date(payment.due_date).toLocaleDateString()}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Total Amount:</span>
              <span className="ml-2 font-medium">{formatCurrency(payment.amount)}</span>
            </div>
            <div>
              <span className="text-gray-600">Remaining:</span>
              <span className="ml-2 font-medium text-blue-600">
                {formatCurrency(remainingAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        <Input
          label="Payment Amount"
          type="number"
          step="0.01"
          min="0.01"
          max={remainingAmount}
          value={formData.amount}
          onChange={(e) => handleInputChange('amount', e.target.value)}
          error={errors.amount}
          required
        />

        <Select
          label="Payment Method"
          value={formData.payment_method_id}
          onChange={(e) => handleInputChange('payment_method_id', e.target.value)}
          options={[
            { value: '', label: 'Select payment method' },
            ...paymentMethods
          ]}
          error={errors.payment_method_id}
          required
        />

        <Input
          label="Transaction Date"
          type="date"
          value={formData.transaction_date}
          onChange={(e) => handleInputChange('transaction_date', e.target.value)}
          error={errors.transaction_date}
          required
        />

        <Input
          label="Reference Number (Optional)"
          type="text"
          value={formData.reference}
          onChange={(e) => handleInputChange('reference', e.target.value)}
          placeholder="Check number, transaction ID, etc."
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes (Optional)
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Additional notes about this payment..."
          />
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
            {loading ? 'Recording...' : 'Record Payment'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}