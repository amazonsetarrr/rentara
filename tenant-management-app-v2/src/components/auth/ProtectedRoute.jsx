import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import Spinner from '../ui/Spinner'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuthStore()

  console.log('🛡️ ProtectedRoute state:', { loading, hasUser: !!user })

  // Show loading spinner only if auth store is loading
  if (loading) {
    console.log('🔄 ProtectedRoute: Auth store is loading, showing spinner')
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Spinner size="xl" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    console.log('🔐 ProtectedRoute: No user, redirecting to auth')
    return <Navigate to="/auth" replace />
  }

  console.log('✅ ProtectedRoute: User authenticated, showing dashboard')
  return children
}