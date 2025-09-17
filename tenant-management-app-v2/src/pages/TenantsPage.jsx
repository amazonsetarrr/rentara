import { useState, useEffect } from 'react'
import { tenantsService } from '../services/tenants'
import Card, { CardHeader, CardContent } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Badge from '../components/ui/Badge'
import Table, { TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table'
import AddTenantForm from '../components/forms/AddTenantForm'
import EditTenantForm from '../components/forms/EditTenantForm'
import TenantDetailsModal from '../components/modals/TenantDetailsModal'
import Spinner from '../components/ui/Spinner'
import { formatRinggit, formatMalaysianPhone } from '../utils/malaysianValidation'

const STATUS_COLORS = {
  active: 'success',
  pending: 'warning',
  inactive: 'default',
  moved_out: 'danger'
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState(null)

  useEffect(() => {
    loadTenants()
  }, [])

  const loadTenants = async () => {
    setLoading(true)
    const { data } = await tenantsService.getTenants()
    setTenants(data || [])
    setLoading(false)
  }

  const handleAddTenant = (newTenant) => {
    setTenants(prev => [newTenant, ...prev])
    setShowAddModal(false)
  }

  const handleViewTenant = (tenant) => {
    setSelectedTenant(tenant)
    setShowDetailsModal(true)
  }

  const handleEditTenant = (tenant) => {
    setSelectedTenant(tenant)
    setShowEditModal(true)
  }

  const handleUpdateTenant = (updatedTenant) => {
    setTenants(prev => prev.map(t => t.id === updatedTenant.id ? updatedTenant : t))
    setShowEditModal(false)
    setSelectedTenant(null)
  }

  const closeModals = () => {
    setShowDetailsModal(false)
    setShowEditModal(false)
    setSelectedTenant(null)
  }

  const handleDeleteTenant = async (id) => {
    if (!confirm('Are you sure you want to delete this tenant?')) return
    
    const { error } = await tenantsService.deleteTenant(id)
    if (!error) {
      setTenants(prev => prev.filter(t => t.id !== id))
    }
  }

  const isLeaseExpiringSoon = (leaseEndDate) => {
    const today = new Date()
    const endDate = new Date(leaseEndDate)
    const daysUntilExpiry = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0
  }

  const isLeaseExpired = (leaseEndDate) => {
    const today = new Date()
    const endDate = new Date(leaseEndDate)
    return endDate < today
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="xl" />
      </div>
    )
  }

  // Calculate stats
  const stats = {
    total: tenants.length,
    active: tenants.filter(t => t.status === 'active').length,
    pending: tenants.filter(t => t.status === 'pending').length,
    expiringSoon: tenants.filter(t => t.lease_end_date && isLeaseExpiringSoon(t.lease_end_date)).length
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tenants</h1>
          <p className="text-gray-600">Manage your tenant relationships and leases</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Tenant
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tenants</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <Badge variant="success">Active</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Move-in</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Badge variant="warning">Pending</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Leases Expiring Soon</p>
                <p className="text-2xl font-bold text-red-600">{stats.expiringSoon}</p>
              </div>
              <Badge variant="danger">⚠️</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {tenants.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tenants yet</h3>
            <p className="text-gray-500 mb-4">Add tenants to start managing leases and payments</p>
            <Button onClick={() => setShowAddModal(true)}>Add Tenant</Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">All Tenants ({tenants.length})</h2>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Lease</TableHead>
                  <TableHead>Rent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900">
                          {tenant.first_name} {tenant.last_name}
                        </div>
                        <div className="text-sm text-gray-500">{tenant.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {tenant.units ? (
                        <div>
                          <div className="font-medium">{tenant.units.properties?.name}</div>
                          <div className="text-sm text-gray-500">Unit {tenant.units.unit_number}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">No unit assigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{formatMalaysianPhone(tenant.phone) || 'No phone'}</div>
                        <div className="text-gray-500">{tenant.email || 'No email'}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {tenant.lease_start_date && tenant.lease_end_date ? (
                        <div className="text-sm">
                          <div>
                            {new Date(tenant.lease_start_date).toLocaleDateString()} - {' '}
                            {new Date(tenant.lease_end_date).toLocaleDateString()}
                          </div>
                          <div className={`text-xs ${
                            isLeaseExpired(tenant.lease_end_date) 
                              ? 'text-red-600 font-medium' 
                              : isLeaseExpiringSoon(tenant.lease_end_date)
                              ? 'text-yellow-600 font-medium'
                              : 'text-gray-500'
                          }`}>
                            {isLeaseExpired(tenant.lease_end_date) 
                              ? 'Expired' 
                              : isLeaseExpiringSoon(tenant.lease_end_date)
                              ? 'Expires soon'
                              : 'Active lease'
                            }
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">No lease dates</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {tenant.rent_amount ? (
                        <div className="font-medium">
                          {formatRinggit(tenant.rent_amount)}/mo
                        </div>
                      ) : (
                        <span className="text-gray-400">Not set</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_COLORS[tenant.status]} className="capitalize">
                        {tenant.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewTenant(tenant)}
                        >
                          👁️ View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditTenant(tenant)}
                        >
                          ✏️ Edit
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteTenant(tenant.id)}
                        >
                          🗑️ Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Tenant"
        size="lg"
      >
        <AddTenantForm
          onSuccess={handleAddTenant}
          onCancel={() => setShowAddModal(false)}
        />
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={closeModals}
        title="Edit Tenant Profile"
        size="lg"
      >
        {selectedTenant && (
          <EditTenantForm
            tenant={selectedTenant}
            onSuccess={handleUpdateTenant}
            onCancel={closeModals}
          />
        )}
      </Modal>

      <TenantDetailsModal
        isOpen={showDetailsModal}
        onClose={closeModals}
        tenantId={selectedTenant?.id}
        onEdit={(tenant) => {
          setShowDetailsModal(false)
          handleEditTenant(tenant)
        }}
      />
    </div>
  )
}