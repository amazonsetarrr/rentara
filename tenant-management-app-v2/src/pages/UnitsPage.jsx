import { useState, useEffect } from 'react'
import { unitsService } from '../services/units'
import Card, { CardHeader, CardContent } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Badge from '../components/ui/Badge'
import Table, { TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table'
import AddUnitForm from '../components/forms/AddUnitForm'
import Spinner from '../components/ui/Spinner'

const STATUS_COLORS = {
  vacant: 'success',
  occupied: 'info', 
  maintenance: 'warning',
  unavailable: 'danger'
}

export default function UnitsPage() {
  const [units, setUnits] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    loadUnits()
  }, [])

  const loadUnits = async () => {
    setLoading(true)
    const { data } = await unitsService.getUnits()
    setUnits(data || [])
    setLoading(false)
  }

  const handleAddUnit = (newUnit) => {
    setUnits(prev => [newUnit, ...prev])
    setShowAddModal(false)
  }

  const handleStatusChange = async (unitId, newStatus) => {
    const { data, error } = await unitsService.updateUnitStatus(unitId, newStatus)
    if (!error && data) {
      setUnits(prev => prev.map(unit => 
        unit.id === unitId ? { ...unit, status: newStatus } : unit
      ))
    }
  }

  const handleDeleteUnit = async (id) => {
    if (!confirm('Are you sure you want to delete this unit?')) return
    
    const { error } = await unitsService.deleteUnit(id)
    if (!error) {
      setUnits(prev => prev.filter(u => u.id !== id))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Units</h1>
          <p className="text-gray-600">Manage individual units across your properties</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Unit
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {['vacant', 'occupied', 'maintenance', 'unavailable'].map(status => {
          const count = units.filter(unit => unit.status === status).length
          return (
            <Card key={status}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 capitalize">{status}</p>
                    <p className="text-2xl font-bold text-gray-900">{count}</p>
                  </div>
                  <Badge variant={STATUS_COLORS[status]} className="capitalize">
                    {status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {units.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No units yet</h3>
            <p className="text-gray-500 mb-4">Add units to your properties to start managing tenants</p>
            <Button onClick={() => setShowAddModal(true)}>Add Unit</Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">All Units ({units.length})</h2>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Unit</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Rent</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {units.map((unit) => (
                  <TableRow key={unit.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900">Unit {unit.unit_number}</div>
                        <div className="text-sm text-gray-500">
                          {unit.bedrooms}br/{unit.bathrooms}ba
                          {unit.square_footage && ` • ${unit.square_footage} sqft`}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{unit.properties?.name}</div>
                        <div className="text-sm text-gray-500">{unit.properties?.address}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default" className="capitalize">
                        {unit.unit_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {unit.rent_amount ? (
                        <div className="font-medium">
                          ${unit.rent_amount.toLocaleString()}
                        </div>
                      ) : (
                        <span className="text-gray-400">Not set</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {unit.tenants?.length > 0 ? (
                        <div>
                          <div className="font-medium">
                            {unit.tenants[0].first_name} {unit.tenants[0].last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            Lease ends: {new Date(unit.tenants[0].lease_end_date).toLocaleDateString()}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">Vacant</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <select
                        value={unit.status}
                        onChange={(e) => handleStatusChange(unit.id, e.target.value)}
                        className="text-sm border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="vacant">Vacant</option>
                        <option value="occupied">Occupied</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="unavailable">Unavailable</option>
                      </select>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                        <Button 
                          variant="danger" 
                          size="sm"
                          onClick={() => handleDeleteUnit(unit.id)}
                        >
                          Delete
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
        title="Add New Unit"
        size="lg"
      >
        <AddUnitForm
          onSuccess={handleAddUnit}
          onCancel={() => setShowAddModal(false)}
        />
      </Modal>
    </div>
  )
}