import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSuperAdminStore } from '../stores/superAdminStore'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Table from '../components/ui/Table'
import Badge from '../components/ui/Badge'
import Spinner from '../components/ui/Spinner'
import AddOrganizationModal from '../components/modals/AddOrganizationModal'

export default function SuperAdminDashboard() {
  const { 
    organizations, 
    metrics, 
    fetchOrganizations, 
    fetchSystemMetrics,
    updateOrganization
  } = useSuperAdminStore()
  
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      console.log('🚀 SuperAdminDashboard: Starting data load...')
      setLoading(true)
      
      try {
        console.log('📊 SuperAdminDashboard: Fetching organizations...')
        const orgResult = await fetchOrganizations()
        console.log('📊 SuperAdminDashboard: Organizations result:', orgResult)
        
        console.log('📈 SuperAdminDashboard: Fetching metrics...')
        const metricsResult = await fetchSystemMetrics()
        console.log('📈 SuperAdminDashboard: Metrics result:', metricsResult)
        
        console.log('✅ SuperAdminDashboard: Data load complete')
      } catch (error) {
        console.error('❌ SuperAdminDashboard: Data load error:', error)
      } finally {
        console.log('🏁 SuperAdminDashboard: Setting loading to false')
        setLoading(false)
      }
    }

    loadData()
  }, [fetchOrganizations, fetchSystemMetrics])

  const loadData = async () => {
    setLoading(true)
    await Promise.all([
      fetchOrganizations(),
      fetchSystemMetrics()
    ])
    setLoading(false)
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  const handleToggleStatus = async (org) => {
    const newStatus = org.subscription_status === 'active' ? 'suspended' : 'active'
    await updateOrganization(org.id, { subscription_status: newStatus })
  }

  const handleOrganizationCreated = (newOrganization) => {
    console.log('Organization created:', newOrganization)
    // The store already updates the organizations list
  }

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'active': return 'success'
      case 'trial': return 'warning'
      case 'suspended': return 'error'
      case 'canceled': return 'gray'
      default: return 'gray'
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="xl" />
      </div>
    )
  }

  const organizationColumns = [
    {
      key: 'name',
      header: 'Organization',
      render: (org) => (
        <div>
          <div className="font-medium text-gray-900">{org.name}</div>
          <div className="text-sm text-gray-500">{org.slug}</div>
        </div>
      )
    },
    {
      key: 'subscription_status',
      header: 'Status',
      render: (org) => (
        <Badge variant={getStatusBadgeVariant(org.subscription_status)}>
          {org.subscription_status}
        </Badge>
      )
    },
    {
      key: 'subscription_plan',
      header: 'Plan',
      render: (org) => (
        <span className="capitalize">{org.subscription_plan}</span>
      )
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (org) => formatDate(org.created_at)
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (org) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant={org.subscription_status === 'active' ? 'outline' : 'primary'}
            onClick={() => handleToggleStatus(org)}
          >
            {org.subscription_status === 'active' ? 'Suspend' : 'Activate'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {/* Navigate to org details */}}
          >
            View
          </Button>
        </div>
      )
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">SuperAdmin Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage all organizations and system-wide settings</p>
              <div className="flex space-x-4 mt-4">
                <Link 
                  to="/superadmin/dashboard" 
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Dashboard
                </Link>
                <Link 
                  to="/superadmin/users" 
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Users
                </Link>
                <Link 
                  to="/superadmin/organizations" 
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Organizations
                </Link>
              </div>
            </div>
            <Button onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? <Spinner size="sm" className="mr-2" /> : null}
              Refresh Data
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Organizations</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {metrics?.totalOrganizations || organizations.length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-5l-3-3m3 3l-3 3" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {metrics?.totalUsers || '-'}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Properties</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {metrics?.totalProperties || '-'}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Tenants</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {metrics?.totalActiveTenants || '-'}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Organizations Table */}
        <Card>
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Organizations</h2>
              <Button onClick={() => setShowAddModal(true)}>
                Add Organization
              </Button>
            </div>
          </div>
          
          <Table
            data={organizations}
            columns={organizationColumns}
            emptyMessage="No organizations found"
          />
        </Card>
      </div>

      {/* Add Organization Modal */}
      <AddOrganizationModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleOrganizationCreated}
      />
    </div>
  )
}