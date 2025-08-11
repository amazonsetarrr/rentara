import { useState, useEffect } from 'react'
import { propertiesService } from '../../services/properties'
import Modal from '../ui/Modal'
import Card, { CardHeader, CardContent } from '../ui/Card'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import Spinner from '../ui/Spinner'
import { formatCurrency } from '../../utils/currency'

export default function PropertyDetailsModal({ isOpen, onClose, propertyId }) {
  const [property, setProperty] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && propertyId) {
      loadProperty()
    }
  }, [isOpen, propertyId])

  const loadProperty = async () => {
    setLoading(true)
    const { data } = await propertiesService.getProperty(propertyId)
    setProperty(data)
    setLoading(false)
  }

  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Property Details" size="xl">
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      ) : property ? (
        <div className="space-y-6">
          {/* Property Info */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Property Information</h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <p className="text-gray-900">{property.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <Badge variant="info" className="capitalize">
                    {property.property_type || 'N/A'}
                  </Badge>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <p className="text-gray-900">
                    {property.address}
                    {property.city && (
                      <span><br />{property.city}, {property.state} {property.zip_code}</span>
                    )}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Units</label>
                  <p className="text-gray-900">{property.total_units || 0}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Occupancy Rate</label>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-900 font-medium">
                      {Math.round((property.units?.filter(u => u.status === 'occupied').length || 0) / (property.units?.length || 1) * 100) || 0}%
                    </span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ 
                          width: `${Math.round((property.units?.filter(u => u.status === 'occupied').length || 0) / (property.units?.length || 1) * 100) || 0}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Units */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Units ({property.units?.length || 0})</h3>
            </CardHeader>
            <CardContent>
              {property.units?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {property.units.map((unit) => (
                    <div key={unit.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900">Unit {unit.unit_number}</h4>
                        <Badge 
                          variant={unit.status === 'occupied' ? 'success' : unit.status === 'vacant' ? 'warning' : 'danger'}
                          className="capitalize"
                        >
                          {unit.status}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>Type: {unit.unit_type || 'N/A'}</p>
                        <p>Rent: {formatCurrency(unit.rent_amount)}/month</p>
                        {unit.tenants?.length > 0 && (
                          <p>Tenant: {unit.tenants[0].first_name} {unit.tenants[0].last_name}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No units found for this property</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <p>Property not found</p>
        </div>
      )}
    </Modal>
  )
}