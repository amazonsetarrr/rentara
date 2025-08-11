import { useState } from 'react'
import { authService } from '../../services/auth'
import { useAuthStore } from '../../stores/authStore'
import Input from '../ui/Input'
import Button from '../ui/Button'

export default function SignupForm({ onSwitchToLogin }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    organizationName: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { checkAuth } = useAuthStore()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    const { data, error } = await authService.signUpWithOrganization(
      formData.email,
      formData.password,
      formData.fullName,
      formData.organizationName
    )
    
    if (error) {
      setError(error.message)
    } else {
      await checkAuth()
    }
    
    setLoading(false)
  }

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create Organization</h1>
        <p className="text-gray-600 mt-2">Start your property management journey</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <Input
          label="Organization Name"
          type="text"
          name="organizationName"
          value={formData.organizationName}
          onChange={handleChange}
          required
          placeholder="Your company or organization name"
        />

        <Input
          label="Full Name"
          type="text"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          required
          placeholder="Your full name"
        />

        <Input
          label="Email Address"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          placeholder="your@email.com"
        />

        <Input
          label="Password"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
          placeholder="Choose a strong password"
        />

        <Input
          label="Confirm Password"
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
          placeholder="Confirm your password"
        />

        <Button
          type="submit"
          loading={loading}
          className="w-full"
        >
          Create Organization & Account
        </Button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <button
            onClick={onSwitchToLogin}
            className="font-medium text-primary-600 hover:text-primary-500"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  )
}