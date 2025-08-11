import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import Spinner from '../ui/Spinner'

export default function ProtectedRoute({ children }) {
  const { user, loading, checkAuth } = useAuthStore()
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    checkAuth().finally(() => setInitializing(false))
  }, [])

  if (initializing || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner size="xl" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/auth" replace />
  }

  return children
}