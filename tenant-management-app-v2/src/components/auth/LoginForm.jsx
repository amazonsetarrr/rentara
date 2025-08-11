import { useState } from 'react'
import { authService } from '../../services/auth'
import { useAuthStore } from '../../stores/authStore'
import Input from '../ui/Input'
import Button from '../ui/Button'

export default function LoginForm({ onSwitchToSignup }) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { checkAuth } = useAuthStore()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error } = await authService.signIn(formData.email, formData.password)
    
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
        <h1 className="text-3xl font-bold text-gray-900">Welcome back</h1>
        <p className="text-gray-600 mt-2">Sign in to your account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <Input
          label="Email address"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          placeholder="Enter your email"
        />

        <Input
          label="Password"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
          placeholder="Enter your password"
        />

        <Button
          type="submit"
          loading={loading}
          className="w-full"
        >
          Sign In
        </Button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-600">
          Don't have an account?{' '}
          <button
            onClick={onSwitchToSignup}
            className="font-medium text-primary-600 hover:text-primary-500"
          >
            Create organization
          </button>
        </p>
      </div>
    </div>
  )
}