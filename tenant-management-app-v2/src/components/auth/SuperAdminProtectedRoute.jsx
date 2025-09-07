import React from 'react'
import { Navigate } from 'react-router-dom'
import { useSuperAdminStore } from '../../stores/superAdminStore'
import Spinner from '../ui/Spinner'

export default function SuperAdminProtectedRoute({ children }) {
  const { user, profile, loading } = useSuperAdminStore()

  console.log('🔐 SystemOwnerProtectedRoute render:', { 
    user: !!user, 
    profile: !!profile, 
    is_super_admin: profile?.is_super_admin, 
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

  if (!profile?.is_super_admin) {
    console.log('🔐 SystemOwnerProtectedRoute: User is not system owner, redirecting to auth')
    return <Navigate to="/superadmin/auth" replace />
  }

  console.log('🔐 SystemOwnerProtectedRoute: Auth successful, rendering children')
  return children
}