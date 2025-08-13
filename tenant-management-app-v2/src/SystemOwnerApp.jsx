import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useSystemOwnerStore } from './stores/systemOwnerStore'
import SystemOwnerProtectedRoute from './components/auth/SystemOwnerProtectedRoute'
import SystemOwnerAuth from './pages/SystemOwnerAuth'
import SystemOwnerDashboard from './pages/SystemOwnerDashboard'
import Spinner from './components/ui/Spinner'

function SystemOwnerApp() {
  const { user, loading, checkAuth } = useSystemOwnerStore()

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
        element={user ? <Navigate to="/superadmin/dashboard" replace /> : <SystemOwnerAuth />} 
      />
      <Route 
        path="/dashboard" 
        element={
          <SystemOwnerProtectedRoute>
            <SystemOwnerDashboard />
          </SystemOwnerProtectedRoute>
        } 
      />
      <Route 
        path="/organizations" 
        element={
          <SystemOwnerProtectedRoute>
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Organization Management</h2>
              <p className="text-gray-600">Advanced organization management coming soon...</p>
            </div>
          </SystemOwnerProtectedRoute>
        } 
      />
      <Route 
        path="/analytics" 
        element={
          <SystemOwnerProtectedRoute>
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">System Analytics</h2>
              <p className="text-gray-600">Detailed analytics dashboard coming soon...</p>
            </div>
          </SystemOwnerProtectedRoute>
        } 
      />
      <Route 
        path="/settings" 
        element={
          <SystemOwnerProtectedRoute>
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">System Settings</h2>
              <p className="text-gray-600">System configuration coming soon...</p>
            </div>
          </SystemOwnerProtectedRoute>
        } 
      />
    </Routes>
  )
}

export default SystemOwnerApp