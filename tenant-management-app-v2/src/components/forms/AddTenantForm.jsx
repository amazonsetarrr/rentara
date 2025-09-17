import { useState, useEffect } from 'react'
import { tenantsService } from '../../services/tenants'
import { unitsService } from '../../services/units'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Button from '../ui/Button'
import {
  validateMalaysianIC,
  validateMalaysianPhone,
  validateRinggitAmount,
  formatMalaysianIC,
  formatMalaysianPhone,
  formatRinggit,
  MALAYSIAN_NATIONALITIES,
  WORK_PERMIT_TYPES,
  calculateMalaysianDeposit
} from '../../utils/malaysianValidation'

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
    ic_number: '',
    nationality: 'malaysian',
    work_permit_type: 'none',
    visa_expiry_date: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    guarantor_name: '',
    guarantor_phone: '',
    guarantor_ic: '',
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
  const [validationErrors, setValidationErrors] = useState({})
  const [depositCalculation, setDepositCalculation] = useState(null)

  useEffect(() => {
    loadUnits()
  }, [])

  useEffect(() => {
    if (formData.rent_amount) {
      const calculation = calculateMalaysianDeposit(formData.rent_amount)
      setDepositCalculation(calculation)
    } else {
      setDepositCalculation(null)
    }
  }, [formData.rent_amount])

  const loadUnits = async () => {
    const { data, error } = await unitsService.getVacantUnits()
    
    if (error) {
      setError('Failed to load vacant units: ' + error.message)
    } else if (data) {
      setUnits([
        { value: '', label: 'No unit assigned (can assign later)' },
        ...data.map(u => ({
          value: u.id,
          label: `${u.properties.name} - Unit ${u.unit_number} (${u.unit_type})`
        }))
      ])
    }
    setLoadingUnits(false)
  }

  const validateForm = () => {
    const errors = {}

    // Malaysian IC validation
    if (formData.ic_number) {
      const icValidation = validateMalaysianIC(formData.ic_number)
      if (!icValidation.isValid) {
        errors.ic_number = icValidation.error
      }
    }

    // Phone number validation
    if (formData.phone) {
      const phoneValidation = validateMalaysianPhone(formData.phone)
      if (!phoneValidation.isValid) {
        errors.phone = phoneValidation.error
      }
    }

    // Emergency contact phone validation
    if (formData.emergency_contact_phone) {
      const emergencyPhoneValidation = validateMalaysianPhone(formData.emergency_contact_phone)
      if (!emergencyPhoneValidation.isValid) {
        errors.emergency_contact_phone = emergencyPhoneValidation.error
      }
    }

    // Guarantor phone validation
    if (formData.guarantor_phone) {
      const guarantorPhoneValidation = validateMalaysianPhone(formData.guarantor_phone)
      if (!guarantorPhoneValidation.isValid) {
        errors.guarantor_phone = guarantorPhoneValidation.error
      }
    }

    // Guarantor IC validation
    if (formData.guarantor_ic) {
      const guarantorIcValidation = validateMalaysianIC(formData.guarantor_ic)
      if (!guarantorIcValidation.isValid) {
        errors.guarantor_ic = guarantorIcValidation.error
      }
    }

    // Currency validations
    if (formData.rent_amount) {
      const rentValidation = validateRinggitAmount(formData.rent_amount)
      if (!rentValidation.isValid) {
        errors.rent_amount = rentValidation.error
      }
    }

    if (formData.deposit_paid) {
      const depositValidation = validateRinggitAmount(formData.deposit_paid)
      if (!depositValidation.isValid) {
        errors.deposit_paid = depositValidation.error
      }
    }

    if (formData.security_deposit) {
      const securityValidation = validateRinggitAmount(formData.security_deposit)
      if (!securityValidation.isValid) {
        errors.security_deposit = securityValidation.error
      }
    }

    // Lease date validation
    if (formData.lease_start_date && formData.lease_end_date) {
      if (new Date(formData.lease_start_date) >= new Date(formData.lease_end_date)) {
        errors.lease_end_date = 'Lease end date must be after start date'
      }
    }

    // Visa expiry validation for non-Malaysians
    if (formData.nationality !== 'malaysian' && formData.work_permit_type !== 'none') {
      if (!formData.visa_expiry_date) {
        errors.visa_expiry_date = 'Visa expiry date is required for foreign tenants'
      }
    }

    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)
    setError('')

    // If no unit is assigned, set status to pending instead of active
    const submissionData = {
      ...formData,
      // Convert empty unit_id to null
      unit_id: formData.unit_id || null,
      // If no unit assigned and status is active, change to pending
      status: !formData.unit_id && formData.status === 'active' ? 'pending' : formData.status,
      rent_amount: parseFloat(formData.rent_amount) || null,
      deposit_paid: parseFloat(formData.deposit_paid) || null,
      security_deposit: parseFloat(formData.security_deposit) || null,
      lease_start_date: formData.lease_start_date || null,
      lease_end_date: formData.lease_end_date || null,
      move_in_date: formData.move_in_date || null,
      visa_expiry_date: formData.visa_expiry_date || null,
      // Clear visa-related fields for Malaysians
      ...(formData.nationality === 'malaysian' && {
        work_permit_type: 'none',
        visa_expiry_date: null
      })
    }

    const { data, error } = await tenantsService.createTenant(submissionData)
    
    if (error) {
      setError(error.message)
    } else {
      onSuccess?.(data)
    }
    
    setLoading(false)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleUseStandardDeposit = () => {
    if (depositCalculation) {
      setFormData(prev => ({
        ...prev,
        security_deposit: depositCalculation.securityDeposit.toString()
      }))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Unit Assignment */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">🏠 Unit Assignment</h3>
        <Select
          label="Unit (Optional)"
          name="unit_id"
          value={formData.unit_id}
          onChange={handleChange}
          options={units}
          placeholder={loadingUnits ? "Loading units..." : "Select a unit or leave unassigned"}
          disabled={loadingUnits || !!unitId}
          error={validationErrors.unit_id}
        />
        {!formData.unit_id && (
          <p className="text-sm text-blue-600 mt-1">
            💡 You can assign a unit to this tenant later from the tenants list
          </p>
        )}
      </div>

      {/* Personal Information */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">👤 Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="First Name"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            required
            placeholder="John"
            error={validationErrors.first_name}
          />

          <Input
            label="Last Name"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            required
            placeholder="Smith"
            error={validationErrors.last_name}
          />

          <Input
            label="Email Address"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="john.smith@email.com"
            error={validationErrors.email}
          />

          <Input
            label="Phone Number"
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="01X-XXX-XXXX or +60 1X-XXX-XXXX"
            error={validationErrors.phone}
            helpText={formData.phone && formatMalaysianPhone(formData.phone) !== formData.phone ?
              `Formatted: ${formatMalaysianPhone(formData.phone)}` : ''}
          />
        </div>
      </div>

      {/* Malaysian Compliance */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-yellow-900 mb-4">🇲🇾 Malaysian Compliance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="IC Number (Malaysian ID)"
            name="ic_number"
            value={formData.ic_number}
            onChange={handleChange}
            placeholder="123456-78-9012"
            error={validationErrors.ic_number}
            helpText={formData.ic_number && formatMalaysianIC(formData.ic_number) !== formData.ic_number ?
              `Formatted: ${formatMalaysianIC(formData.ic_number)}` : ''}
          />

          <Select
            label="Nationality"
            name="nationality"
            value={formData.nationality}
            onChange={handleChange}
            options={MALAYSIAN_NATIONALITIES}
            required
            error={validationErrors.nationality}
          />

          {formData.nationality !== 'malaysian' && (
            <>
              <Select
                label="Work Permit / Visa Type"
                name="work_permit_type"
                value={formData.work_permit_type}
                onChange={handleChange}
                options={WORK_PERMIT_TYPES}
                required
                error={validationErrors.work_permit_type}
              />

              {formData.work_permit_type !== 'none' && (
                <Input
                  label="Visa Expiry Date"
                  type="date"
                  name="visa_expiry_date"
                  value={formData.visa_expiry_date}
                  onChange={handleChange}
                  required
                  error={validationErrors.visa_expiry_date}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-red-900 mb-4">🚨 Emergency Contact</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Emergency Contact Name"
            name="emergency_contact_name"
            value={formData.emergency_contact_name}
            onChange={handleChange}
            placeholder="Jane Smith"
            error={validationErrors.emergency_contact_name}
          />

          <Input
            label="Emergency Contact Phone"
            type="tel"
            name="emergency_contact_phone"
            value={formData.emergency_contact_phone}
            onChange={handleChange}
            placeholder="01X-XXX-XXXX"
            error={validationErrors.emergency_contact_phone}
            helpText={formData.emergency_contact_phone && formatMalaysianPhone(formData.emergency_contact_phone) !== formData.emergency_contact_phone ?
              `Formatted: ${formatMalaysianPhone(formData.emergency_contact_phone)}` : ''}
          />
        </div>
      </div>

      {/* Local Guarantor (for foreign tenants) */}
      {formData.nationality !== 'malaysian' && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-purple-900 mb-4">🤝 Local Guarantor (Recommended for Foreign Tenants)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Guarantor Name"
              name="guarantor_name"
              value={formData.guarantor_name}
              onChange={handleChange}
              placeholder="Ahmad Abdullah"
              error={validationErrors.guarantor_name}
            />

            <Input
              label="Guarantor Phone"
              type="tel"
              name="guarantor_phone"
              value={formData.guarantor_phone}
              onChange={handleChange}
              placeholder="01X-XXX-XXXX"
              error={validationErrors.guarantor_phone}
              helpText={formData.guarantor_phone && formatMalaysianPhone(formData.guarantor_phone) !== formData.guarantor_phone ?
                `Formatted: ${formatMalaysianPhone(formData.guarantor_phone)}` : ''}
            />

            <Input
              label="Guarantor IC"
              name="guarantor_ic"
              value={formData.guarantor_ic}
              onChange={handleChange}
              placeholder="123456-78-9012"
              error={validationErrors.guarantor_ic}
              helpText={formData.guarantor_ic && formatMalaysianIC(formData.guarantor_ic) !== formData.guarantor_ic ?
                `Formatted: ${formatMalaysianIC(formData.guarantor_ic)}` : ''}
            />
          </div>
        </div>
      )}

      {/* Lease Information */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-green-900 mb-4">📋 Lease Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Lease Start Date (Optional)"
            type="date"
            name="lease_start_date"
            value={formData.lease_start_date}
            onChange={handleChange}
            error={validationErrors.lease_start_date}
          />

          <Input
            label="Lease End Date (Optional)"
            type="date"
            name="lease_end_date"
            value={formData.lease_end_date}
            onChange={handleChange}
            error={validationErrors.lease_end_date}
          />

          <Input
            label="Move-in Date"
            type="date"
            name="move_in_date"
            value={formData.move_in_date}
            onChange={handleChange}
            error={validationErrors.move_in_date}
          />

          <Select
            label="Status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            options={TENANT_STATUSES}
            required
            error={validationErrors.status}
          />
        </div>

        {(!formData.lease_start_date || !formData.lease_end_date) && (
          <div className="mt-4">
            <p className="text-sm text-green-600">
              💡 Lease dates can be set later when the tenant signs a lease agreement
            </p>
          </div>
        )}
      </div>

      {/* Financial Information */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-indigo-900 mb-4 flex items-center">
          <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
          </svg>
          Financial Information (Malaysian Ringgit)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Monthly Rent (RM)"
            type="number"
            name="rent_amount"
            value={formData.rent_amount}
            onChange={handleChange}
            step="0.01"
            min="0"
            placeholder="1500.00"
            error={validationErrors.rent_amount}
            helpText={formData.rent_amount ? `${formatRinggit(formData.rent_amount)}/month` : ''}
          />

          <div>
            <Input
              label="Security Deposit (RM)"
              type="number"
              name="security_deposit"
              value={formData.security_deposit}
              onChange={handleChange}
              step="0.01"
              min="0"
              placeholder="3000.00"
              error={validationErrors.security_deposit}
              helpText={formData.security_deposit ? formatRinggit(formData.security_deposit) : ''}
            />
            {depositCalculation && (
              <button
                type="button"
                onClick={handleUseStandardDeposit}
                className="mt-1 text-xs text-indigo-600 hover:text-indigo-800 underline"
              >
                Use standard: {formatRinggit(depositCalculation.securityDeposit)} (2 months)
              </button>
            )}
          </div>

          <Input
            label="Deposit Paid (RM)"
            type="number"
            name="deposit_paid"
            value={formData.deposit_paid}
            onChange={handleChange}
            step="0.01"
            min="0"
            placeholder="3000.00"
            error={validationErrors.deposit_paid}
            helpText={formData.deposit_paid ? formatRinggit(formData.deposit_paid) : ''}
          />
        </div>

        {/* Malaysian Deposit Structure Guide */}
        {depositCalculation && (
          <div className="mt-4 p-3 bg-white rounded border border-indigo-300">
            <p className="text-sm font-medium text-indigo-900 mb-2">📊 Standard Malaysian Deposit Structure:</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <div>
                <span className="text-indigo-600">Security:</span><br />
                <span className="font-medium">{formatRinggit(depositCalculation.securityDeposit)}</span>
              </div>
              <div>
                <span className="text-indigo-600">Advance:</span><br />
                <span className="font-medium">{formatRinggit(depositCalculation.advanceRental)}</span>
              </div>
              <div>
                <span className="text-indigo-600">Utility:</span><br />
                <span className="font-medium">{formatRinggit(depositCalculation.utilityDeposit)}</span>
              </div>
              <div>
                <span className="text-indigo-600">Total:</span><br />
                <span className="font-bold">{formatRinggit(depositCalculation.total)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          📝 Notes
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