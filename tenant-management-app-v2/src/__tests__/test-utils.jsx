import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'

// Test utilities for handling router conflicts and providing proper test context

// Render App without wrapping in additional router since App already has BrowserRouter
export const renderApp = (ui, options = {}) => {
  return render(ui, options)
}

// Render components that need routing context
export const renderWithRouter = (ui, { initialEntries = ['/'], ...options } = {}) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      {ui}
    </MemoryRouter>,
    options
  )
}

// Mock auth store with default authenticated user
export const mockAuthenticatedUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  profile: {
    full_name: 'Test User',
    role: 'admin',
    organizations: {
      name: 'Test Organization',
      subscription_plan: 'Pro'
    }
  }
}

// Mock auth store with loading state
export const mockAuthStore = (overrides = {}) => ({
  user: mockAuthenticatedUser,
  profile: mockAuthenticatedUser.profile,
  loading: false,
  checkAuth: vi.fn(),
  ...overrides
})

// Create an isolated App component without Router for testing
export const createAppWithoutRouter = () => {
  // We need to mock the actual App component structure without the Router wrapper
  const { useAuthStore } = require('../stores/authStore')
  const { Routes, Route, Navigate } = require('react-router-dom')
  const ProtectedRoute = require('../components/auth/ProtectedRoute').default
  const Layout = require('../components/layout/Layout').default
  const AuthPage = require('../pages/AuthPage').default
  const Dashboard = require('../pages/Dashboard').default
  const PropertiesPage = require('../pages/PropertiesPage').default
  const UnitsPage = require('../pages/UnitsPage').default
  const TenantsPage = require('../pages/TenantsPage').default
  const PaymentsPage = require('../pages/PaymentsPage').default
  const ReportsPage = require('../pages/ReportsPage').default
  const SettingsPage = require('../pages/SettingsPage').default
  const Spinner = require('../components/ui/Spinner').default
  const SuperAdminApp = require('../SuperAdminApp').default
  const ErrorBoundary = require('../components/ErrorBoundary').default
  
  return function AppRoutes() {
    const { user, loading } = useAuthStore()
    
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Spinner size="xl" />
        </div>
      )
    }

    return (
      <ErrorBoundary>
        <Routes>
          {/* SuperAdmin Portal Routes */}
          <Route path="/superadmin/*" element={<SuperAdminApp />} />
          
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
                      <SettingsPage />
                    </ProtectedRoute>
                  } 
                />
              </Routes>
            </Layout>
          } />
        </Routes>
      </ErrorBoundary>
    )
  }
}

// Mock services for consistent testing
export const mockServices = () => {
  vi.doMock('../services/organizations', () => ({
    organizationsService: {
      getOrganizationStats: vi.fn().mockResolvedValue({
        data: {
          total_properties: 5,
          total_units: 20,
          active_tenants: 15,
          occupancy_rate: 75
        }
      }),
      updateOrganization: vi.fn().mockResolvedValue({ data: {} }),
      getOrganization: vi.fn().mockResolvedValue({ data: mockAuthenticatedUser.profile.organizations })
    }
  }))
  
  vi.doMock('../services/logger', () => ({
    default: {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      action: vi.fn()
    }
  }))
}

// Wrapper to handle async operations in components
export const waitForComponent = async () => {
  await new Promise(resolve => setTimeout(resolve, 0))
}