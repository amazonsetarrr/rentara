import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import { formatCurrency } from '../../utils/currency'

export default function ViewPaymentDetailsModal({ isOpen, onClose, payment }) {
  if (!payment) return null

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

  const status = getStatusText(payment)

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Payment Details" 
      size="lg"
    >
      <div className="space-y-6">
        {/* Payment Overview */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {formatCurrency(payment.amount)}
              </h3>
              <p className="text-sm text-gray-600">{payment.payment_type?.display_name || 'Unknown Type'}</p>
            </div>
            <Badge variant={getStatusBadgeVariant(status)} className="capitalize">
              {status}
            </Badge>
          </div>
        </div>

        {/* Tenant & Property Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Tenant Information</h4>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-500">Name:</span>
                <p className="font-medium">{payment.tenant?.full_name || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Email:</span>
                <p className="text-sm">{payment.tenant?.email || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Phone:</span>
                <p className="text-sm">{payment.tenant?.phone || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-3">Property Information</h4>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-500">Unit:</span>
                <p className="font-medium">{payment.unit?.unit_number || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Property:</span>
                <p className="text-sm">{payment.unit?.properties?.name || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Address:</span>
                <p className="text-sm">{payment.unit?.properties?.address || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Payment Details</h4>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">Amount</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatCurrency(payment.amount)}</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">Due Date</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(payment.due_date).toLocaleDateString()}
                  </td>
                </tr>
                {payment.paid_date && (
                  <tr>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">Paid Date</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(payment.paid_date).toLocaleDateString()}
                    </td>
                  </tr>
                )}
                {payment.paid_amount > 0 && (
                  <tr>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">Paid Amount</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatCurrency(payment.paid_amount)}
                    </td>
                  </tr>
                )}
                {payment.reference_number && (
                  <tr>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">Reference Number</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{payment.reference_number}</td>
                  </tr>
                )}
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">Created Date</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(payment.created_at).toLocaleDateString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Description/Notes */}
        {payment.description && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Description</h4>
            <p className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-md p-3">
              {payment.description}
            </p>
          </div>
        )}

        {/* Overdue Warning */}
        {status === 'overdue' && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L5.232 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-red-800">Payment Overdue</p>
                <p className="text-sm text-red-700">
                  This payment was due on {new Date(payment.due_date).toLocaleDateString()}. 
                  Please follow up with the tenant.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {status !== 'paid' && (
            <Button variant="primary">
              Record Payment
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}