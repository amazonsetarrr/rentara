import { Component } from 'react'
import logger from '../services/logger'
import Button from './ui/Button'
import Card from './ui/Card'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      showDetails: false 
    }
  }

  static getDerivedStateFromError() {
    // Update state so the next render will show the fallback UI
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to our logging service
    logger.error('React Error Boundary Caught Error', {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      errorInfo: {
        componentStack: errorInfo.componentStack
      },
      props: this.props,
      type: 'react_error'
    })

    // Store error details in state for display
    this.setState({
      error,
      errorInfo
    })
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      showDetails: false 
    })
  }

  handleReload = () => {
    window.location.reload()
  }

  toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }))
  }

  handleReportIssue = () => {
    // Export recent logs and error details
    const errorDetails = {
      error: this.state.error,
      errorInfo: this.state.errorInfo,
      recentLogs: logger.getLogs({ level: 'error' }).slice(0, 10),
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(errorDetails, null, 2)], { 
      type: 'application/json' 
    })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = `error-report-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    logger.action('Error Report Generated', { errorMessage: this.state.error?.message })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full">
            <div className="p-8 text-center">
              {/* Error Icon */}
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
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Oops! Something went wrong
              </h1>
              
              <p className="text-gray-600 mb-6">
                We encountered an unexpected error. The error has been logged and our team will investigate.
              </p>

              {/* Error Summary */}
              {this.state.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
                  <h3 className="text-sm font-medium text-red-800 mb-2">Error Details:</h3>
                  <p className="text-sm text-red-700 font-mono">
                    {this.state.error.message}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
                <Button 
                  onClick={this.handleReset}
                  variant="primary"
                >
                  Try Again
                </Button>
                
                <Button 
                  onClick={this.handleReload}
                  variant="outline"
                >
                  Reload Page
                </Button>
                
                <Button 
                  onClick={this.handleReportIssue}
                  variant="outline"
                >
                  Download Error Report
                </Button>
              </div>

              {/* Show/Hide Technical Details */}
              <div className="border-t pt-6">
                <Button
                  onClick={this.toggleDetails}
                  variant="text"
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  {this.state.showDetails ? 'Hide' : 'Show'} Technical Details
                </Button>

                {this.state.showDetails && (
                  <div className="mt-4 text-left">
                    <div className="bg-gray-100 rounded-lg p-4 mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Stack Trace:</h4>
                      <pre className="text-xs text-gray-700 overflow-auto max-h-40">
                        {this.state.error?.stack}
                      </pre>
                    </div>
                    
                    {this.state.errorInfo && (
                      <div className="bg-gray-100 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Component Stack:</h4>
                        <pre className="text-xs text-gray-700 overflow-auto max-h-40">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Help Text */}
              <div className="mt-6 text-sm text-gray-500">
                <p>
                  If this problem persists, please contact support with the error report.
                </p>
              </div>
            </div>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary