import React from 'react'
import { Navigate } from 'react-router-dom'
import { useSystemOwnerStore } from '../../stores/systemOwnerStore'
import Spinner from '../ui/Spinner'

export default function SystemOwnerProtectedRoute({ children }) {
  const { user, profile, loading } = useSystemOwnerStore()

  console.log('🔐 SystemOwnerProtectedRoute render:', { 
    user: !!user, 
    profile: !!profile, 
    is_system_owner: profile?.is_system_owner, 
    loading 
  })

  if (loading) {
    console.log('🔐 SystemOwnerProtectedRoute: Still loading...')
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner size="xl" />
      </div>
    )
  }

  if (!user) {
    console.log('🔐 SystemOwnerProtectedRoute: No user, redirecting to auth')
    return <Navigate to="/superadmin/auth" replace />
  }

  if (!profile?.is_system_owner) {
    console.log('🔐 SystemOwnerProtectedRoute: User is not system owner, redirecting to auth')
    return <Navigate to="/superadmin/auth" replace />
  }

  console.log('🔐 SystemOwnerProtectedRoute: Auth successful, rendering children')
  return children
}