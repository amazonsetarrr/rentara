import { useState, useEffect } from 'react'
import { paymentsService } from '../services/payments'
import Card, { CardHeader, CardContent } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Table from '../components/ui/Table'
import Badge from '../components/ui/Badge'
import Spinner from '../components/ui/Spinner'
import Select from '../components/ui/Select'
import Input from '../components/ui/Input'
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
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: '',
    tenant_search: '',
    from_date: '',
    to_date: ''
  })

  useEffect(() => {
    loadPaymentsData()
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

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }))
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
            <Button size="sm" variant="primary">
              Record Payment
            </Button>
          )}
          <Button size="sm" variant="outline">
            View Details
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
          <Button variant="outline">Generate Rent</Button>
          <Button>Record Payment</Button>
        </div>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
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
    </div>
  )
}