import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSuperAdminStore } from '../stores/superAdminStore'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Table from '../components/ui/Table'
import Badge from '../components/ui/Badge'
import Spinner from '../components/ui/Spinner'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'

export default function SuperAdminUsers() {
  const { 
    users, 
    loading,
    fetchUsers,
    updateUser,
    impersonateUser
  } = useSuperAdminStore()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [filterOrg, setFilterOrg] = useState('all')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    const loadUsers = async () => {
      await fetchUsers()
    }
    loadUsers()
  }, [fetchUsers])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchUsers()
    setRefreshing(false)
  }

  const handleToggleStatus = async (user) => {
    const newStatus = user.status === 'active' ? 'suspended' : 'active'
    await updateUser(user.id, { status: newStatus })
  }

  const handleResetPassword = async (user) => {
    // TODO: Implement password reset functionality
    console.log('Reset password for:', user.email)
  }

  const handleImpersonate = async (user) => {
    await impersonateUser(user.id)
    // TODO: Navigate to tenant dashboard as this user
  }

  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case 'super_admin': return 'purple'
      case 'admin': return 'blue'
      case 'manager': return 'green'
      case 'user': return 'gray'
      default: return 'gray'
    }
  }

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'active': return 'success'
      case 'suspended': return 'error'
      case 'pending': return 'warning'
      default: return 'gray'
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString()
  }

  // Filter users based on search and filters
  const filteredUsers = users?.filter(user => {
    const matchesSearch = !searchTerm || 
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.organization_name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRole = filterRole === 'all' || user.role === filterRole
    const matchesOrg = filterOrg === 'all' || user.organization_id === filterOrg
    
    return matchesSearch && matchesRole && matchesOrg
  }) || []

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="xl" />
      </div>
    )
  }

  const userColumns = [
    {
      key: 'user',
      header: 'User',
      render: (user) => (
        <div>
          <div className="font-medium text-gray-900">{user.full_name || 'N/A'}</div>
          <div className="text-sm text-gray-500">{user.email}</div>
        </div>
      )
    },
    {
      key: 'organization',
      header: 'Organization',
      render: (user) => (
        <div>
          <div className="font-medium text-gray-900">{user.organization_name || 'N/A'}</div>
          <div className="text-sm text-gray-500">{user.organization_slug || ''}</div>
        </div>
      )
    },
    {
      key: 'role',
      header: 'Role',
      render: (user) => (
        <Badge variant={getRoleBadgeVariant(user.role)}>
          {user.role || 'user'}
        </Badge>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (user) => (
        <Badge variant={getStatusBadgeVariant(user.status)}>
          {user.status || 'active'}
        </Badge>
      )
    },
    {
      key: 'last_sign_in',
      header: 'Last Login',
      render: (user) => (
        <span className="text-sm text-gray-600">
          {user.last_sign_in_at ? formatDate(user.last_sign_in_at) : 'Never'}
        </span>
      )
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (user) => formatDate(user.created_at)
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (user) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleImpersonate(user)}
            disabled={user.role === 'super_admin'}
          >
            Impersonate
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleResetPassword(user)}
          >
            Reset PWD
          </Button>
          <Button
            size="sm"
            variant={user.status === 'active' ? 'outline' : 'primary'}
            onClick={() => handleToggleStatus(user)}
            disabled={user.role === 'super_admin'}
          >
            {user.status === 'active' ? 'Suspend' : 'Activate'}
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
              <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
              <p className="text-gray-600 mt-1">Manage all users across organizations</p>
              <div className="flex space-x-4 mt-4">
                <Link 
                  to="/superadmin/dashboard" 
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Dashboard
                </Link>
                <Link 
                  to="/superadmin/users" 
                  className="text-blue-600 hover:text-blue-800 font-medium border-b-2 border-blue-600"
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
        {/* Filters */}
        <Card className="p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Users
              </label>
              <Input
                type="text"
                placeholder="Search by name, email, or organization..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Role
              </label>
              <Select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                options={[
                  { value: 'all', label: 'All Roles' },
                  { value: 'super_admin', label: 'Super Admin' },
                  { value: 'admin', label: 'Admin' },
                  { value: 'manager', label: 'Manager' },
                  { value: 'user', label: 'User' }
                ]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Organization
              </label>
              <Select
                value={filterOrg}
                onChange={(e) => setFilterOrg(e.target.value)}
                options={[
                  { value: 'all', label: 'All Organizations' },
                  // TODO: Populate with actual organizations
                ]}
              />
            </div>
          </div>
        </Card>

        {/* User Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-5l-3-3m3 3l-3 3" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-semibold text-gray-900">{filteredUsers.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {filteredUsers.filter(u => u.status === 'active').length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L5.232 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Suspended</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {filteredUsers.filter(u => u.status === 'suspended').length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Admins</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {filteredUsers.filter(u => u.role === 'admin' || u.role === 'super_admin').length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">
                Users ({filteredUsers.length})
              </h2>
            </div>
          </div>
          
          <Table
            data={filteredUsers}
            columns={userColumns}
            emptyMessage="No users found matching your criteria"
          />
        </Card>
      </div>
    </div>
  )
}