import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Analytics } from '@vercel/analytics/react';
import { useAuthStore } from './stores/authStore'
import ProtectedRoute from './components/auth/ProtectedRoute'
import Layout from './components/layout/Layout'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import PropertiesPage from './pages/PropertiesPage'
import UnitsPage from './pages/UnitsPage'
import TenantsPage from './pages/TenantsPage'
import PaymentsPage from './pages/PaymentsPage'
import ReportsPage from './pages/ReportsPage'
import Spinner from './components/ui/Spinner'
import SystemOwnerApp from './SystemOwnerApp'
import ErrorBoundary from './components/ErrorBoundary'
import LogMonitor from './components/debug/LogMonitor'
import logger from './services/logger'
import { useLogger } from './hooks/useLogger'

function App() {
  const { user, loading, checkAuth } = useAuthStore()
  const { logPageView, logError } = useLogger()
  const [showLogMonitor, setShowLogMonitor] = useState(false)

  useEffect(() => {
    checkAuth()
    
    // Log app initialization
    logger.info('Application Started', {
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      type: 'app_init'
    })

    // Set up keyboard shortcut to open log monitor (Ctrl+Shift+L)
    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'L') {
        event.preventDefault()
        setShowLogMonitor(true)
        logger.action('Log Monitor Opened', { trigger: 'keyboard_shortcut' })
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [checkAuth])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner size="xl" />
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          {/* SuperAdmin Portal Routes */}
          <Route path="/superadmin/*" element={<SystemOwnerApp />} />
          
          {/* Regular Tenant Portal Routes */}
          <Route path="/*" element={
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
                path="/payments" 
                element={
                  <ProtectedRoute>
                    <PaymentsPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/reports" 
                element={
                  <ProtectedRoute>
                    <ReportsPage />
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
        } />
      </Routes>
      
      {/* Log Monitor */}
      <LogMonitor 
        isOpen={showLogMonitor} 
        onClose={() => setShowLogMonitor(false)} 
      />
      
      {/* Debug Info in Development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 z-40">
          <button
            onClick={() => setShowLogMonitor(true)}
            className="bg-blue-600 text-white px-3 py-2 rounded-lg shadow-lg hover:bg-blue-700 text-sm"
            title="Open Log Monitor (Ctrl+Shift+L)"
          >
            📊 Logs
          </button>
        </div>
      )}
      <Analytics />
    </Router>
    </ErrorBoundary>
  )
}

export default App
