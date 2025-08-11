import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import Spinner from '../ui/Spinner'

export default function ProtectedRoute({ children }) {
  const { user, loading, checkAuth } = useAuthStore()
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    const runAuthCheck = async () => {
      console.log('🛡️ ProtectedRoute: Starting auth check...')
      try {
        await checkAuth()
        console.log('🛡️ ProtectedRoute: Auth check completed successfully')
      } catch (error) {
        console.error('🛡️ ProtectedRoute: Auth check failed:', error)
      } finally {
        console.log('🛡️ ProtectedRoute: Setting initializing to false')
        setInitializing(false)
      }
    }
    
    runAuthCheck()
  }, [])

  console.log('🛡️ ProtectedRoute state:', { initializing, loading, hasUser: !!user })

  // Only show loading spinner if we're still initializing OR if auth store is loading
  if (initializing || loading) {
    console.log('🔄 ProtectedRoute: Showing loading spinner - initializing:', initializing, 'loading:', loading)
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