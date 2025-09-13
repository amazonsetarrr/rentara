import { Link } from 'react-router-dom'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'

export default function SuperAdminNotFound() {
  const currentPath = window.location.pathname

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <div className="p-8 text-center">
          {/* 404 Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
            <svg
              className="h-8 w-8 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L5.232 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>

          {/* Error Message */}
          <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            SuperAdmin Page Not Found
          </h2>
          
          <p className="text-gray-600 mb-6">
            The SuperAdmin page you're looking for doesn't exist or may not be implemented yet.
          </p>

          {/* Current Path Display */}
          <div className="bg-gray-100 border border-gray-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-700">
              <span className="font-medium">Requested URL:</span>
              <br />
              <code className="text-red-600 font-mono text-sm">
                {currentPath}
              </code>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
            <Link to="/superadmin/dashboard">
              <Button variant="primary" className="w-full sm:w-auto">
                Go to Dashboard
              </Button>
            </Link>
            
            <Button 
              onClick={() => window.history.back()}
              variant="outline"
              className="w-full sm:w-auto"
            >
              Go Back
            </Button>
          </div>

          {/* SuperAdmin Navigation Links */}
          <div className="border-t pt-6">
            <p className="text-sm text-gray-500 mb-4">
              Available SuperAdmin sections:
            </p>
            <div className="flex flex-wrap gap-2 justify-center text-sm">
              <Link 
                to="/superadmin/dashboard" 
                className="text-blue-600 hover:text-blue-800 hover:underline"
              >
                Dashboard
              </Link>
              <span className="text-gray-300">•</span>
              <Link 
                to="/superadmin/users" 
                className="text-blue-600 hover:text-blue-800 hover:underline"
              >
                Users
              </Link>
              <span className="text-gray-300">•</span>
              <Link 
                to="/superadmin/organizations" 
                className="text-blue-600 hover:text-blue-800 hover:underline"
              >
                Organizations
              </Link>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}