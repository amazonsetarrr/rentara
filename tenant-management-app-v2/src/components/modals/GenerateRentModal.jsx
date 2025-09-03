import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Select from '../ui/Select'
import { paymentsService } from '../../services/payments'
import { formatCurrency } from '../../utils/currency'
import { useLogger } from '../../hooks/useLogger'

export default function GenerateRentModal({ isOpen, onClose, onRentGenerated }) {
  const { logModalOpen, logModalClose, logFormSubmit, logError } = useLogger()
  const [formData, setFormData] = useState({
    month: new Date().getMonth() + 1, // Current month (1-12)
    year: new Date().getFullYear(),
    preview: false
  })
  const [rentSchedules, setRentSchedules] = useState([])
  const [loading, setLoading] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewData, setPreviewData] = useState(null)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isOpen) {
      logModalOpen('Generate Rent Modal')
      loadRentSchedules()
    }
  }, [isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadRentSchedules = async () => {
    try {
      const { data, error } = await paymentsService.getRentSchedules({ is_active: true })
      if (error) throw error
      setRentSchedules(data || [])
    } catch (error) {
      logError('Failed to load rent schedules', error)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear preview when month/year changes
    if (field === 'month' || field === 'year') {
      setPreviewData(null)
      setFormData(prev => ({ ...prev, preview: false }))
    }
    // Clear error when user makes changes
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.month || formData.month < 1 || formData.month > 12) {
      newErrors.month = 'Please select a valid month'
    }

    if (!formData.year || formData.year < new Date().getFullYear() - 1) {
      newErrors.year = 'Please select a valid year'
    }

    // Check if this is a future date or current month
    const selectedDate = new Date(formData.year, formData.month - 1, 1)
    const currentDate = new Date()
    currentDate.setDate(1) // Compare only year and month
    currentDate.setHours(0, 0, 0, 0)
    
    if (selectedDate < currentDate) {
      newErrors.general = 'Cannot generate rent for past months'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handlePreview = async () => {
    if (!validateForm()) {
      return
    }

    setPreviewLoading(true)
    try {
      // Get rent schedules and calculate what would be generated
      const schedules = rentSchedules || []
      const month = parseInt(formData.month)
      const year = parseInt(formData.year)
      
      // Get rent payment type
      const rentTypeResult = await paymentsService.getPaymentTypes()
      const rentType = rentTypeResult.data?.find(type => type.name === 'rent')
      
      const preview = {
        totalSchedules: schedules.length,
        totalAmount: 0,
        rentsToGenerate: [],
        existingPayments: []
      }

      for (const schedule of schedules) {
        const dueDate = new Date(year, month - 1, schedule.due_day)
        
        // Check if payment already exists for this month
        const { data: existingPayments } = await paymentsService.getPayments({
          tenant_id: schedule.tenant_id,
          payment_type: rentType?.id,
          from_date: `${year}-${String(month).padStart(2, '0')}-01`,
          to_date: `${year}-${String(month + 1 > 12 ? 1 : month + 1).padStart(2, '0')}-01`
        })

        if (existingPayments && existingPayments.length > 0) {
          preview.existingPayments.push({
            tenant: schedule.tenant?.full_name || 'Unknown Tenant',
            unit: schedule.unit?.unit_number || 'Unknown Unit',
            amount: schedule.rent_amount,
            existing: true
          })
        } else {
          preview.rentsToGenerate.push({
            tenant: schedule.tenant?.full_name || 'Unknown Tenant',
            unit: schedule.unit?.unit_number || 'Unknown Unit',
            amount: schedule.rent_amount,
            dueDate: dueDate.toLocaleDateString(),
            existing: false
          })
          preview.totalAmount += parseFloat(schedule.rent_amount) || 0
        }
      }

      setPreviewData(preview)
      setFormData(prev => ({ ...prev, preview: true }))
    } catch (error) {
      logError('Failed to generate preview', error)
      setErrors({ submit: 'Failed to generate preview. Please try again.' })
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    logFormSubmit('Generate Rent Form', formData)
    
    if (!validateForm()) {
      return
    }

    if (!formData.preview || !previewData) {
      setErrors({ submit: 'Please preview the rent generation first' })
      return
    }

    if (previewData.rentsToGenerate.length === 0) {
      setErrors({ submit: 'No new rent payments to generate' })
      return
    }

    setLoading(true)
    try {
      const { data, error } = await paymentsService.generateMonthlyRents(
        parseInt(formData.month),
        parseInt(formData.year)
      )
      
      if (error) {
        throw error
      }

      // Call callback to refresh payments list
      if (onRentGenerated) {
        onRentGenerated(data)
      }

      // Close modal and reset form
      onClose()
      resetForm()
    } catch (error) {
      logError('Rent Generation Failed', error, { formData })
      setErrors({ submit: 'Failed to generate rent payments. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      preview: false
    })
    setPreviewData(null)
    setErrors({})
  }

  const handleClose = () => {
    logModalClose('Generate Rent Modal')
    resetForm()
    onClose()
  }

  const monthOptions = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ]

  const yearOptions = []
  const currentYear = new Date().getFullYear()
  for (let i = currentYear; i <= currentYear + 2; i++) {
    yearOptions.push({ value: i, label: i.toString() })
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      title="Generate Monthly Rent" 
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Month and Year Selection */}
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Month"
            value={formData.month}
            onChange={(e) => handleInputChange('month', parseInt(e.target.value))}
            options={monthOptions}
            error={errors.month}
            required
          />

          <Select
            label="Year"
            value={formData.year}
            onChange={(e) => handleInputChange('year', parseInt(e.target.value))}
            options={yearOptions}
            error={errors.year}
            required
          />
        </div>

        {/* Active Rent Schedules Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-blue-700">
              <strong>{rentSchedules.length}</strong> active rent schedules found
              {rentSchedules.length > 0 && (
                <span className="block mt-1">
                  Click "Preview" to see which rent payments will be generated
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Preview Section */}
        {formData.preview && previewData && (
          <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
            <h4 className="font-medium text-gray-900 mb-3">Preview: Rent Generation Summary</h4>
            
            {previewData.rentsToGenerate.length > 0 && (
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h5 className="text-sm font-medium text-green-700">New Rent Payments to Generate</h5>
                  <span className="text-sm font-medium text-green-700">
                    Total: {formatCurrency(previewData.totalAmount)}
                  </span>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {previewData.rentsToGenerate.map((rent, index) => (
                    <div key={index} className="flex justify-between items-center text-sm bg-white p-2 rounded border">
                      <div>
                        <span className="font-medium">{rent.tenant}</span>
                        <span className="text-gray-500 ml-2">Unit {rent.unit}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(rent.amount)}</div>
                        <div className="text-xs text-gray-500">Due: {rent.dueDate}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {previewData.existingPayments.length > 0 && (
              <div>
                <h5 className="text-sm font-medium text-yellow-700 mb-2">Existing Payments (Will Skip)</h5>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {previewData.existingPayments.map((rent, index) => (
                    <div key={index} className="flex justify-between items-center text-sm bg-yellow-50 p-2 rounded border border-yellow-200">
                      <div>
                        <span className="font-medium">{rent.tenant}</span>
                        <span className="text-gray-500 ml-2">Unit {rent.unit}</span>
                      </div>
                      <span className="text-yellow-700 text-xs">Already exists</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {previewData.rentsToGenerate.length === 0 && previewData.existingPayments.length === 0 && (
              <div className="text-center text-gray-500 py-4">
                <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                No rent schedules available for the selected period
              </div>
            )}
          </div>
        )}

        {errors.general && (
          <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-md p-3">
            {errors.general}
          </div>
        )}

        {errors.submit && (
          <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-md p-3">
            {errors.submit}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleClose}
            disabled={loading || previewLoading}
          >
            Cancel
          </Button>
          
          <div className="flex space-x-3">
            {!formData.preview ? (
              <Button 
                type="button" 
                variant="secondary"
                onClick={handlePreview}
                loading={previewLoading}
                disabled={loading || previewLoading || rentSchedules.length === 0}
              >
                {previewLoading ? 'Loading...' : 'Preview'}
              </Button>
            ) : (
              <>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setFormData(prev => ({ ...prev, preview: false }))}
                  disabled={loading}
                >
                  Edit
                </Button>
                <Button 
                  type="submit" 
                  variant="primary"
                  loading={loading}
                  disabled={loading || !previewData || previewData.rentsToGenerate.length === 0}
                >
                  {loading ? 'Generating...' : `Generate ${previewData?.rentsToGenerate.length || 0} Rent${previewData?.rentsToGenerate.length === 1 ? '' : 's'}`}
                </Button>
              </>
            )}
          </div>
        </div>
      </form>
    </Modal>
  )
}