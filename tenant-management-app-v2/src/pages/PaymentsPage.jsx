import { useState, useEffect } from 'react'
import { paymentsService } from '../services/payments'
import Card, { CardHeader, CardContent } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Table from '../components/ui/Table'
import Badge from '../components/ui/Badge'
import Spinner from '../components/ui/Spinner'
import Select from '../components/ui/Select'
import Input from '../components/ui/Input'
import RecordPaymentModal from '../components/modals/RecordPaymentModal'
import AddPaymentModal from '../components/modals/AddPaymentModal'
import GenerateRentModal from '../components/modals/GenerateRentModal'
import AddRentScheduleModal from '../components/modals/AddRentScheduleModal'
import ViewPaymentDetailsModal from '../components/modals/ViewPaymentDetailsModal'
import { formatCurrency } from '../utils/currency'

const PAYMENT_STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'partial', label: 'Partial' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'cancelled', label: 'Cancelled' }
]

export default function PaymentsPage() {
  const [payments, setPayments] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [rentSchedules, setRentSchedules] = useState([])
  const [loading, setLoading] = useState(true)
  const [schedulesLoading, setSchedulesLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('payments') // 'payments' or 'schedules'
  const [filters, setFilters] = useState({
    status: '',
    tenant_search: '',
    from_date: '',
    to_date: ''
  })
  const [recordPaymentModal, setRecordPaymentModal] = useState({
    isOpen: false,
    payment: null
  })
  const [viewDetailsModal, setViewDetailsModal] = useState({
    isOpen: false,
    payment: null
  })
  const [addPaymentModal, setAddPaymentModal] = useState(false)
  const [generateRentModal, setGenerateRentModal] = useState(false)
  const [addScheduleModal, setAddScheduleModal] = useState(false)

  useEffect(() => {
    loadPaymentsData()
    loadRentSchedules()
  }, [filters]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadPaymentsData = async () => {
    setLoading(true)
    try {
      const filtersToApply = { ...filters }
      delete filtersToApply.tenant_search // Handle search separately
      
      const [paymentsResult, analyticsResult] = await Promise.all([
        paymentsService.getPayments(filtersToApply),
        paymentsService.getPaymentAnalytics(filtersToApply)
      ])

      let paymentsData = paymentsResult.data || []
      
      // Apply tenant search filter
      if (filters.tenant_search) {
        const searchTerm = filters.tenant_search.toLowerCase()
        paymentsData = paymentsData.filter(payment => 
          payment.tenant?.full_name?.toLowerCase().includes(searchTerm) ||
          payment.tenant?.email?.toLowerCase().includes(searchTerm) ||
          payment.unit?.unit_number?.toLowerCase().includes(searchTerm)
        )
      }

      setPayments(paymentsData)
      setAnalytics(analyticsResult.data)
    } catch (error) {
      console.error('Error loading payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadRentSchedules = async () => {
    setSchedulesLoading(true)
    try {
      const { data, error } = await paymentsService.getRentSchedules()
      if (error) {
        console.error('Error loading rent schedules:', error)
      } else {
        setRentSchedules(data || [])
      }
    } catch (error) {
      console.error('Error loading rent schedules:', error)
    } finally {
      setSchedulesLoading(false)
    }
  }

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }))
  }

  const handleRecordPayment = (payment) => {
    setRecordPaymentModal({
      isOpen: true,
      payment: payment
    })
  }

  const handleCloseRecordPaymentModal = () => {
    setRecordPaymentModal({
      isOpen: false,
      payment: null
    })
  }

  const handleViewPaymentDetails = (payment) => {
    setViewDetailsModal({
      isOpen: true,
      payment: payment
    })
  }

  const handleCloseViewDetailsModal = () => {
    setViewDetailsModal({
      isOpen: false,
      payment: null
    })
  }

  const handlePaymentRecorded = () => {
    // Refresh payments data after recording payment
    loadPaymentsData()
  }

  const handleAddPayment = () => {
    setAddPaymentModal(true)
  }

  const handleCloseAddPaymentModal = () => {
    setAddPaymentModal(false)
  }

  const handlePaymentCreated = () => {
    // Refresh payments data after creating payment
    loadPaymentsData()
  }

  const handleGenerateRent = () => {
    setGenerateRentModal(true)
  }

  const handleCloseGenerateRentModal = () => {
    setGenerateRentModal(false)
  }

  const handleRentGenerated = (generatedPayments) => {
    // Show success message and refresh payments data
    console.log(`Successfully generated ${generatedPayments.length} rent payments`)
    loadPaymentsData()
  }

  const handleAddSchedule = () => {
    setAddScheduleModal(true)
  }

  const handleCloseAddScheduleModal = () => {
    setAddScheduleModal(false)
  }

  const handleScheduleCreated = (newSchedule) => {
    // Refresh rent schedules data after creating schedule
    loadRentSchedules()
  }

  const handleDeleteSchedule = async (scheduleId) => {
    if (!confirm('Are you sure you want to delete this rent schedule?')) return
    
    try {
      const { error } = await paymentsService.deleteRentSchedule(scheduleId)
      if (!error) {
        setRentSchedules(prev => prev.filter(s => s.id !== scheduleId))
      }
    } catch (error) {
      console.error('Failed to delete rent schedule:', error)
    }
  }

  const handleDeletePayment = async (paymentId) => {
    if (!confirm('Are you sure you want to delete this payment record? This action cannot be undone.')) return
    
    try {
      const { error } = await paymentsService.deletePayment(paymentId)
      if (!error) {
        setPayments(prev => prev.filter(p => p.id !== paymentId))
        // Refresh analytics after deleting payment
        loadPaymentsData()
      }
    } catch (error) {
      console.error('Failed to delete payment:', error)
    }
  }

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'paid': return 'success'
      case 'pending': return 'warning'
      case 'partial': return 'info'
      case 'overdue': return 'error'
      case 'cancelled': return 'gray'
      default: return 'gray'
    }
  }

  const getStatusText = (payment) => {
    if (payment.status === 'pending' && new Date(payment.due_date) < new Date()) {
      return 'overdue'
    }
    return payment.status
  }


  const rentScheduleColumns = [
    {
      key: 'tenant',
      header: 'Tenant',
      render: (schedule) => (
        <div>
          <div className="font-medium text-gray-900">{schedule.tenant?.full_name}</div>
          <div className="text-sm text-gray-500">{schedule.tenant?.email}</div>
        </div>
      )
    },
    {
      key: 'unit',
      header: 'Unit',
      render: (schedule) => (
        <div className="font-medium">{schedule.unit?.unit_number}</div>
      )
    },
    {
      key: 'rent_amount',
      header: 'Monthly Rent',
      render: (schedule) => (
        <div className="font-medium">{formatCurrency(schedule.rent_amount)}</div>
      )
    },
    {
      key: 'due_day',
      header: 'Due Day',
      render: (schedule) => (
        <div className="font-medium">{schedule.due_day}{getDaySuffix(schedule.due_day)} of month</div>
      )
    },
    {
      key: 'period',
      header: 'Period',
      render: (schedule) => (
        <div className="text-sm">
          <div>From: {new Date(schedule.start_date).toLocaleDateString()}</div>
          {schedule.end_date && (
            <div>To: {new Date(schedule.end_date).toLocaleDateString()}</div>
          )}
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (schedule) => (
        <Badge variant={schedule.is_active ? 'success' : 'default'}>
          {schedule.is_active ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (schedule) => (
        <div className="flex space-x-2">
          <Button size="sm" variant="outline">
            Edit
          </Button>
          <Button 
            size="sm" 
            variant="danger"
            onClick={() => handleDeleteSchedule(schedule.id)}
          >
            Delete
          </Button>
        </div>
      )
    }
  ]

  const paymentColumns = [
    {
      key: 'tenant',
      header: 'Tenant',
      render: (payment) => (
        <div>
          <div className="font-medium text-gray-900">{payment.tenant?.full_name}</div>
          <div className="text-sm text-gray-500">Unit {payment.unit?.unit_number}</div>
        </div>
      )
    },
    {
      key: 'payment_type',
      header: 'Type',
      render: (payment) => payment.payment_type?.display_name || 'Unknown'
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (payment) => (
        <div>
          <div className="font-medium">{formatCurrency(payment.amount)}</div>
          {payment.paid_amount > 0 && payment.paid_amount < payment.amount && (
            <div className="text-sm text-green-600">
              Paid: {formatCurrency(payment.paid_amount)}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'due_date',
      header: 'Due Date',
      render: (payment) => {
        const dueDate = new Date(payment.due_date)
        const isOverdue = payment.status !== 'paid' && dueDate < new Date()
        return (
          <div className={isOverdue ? 'text-red-600' : 'text-gray-900'}>
            {dueDate.toLocaleDateString()}
          </div>
        )
      }
    },
    {
      key: 'status',
      header: 'Status',
      render: (payment) => {
        const status = getStatusText(payment)
        return (
          <Badge variant={getStatusBadgeVariant(status)}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        )
      }
    },
    {
      key: 'paid_date',
      header: 'Paid Date',
      render: (payment) => payment.paid_date 
        ? new Date(payment.paid_date).toLocaleDateString()
        : '-'
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (payment) => (
        <div className="flex space-x-2">
          {payment.status !== 'paid' && (
            <Button 
              size="sm" 
              variant="primary"
              onClick={() => handleRecordPayment(payment)}
            >
              Record Payment
            </Button>
          )}
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => handleViewPaymentDetails(payment)}
          >
            View Details
          </Button>
          <Button 
            size="sm" 
            variant="danger"
            onClick={() => handleDeletePayment(payment.id)}
          >
            Delete
          </Button>
        </div>
      )
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payments & Rent Collection</h1>
          <p className="text-gray-600 mt-1">Track rent, deposits, and all payment transactions</p>
        </div>
        <div className="flex space-x-3">
          {activeTab === 'payments' && (
            <>
              <Button variant="outline" onClick={handleGenerateRent}>Generate Rent</Button>
              <Button onClick={handleAddPayment}>Add Payment</Button>
            </>
          )}
          {activeTab === 'schedules' && (
            <Button onClick={handleAddSchedule}>Add Rent Schedule</Button>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('payments')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'payments'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Payment Records
            {payments.length > 0 && (
              <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                {payments.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('schedules')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'schedules'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Rent Schedules
            {rentSchedules.length > 0 && (
              <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                {rentSchedules.length}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'payments' && (
        <>
          {/* Analytics Cards */}
          {analytics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Due</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {formatCurrency(analytics.totalDue)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Paid</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {formatCurrency(analytics.totalPaid)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L5.232 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Overdue</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {formatCurrency(analytics.totalOverdue)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Pending</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {formatCurrency(analytics.totalPending)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Select
                  label="Status"
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  options={PAYMENT_STATUS_OPTIONS}
                />
                <Input
                  label="Search Tenant/Unit"
                  value={filters.tenant_search}
                  onChange={(e) => handleFilterChange('tenant_search', e.target.value)}
                  placeholder="Tenant name, email, or unit number"
                />
                <Input
                  label="From Date"
                  type="date"
                  value={filters.from_date}
                  onChange={(e) => handleFilterChange('from_date', e.target.value)}
                />
                <Input
                  label="To Date"
                  type="date"
                  value={filters.to_date}
                  onChange={(e) => handleFilterChange('to_date', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Payments Table */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900">Payment Records</h2>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">Export</Button>
                  <Button variant="outline" size="sm">Import</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table
                data={payments}
                columns={paymentColumns}
                emptyMessage="No payments found"
              />
            </CardContent>
          </Card>
        </>
      )}

      {/* Rent Schedules Tab */}
      {activeTab === 'schedules' && (
        <>
          {schedulesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : (
            <>
              {rentSchedules.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h3a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2h3z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No rent schedules found</h3>
                    <p className="text-gray-500 mb-4">Create rent schedules to automate monthly rent generation for your tenants</p>
                    <Button onClick={handleAddSchedule}>Create First Rent Schedule</Button>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <h2 className="text-lg font-medium text-gray-900">Active Rent Schedules ({rentSchedules.length})</h2>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">Export</Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table
                      data={rentSchedules}
                      columns={rentScheduleColumns}
                      emptyMessage="No rent schedules found"
                    />
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </>
      )}

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={recordPaymentModal.isOpen}
        onClose={handleCloseRecordPaymentModal}
        payment={recordPaymentModal.payment}
        onPaymentRecorded={handlePaymentRecorded}
      />

      {/* Add Payment Modal */}
      <AddPaymentModal
        isOpen={addPaymentModal}
        onClose={handleCloseAddPaymentModal}
        onPaymentCreated={handlePaymentCreated}
      />

      {/* Generate Rent Modal */}
      <GenerateRentModal
        isOpen={generateRentModal}
        onClose={handleCloseGenerateRentModal}
        onRentGenerated={handleRentGenerated}
      />

      {/* Add Rent Schedule Modal */}
      <AddRentScheduleModal
        isOpen={addScheduleModal}
        onClose={handleCloseAddScheduleModal}
        onScheduleCreated={handleScheduleCreated}
      />

      {/* View Payment Details Modal */}
      <ViewPaymentDetailsModal
        isOpen={viewDetailsModal.isOpen}
        onClose={handleCloseViewDetailsModal}
        payment={viewDetailsModal.payment}
      />
    </div>
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