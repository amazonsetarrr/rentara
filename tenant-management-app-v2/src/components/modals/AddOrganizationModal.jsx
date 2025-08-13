import { useState } from 'react'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Button from '../ui/Button'
import { useSystemOwnerStore } from '../../stores/systemOwnerStore'

const SUBSCRIPTION_PLANS = [
  { value: 'trial', label: 'Trial (14 days)' },
  { value: 'starter', label: 'Starter Plan' },
  { value: 'professional', label: 'Professional Plan' },
  { value: 'enterprise', label: 'Enterprise Plan' }
]

const SUBSCRIPTION_STATUSES = [
  { value: 'trial', label: 'Trial' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'canceled', label: 'Canceled' }
]

export default function AddOrganizationModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    subscription_plan: 'trial',
    subscription_status: 'trial',
    trial_days: 14
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { createOrganization } = useSystemOwnerStore()

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  }

  const handleNameChange = (e) => {
    const name = e.target.value
    setFormData(prev => ({
      ...prev,
      name,
      slug: generateSlug(name)
    }))
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validation
    if (!formData.name.trim()) {
      setError('Organization name is required')
      setLoading(false)
      return
    }

    if (!formData.slug.trim()) {
      setError('Organization slug is required')
      setLoading(false)
      return
    }

    try {
      const organizationData = {
        ...formData,
        trial_ends_at: formData.subscription_status === 'trial' 
          ? new Date(Date.now() + formData.trial_days * 24 * 60 * 60 * 1000).toISOString()
          : null
      }

      const { data, error: createError } = await createOrganization(organizationData)

      if (createError) {
        setError(createError.message || 'Failed to create organization')
      } else {
        // Reset form
        setFormData({
          name: '',
          slug: '',
          subscription_plan: 'trial',
          subscription_status: 'trial',
          trial_days: 14
        })
        onSuccess?.(data)
        onClose()
      }
    } catch (error) {
      console.error('Organization creation error:', error)
      setError('Failed to create organization')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setFormData({
        name: '',
        slug: '',
        subscription_plan: 'trial',
        subscription_status: 'trial',
        trial_days: 14
      })
      setError('')
      onClose()
    }
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      title="Create New Organization"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Input
              label="Organization Name"
              name="name"
              value={formData.name}
              onChange={handleNameChange}
              placeholder="Acme Corporation"
              required
              disabled={loading}
            />
          </div>

          <div>
            <Input
              label="Organization Slug"
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              placeholder="acme-corporation"
              required
              disabled={loading}
              helperText="Used in URLs and database references"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Select
              label="Subscription Plan"
              name="subscription_plan"
              value={formData.subscription_plan}
              onChange={handleChange}
              options={SUBSCRIPTION_PLANS}
              required
              disabled={loading}
            />
          </div>

          <div>
            <Select
              label="Subscription Status"
              name="subscription_status"
              value={formData.subscription_status}
              onChange={handleChange}
              options={SUBSCRIPTION_STATUSES}
              required
              disabled={loading}
            />
          </div>
        </div>

        {formData.subscription_status === 'trial' && (
          <div>
            <Input
              label="Trial Duration (days)"
              name="trial_days"
              type="number"
              value={formData.trial_days}
              onChange={handleChange}
              min="1"
              max="365"
              disabled={loading}
            />
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={loading}
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Organization'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}