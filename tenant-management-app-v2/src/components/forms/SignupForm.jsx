import { useState } from 'react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { authService } from '../../services/auth'
import { useAuthStore } from '../../stores/authStore'

export default function SignupForm({ onBackToLogin, onSuccess }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    organizationName: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const { checkAuth } = useAuthStore()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long')
      setLoading(false)
      return
    }

    if (!formData.fullName.trim()) {
      setError('Full name is required')
      setLoading(false)
      return
    }

    if (!formData.organizationName.trim()) {
      setError('Organization name is required')
      setLoading(false)
      return
    }

    try {
      const { data, error: signupError } = await authService.signUpWithOrganization(
        formData.email,
        formData.password,
        formData.fullName,
        formData.organizationName
      )

      if (signupError) {
        setError(signupError.message || 'Registration failed')
      } else if (data?.needsConfirmation) {
        setSuccess(data.message)
      } else {
        setSuccess('Registration successful! You can now sign in.')
        await checkAuth()
        if (onSuccess) onSuccess()
      }
    } catch (error) {
      console.error('Signup error:', error)
      setError('Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Create your organization</h2>
        <p className="text-gray-600">Set up your account and organization to get started</p>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Input
              label="Full Name"
              id="fullName"
              type="text"
              name="fullName"
              placeholder="John Doe"
              value={formData.fullName}
              onChange={handleChange}
              required
              disabled={loading}
              className="h-11"
            />
          </div>

          <div>
            <Input
              label="Organization Name"
              id="organizationName"
              type="text"
              name="organizationName"
              placeholder="Acme Properties"
              value={formData.organizationName}
              onChange={handleChange}
              required
              disabled={loading}
              className="h-11"
            />
          </div>
        </div>

        <div>
          <Input
            label="Email Address"
            id="email"
            type="email"
            name="email"
            placeholder="your@email.com"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={loading}
            className="h-11"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Input
              label="Password"
              id="password"
              type="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
              className="h-11"
            />
          </div>

          <div>
            <Input
              label="Confirm Password"
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              disabled={loading}
              className="h-11"
            />
          </div>
        </div>

        <div className="flex flex-col space-y-3 pt-4">
          <Button
            type="submit"
            loading={loading}
            disabled={loading || !!success}
            className="w-full h-11 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-medium"
          >
            {loading ? 'Creating Account...' : 'Create Organization'}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={onBackToLogin}
            disabled={loading}
            className="w-full h-11 border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent"
          >
            Back to Sign In
          </Button>
        </div>
      </form>
    </div>
  )
}