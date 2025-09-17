import { useState, useEffect } from 'react'
import { tenantsService } from '../../services/tenants'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import Spinner from '../ui/Spinner'
import { formatRinggit, formatMalaysianIC, formatMalaysianPhone } from '../../utils/malaysianValidation'

const STATUS_COLORS = {
  active: 'success',
  pending: 'warning',
  inactive: 'default',
  moved_out: 'danger'
}

const VISA_STATUS_COLORS = {
  valid: 'success',
  expiring_soon: 'warning',
  expired: 'danger',
  not_applicable: 'default'
}

export default function TenantDetailsModal({ isOpen, onClose, tenantId, onEdit }) {
  const [tenant, setTenant] = useState(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (isOpen && tenantId) {
      loadTenantDetails()
    }
  }, [isOpen, tenantId])

  const loadTenantDetails = async () => {
    setLoading(true)
    const { data, error } = await tenantsService.getTenant(tenantId)
    if (!error && data) {
      setTenant(data)
    }
    setLoading(false)
  }

  const getVisaStatus = (expiryDate) => {
    if (!expiryDate) return 'not_applicable'

    const today = new Date()
    const expiry = new Date(expiryDate)
    const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24))

    if (daysUntilExpiry < 0) return 'expired'
    if (daysUntilExpiry <= 30) return 'expiring_soon'
    return 'valid'
  }

  const isLeaseExpiringSoon = (leaseEndDate) => {
    if (!leaseEndDate) return false
    const today = new Date()
    const endDate = new Date(leaseEndDate)
    const daysUntilExpiry = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0
  }

  const isLeaseExpired = (leaseEndDate) => {
    if (!leaseEndDate) return false
    const today = new Date()
    const endDate = new Date(leaseEndDate)
    return endDate < today
  }

  if (loading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Tenant Details" size="xl">
        <div className="flex items-center justify-center py-12">
          <Spinner size="xl" />
        </div>
      </Modal>
    )
  }

  if (!tenant) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Tenant Details" size="xl">
        <div className="text-center py-12">
          <p className="text-gray-500">Tenant not found</p>
        </div>
      </Modal>
    )
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '👤' },
    { id: 'lease', name: 'Lease Details', icon: '📋' },
    { id: 'financial', name: 'Financial', icon: '💳' },
    { id: 'compliance', name: 'Compliance', icon: '📄' }
  ]

  const visaStatus = getVisaStatus(tenant.visa_expiry_date)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tenant Profile" size="xl">
      <div className="flex flex-col h-full">
        {/* Header with tenant name and status */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-blue-600">
                {tenant.first_name?.[0]}{tenant.last_name?.[0]}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {tenant.first_name} {tenant.last_name}
              </h2>
              <p className="text-sm text-gray-500">{tenant.email}</p>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant={STATUS_COLORS[tenant.status]} className="capitalize">
                  {tenant.status}
                </Badge>
                {tenant.nationality !== 'malaysian' && (
                  <Badge variant={VISA_STATUS_COLORS[visaStatus]} className="capitalize">
                    {visaStatus === 'not_applicable' ? 'Local' :
                     visaStatus === 'expiring_soon' ? 'Visa Expiring' :
                     visaStatus === 'expired' ? 'Visa Expired' : 'Visa Valid'}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <Button variant="outline" onClick={() => onEdit?.(tenant)}>
            ✏️ Edit Profile
          </Button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium border-b-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Full Name</label>
                      <p className="text-gray-900">{tenant.first_name} {tenant.last_name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Email</label>
                      <p className="text-gray-900">{tenant.email || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Phone</label>
                      <p className="text-gray-900">{formatMalaysianPhone(tenant.phone) || 'Not provided'}</p>
                    </div>
                    {tenant.ic_number && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">IC Number</label>
                        <p className="text-gray-900">{formatMalaysianIC(tenant.ic_number)}</p>
                      </div>
                    )}
                    {tenant.nationality && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Nationality</label>
                        <p className="text-gray-900 capitalize">{tenant.nationality.replace('_', ' ')}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Unit Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Unit Information</h3>
                  {tenant.units ? (
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Property</label>
                        <p className="text-gray-900">{tenant.units.properties?.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Unit Number</label>
                        <p className="text-gray-900">Unit {tenant.units.unit_number}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Unit Type</label>
                        <p className="text-gray-900">{tenant.units.unit_type || 'Not specified'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Address</label>
                        <p className="text-gray-900 text-sm">{tenant.units.properties?.address}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500">No unit assigned</p>
                  )}
                </div>
              </div>

              {/* Emergency Contact */}
              {(tenant.emergency_contact_name || tenant.emergency_contact_phone) && (
                <div className="bg-red-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-red-900 mb-4">🚨 Emergency Contact</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-red-600">Name</label>
                      <p className="text-red-900">{tenant.emergency_contact_name || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-red-600">Phone</label>
                      <p className="text-red-900">{formatMalaysianPhone(tenant.emergency_contact_phone) || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              {tenant.notes && (
                <div className="bg-yellow-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-yellow-900 mb-2">📝 Notes</h3>
                  <p className="text-yellow-800">{tenant.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Lease Details Tab */}
          {activeTab === 'lease' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Current Lease */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Lease</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Lease Period</label>
                      {tenant.lease_start_date && tenant.lease_end_date ? (
                        <div>
                          <p className="text-gray-900">
                            {new Date(tenant.lease_start_date).toLocaleDateString()} - {' '}
                            {new Date(tenant.lease_end_date).toLocaleDateString()}
                          </p>
                          <p className={`text-xs ${
                            isLeaseExpired(tenant.lease_end_date)
                              ? 'text-red-600 font-medium'
                              : isLeaseExpiringSoon(tenant.lease_end_date)
                              ? 'text-yellow-600 font-medium'
                              : 'text-green-600'
                          }`}>
                            {isLeaseExpired(tenant.lease_end_date)
                              ? '⚠️ Lease expired'
                              : isLeaseExpiringSoon(tenant.lease_end_date)
                              ? '⚠️ Lease expiring soon'
                              : '✅ Lease active'
                            }
                          </p>
                        </div>
                      ) : (
                        <p className="text-gray-500">No lease dates set</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Move-in Date</label>
                      <p className="text-gray-900">
                        {tenant.move_in_date ? new Date(tenant.move_in_date).toLocaleDateString() : 'Not set'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Monthly Rent</label>
                      <p className="text-gray-900 font-semibold">
                        {tenant.rent_amount ? formatRinggit(tenant.rent_amount) : 'Not set'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Lease History */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Lease History</h3>
                  {tenant.lease_history && tenant.lease_history.length > 0 ? (
                    <div className="space-y-2">
                      {tenant.lease_history.map((lease, index) => (
                        <div key={lease.id} className="bg-white rounded p-3 border border-gray-200">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Lease #{index + 1}</span>
                            <Badge variant={STATUS_COLORS[lease.status] || 'default'} size="sm">
                              {lease.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {lease.lease_start_date && new Date(lease.lease_start_date).toLocaleDateString()} - {' '}
                            {lease.lease_end_date && new Date(lease.lease_end_date).toLocaleDateString()}
                          </p>
                          {lease.rent_amount && (
                            <p className="text-xs text-gray-900 font-medium">
                              {formatRinggit(lease.rent_amount)}/month
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No lease history available</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Financial Tab */}
          {activeTab === 'financial' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Security Deposit */}
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-green-900 mb-2 flex items-center">
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
                    </svg>
                    Security Deposit
                  </h3>
                  <p className="text-2xl font-bold text-green-700">
                    {tenant.security_deposit ? formatRinggit(tenant.security_deposit) : 'Not set'}
                  </p>
                  <p className="text-sm text-green-600">Refundable deposit</p>
                </div>

                {/* Deposit Paid */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2 flex items-center">
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
                    </svg>
                    Deposit Paid
                  </h3>
                  <p className="text-2xl font-bold text-blue-700">
                    {tenant.deposit_paid ? formatRinggit(tenant.deposit_paid) : 'Not set'}
                  </p>
                  <p className="text-sm text-blue-600">Amount received</p>
                </div>

                {/* Monthly Rent */}
                <div className="bg-purple-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-purple-900 mb-2">🏠 Monthly Rent</h3>
                  <p className="text-2xl font-bold text-purple-700">
                    {tenant.rent_amount ? formatRinggit(tenant.rent_amount) : 'Not set'}
                  </p>
                  <p className="text-sm text-purple-600">Per month</p>
                </div>
              </div>

              {/* Financial Summary */}
              {(tenant.security_deposit || tenant.deposit_paid || tenant.rent_amount) && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Security Deposit:</span>
                      <span className="font-medium">{formatRinggit(tenant.security_deposit || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Deposit Paid:</span>
                      <span className="font-medium">{formatRinggit(tenant.deposit_paid || 0)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-gray-600">Outstanding Deposit:</span>
                      <span className={`font-bold ${
                        (tenant.security_deposit || 0) - (tenant.deposit_paid || 0) > 0
                          ? 'text-red-600'
                          : 'text-green-600'
                      }`}>
                        {formatRinggit(Math.max(0, (tenant.security_deposit || 0) - (tenant.deposit_paid || 0)))}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Compliance Tab */}
          {activeTab === 'compliance' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Malaysian Compliance */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">🇲🇾 Malaysian Compliance</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Nationality</label>
                      <p className="text-gray-900 capitalize">
                        {tenant.nationality ? tenant.nationality.replace('_', ' ') : 'Not specified'}
                      </p>
                    </div>
                    {tenant.ic_number && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">IC Number</label>
                        <p className="text-gray-900 font-mono">{formatMalaysianIC(tenant.ic_number)}</p>
                      </div>
                    )}
                    {tenant.work_permit_type && tenant.nationality !== 'malaysian' && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Work Permit Type</label>
                        <p className="text-gray-900 capitalize">
                          {tenant.work_permit_type.replace('_', ' ')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Visa Status (for non-Malaysians) */}
                {tenant.nationality !== 'malaysian' && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">🛂 Visa Status</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Status</label>
                        <Badge variant={VISA_STATUS_COLORS[visaStatus]} className="capitalize">
                          {visaStatus === 'expiring_soon' ? 'Expiring Soon' :
                           visaStatus === 'expired' ? 'Expired' :
                           visaStatus === 'valid' ? 'Valid' : 'N/A'}
                        </Badge>
                      </div>
                      {tenant.visa_expiry_date && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">Visa Expiry Date</label>
                          <p className={`${
                            visaStatus === 'expired' ? 'text-red-600 font-medium' :
                            visaStatus === 'expiring_soon' ? 'text-yellow-600 font-medium' :
                            'text-gray-900'
                          }`}>
                            {new Date(tenant.visa_expiry_date).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Guarantor Information */}
              {(tenant.guarantor_name || tenant.guarantor_phone || tenant.guarantor_ic) && (
                <div className="bg-yellow-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-yellow-900 mb-4">🤝 Local Guarantor</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-yellow-600">Name</label>
                      <p className="text-yellow-900">{tenant.guarantor_name || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-yellow-600">Phone</label>
                      <p className="text-yellow-900">{formatMalaysianPhone(tenant.guarantor_phone) || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-yellow-600">IC Number</label>
                      <p className="text-yellow-900 font-mono">{formatMalaysianIC(tenant.guarantor_ic) || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Created: {new Date(tenant.created_at).toLocaleDateString()}
            {tenant.updated_at && tenant.updated_at !== tenant.created_at && (
              <span> • Updated: {new Date(tenant.updated_at).toLocaleDateString()}</span>
            )}
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={() => onEdit?.(tenant)}>
              Edit Profile
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}