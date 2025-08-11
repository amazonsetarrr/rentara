import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import Spinner from '../ui/Spinner'

export default function ProtectedRoute({ children }) {
  const { user, loading, checkAuth } = useAuthStore()
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    console.log('🛡️ ProtectedRoute: Starting initial auth check...')
    checkAuth().finally(() => {
      console.log('🛡️ ProtectedRoute: Initial auth check finished')
      setInitializing(false)
    })
  }, [])

  console.log('🛡️ ProtectedRoute state:', { initializing, loading, hasUser: !!user })

  if (initializing || loading) {
    console.log('🔄 ProtectedRoute: Showing loading spinner')
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

  console.log('✅ ProtectedRoute: User authenticated, showing children')
  return children
}