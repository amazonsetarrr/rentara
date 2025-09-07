import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useSuperAdminStore } from './stores/superAdminStore'
import SuperAdminProtectedRoute from './components/auth/SuperAdminProtectedRoute'
import SuperAdminAuth from './pages/SuperAdminAuth'
import SuperAdminDashboard from './pages/SuperAdminDashboard'
import Spinner from './components/ui/Spinner'

function SuperAdminApp() {
  const { user, loading, checkAuth } = useSuperAdminStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner size="xl" />
      </div>
    )
  }

  return (
    <Routes>
      <Route 
        path="/" 
        element={user ? <Navigate to="/superadmin/dashboard" replace /> : <Navigate to="/superadmin/auth" replace />} 
      />
      <Route 
        path="/auth" 
        element={user ? <Navigate to="/superadmin/dashboard" replace /> : <SuperAdminAuth />} 
      />
      <Route 
        path="/dashboard" 
        element={
          <SuperAdminProtectedRoute>
            <SuperAdminDashboard />
          </SuperAdminProtectedRoute>
        } 
      />
      <Route 
        path="/organizations" 
        element={
          <SuperAdminProtectedRoute>
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Organization Management</h2>
              <p className="text-gray-600">Advanced organization management coming soon...</p>
            </div>
          </SuperAdminProtectedRoute>
        } 
      />
      <Route 
        path="/analytics" 
        element={
          <SuperAdminProtectedRoute>
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">System Analytics</h2>
              <p className="text-gray-600">Detailed analytics dashboard coming soon...</p>
            </div>
          </SuperAdminProtectedRoute>
        } 
      />
      <Route 
        path="/settings" 
        element={
          <SuperAdminProtectedRoute>
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">System Settings</h2>
              <p className="text-gray-600">System configuration coming soon...</p>
            </div>
          </SuperAdminProtectedRoute>
        } 
      />
    </Routes>
  )
}

export default SuperAdminApp