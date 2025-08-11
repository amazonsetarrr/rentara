import { useState, useEffect } from 'react'
import { propertiesService } from '../services/properties'
import Card, { CardHeader, CardContent } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Badge from '../components/ui/Badge'
import Table, { TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table'
import AddPropertyForm from '../components/forms/AddPropertyForm'
import EditPropertyForm from '../components/forms/EditPropertyForm'
import PropertyDetailsModal from '../components/modals/PropertyDetailsModal'
import Spinner from '../components/ui/Spinner'

export default function PropertiesPage() {
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState(null)

  useEffect(() => {
    loadProperties()
  }, [])

  const loadProperties = async () => {
    setLoading(true)
    const { data } = await propertiesService.getProperties()
    setProperties(data || [])
    setLoading(false)
  }

  const handleAddProperty = (newProperty) => {
    setProperties(prev => [newProperty, ...prev])
    setShowAddModal(false)
  }

  const handleEditProperty = (updatedProperty) => {
    setProperties(prev => prev.map(p => p.id === updatedProperty.id ? updatedProperty : p))
    setShowEditModal(false)
    setSelectedProperty(null)
  }

  const handleDeleteProperty = async (id) => {
    if (!confirm('Are you sure you want to delete this property?')) return
    
    const { error } = await propertiesService.deleteProperty(id)
    if (!error) {
      setProperties(prev => prev.filter(p => p.id !== id))
    }
  }

  const openEditModal = (property) => {
    setSelectedProperty(property)
    setShowEditModal(true)
  }

  const openDetailsModal = (property) => {
    setSelectedProperty(property)
    setShowDetailsModal(true)
  }

  const closeModals = () => {
    setShowAddModal(false)
    setShowEditModal(false)
    setShowDetailsModal(false)
    setSelectedProperty(null)
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
          <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
          <p className="text-gray-600">Manage your property portfolio</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Property
        </Button>
      </div>

      {properties.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No properties yet</h3>
            <p className="text-gray-500 mb-4">Get started by adding your first property</p>
            <Button onClick={() => setShowAddModal(true)}>Add Property</Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">All Properties ({properties.length})</h2>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Units</TableHead>
                  <TableHead>Occupancy</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {properties.map((property) => (
                  <TableRow key={property.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900">{property.name}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-500">
                        {property.address}
                        {property.city && (
                          <div>{property.city}, {property.state} {property.zip_code}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="info" className="capitalize">
                        {property.property_type || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{property.total_units} total</div>
                        <div className="text-gray-500">
                          {property.occupied_units} occupied, {property.vacant_units} vacant
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="text-sm font-medium">
                          {property.occupancy_rate}%
                        </div>
                        <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${property.occupancy_rate}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openDetailsModal(property)}
                        >
                          View
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openEditModal(property)}
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="danger" 
                          size="sm"
                          onClick={() => handleDeleteProperty(property.id)}
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

      {/* Add Property Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={closeModals}
        title="Add New Property"
        size="lg"
      >
        <AddPropertyForm
          onSuccess={handleAddProperty}
          onCancel={closeModals}
        />
      </Modal>

      {/* Edit Property Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={closeModals}
        title="Edit Property"
        size="lg"
      >
        {selectedProperty && (
          <EditPropertyForm
            property={selectedProperty}
            onSuccess={handleEditProperty}
            onCancel={closeModals}
          />
        )}
      </Modal>

      {/* Property Details Modal */}
      <PropertyDetailsModal
        isOpen={showDetailsModal}
        onClose={closeModals}
        propertyId={selectedProperty?.id}
      />
    </div>
  )
}