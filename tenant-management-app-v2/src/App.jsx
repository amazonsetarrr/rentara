import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from './stores/authStore'
import ProtectedRoute from './components/auth/ProtectedRoute'
import Layout from './components/layout/Layout'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import PropertiesPage from './pages/PropertiesPage'
import UnitsPage from './pages/UnitsPage'
import TenantsPage from './pages/TenantsPage'
import Spinner from './components/ui/Spinner'

function App() {
  const { user, loading, checkAuth } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner size="xl" />
      </div>
    )
  }

  return (
    <Router>
      <Layout>
        <Routes>
          <Route 
            path="/" 
            element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/auth" replace />} 
          />
          <Route 
            path="/auth" 
            element={user ? <Navigate to="/dashboard" replace /> : <AuthPage />} 
          />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/properties" 
            element={
              <ProtectedRoute>
                <PropertiesPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/units" 
            element={
              <ProtectedRoute>
                <UnitsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/tenants" 
            element={
              <ProtectedRoute>
                <TenantsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/reports" 
            element={
              <ProtectedRoute>
                <div className="text-center py-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Reports</h2>
                  <p className="text-gray-600">Coming soon...</p>
                </div>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute>
                <div className="text-center py-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Settings</h2>
                  <p className="text-gray-600">Coming soon...</p>
                </div>
              </ProtectedRoute>
            } 
          />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
