import { Link } from 'react-router-dom'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'

export default function NotFoundPage() {
  const currentPath = window.location.pathname

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <div className="p-8 text-center">
          {/* 404 Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-6">
            <svg
              className="h-8 w-8 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>

          {/* Error Message */}
          <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            Page Not Found
          </h2>
          
          <p className="text-gray-600 mb-6">
            The page you're looking for doesn't exist or has been moved.
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
            <Link to="/">
              <Button variant="primary" className="w-full sm:w-auto">
                Go Home
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

          {/* Helpful Links */}
          <div className="border-t pt-6">
            <p className="text-sm text-gray-500 mb-4">
              Looking for something specific?
            </p>
            <div className="flex flex-wrap gap-2 justify-center text-sm">
              <Link 
                to="/dashboard" 
                className="text-blue-600 hover:text-blue-800 hover:underline"
              >
                Dashboard
              </Link>
              <span className="text-gray-300">•</span>
              <Link 
                to="/properties" 
                className="text-blue-600 hover:text-blue-800 hover:underline"
              >
                Properties
              </Link>
              <span className="text-gray-300">•</span>
              <Link 
                to="/tenants" 
                className="text-blue-600 hover:text-blue-800 hover:underline"
              >
                Tenants
              </Link>
              <span className="text-gray-300">•</span>
              <Link 
                to="/settings" 
                className="text-blue-600 hover:text-blue-800 hover:underline"
              >
                Settings
              </Link>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}