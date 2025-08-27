// Centralized Logging Service
// Provides comprehensive error tracking and monitoring capabilities

class Logger {
  constructor() {
    this.logs = []
    this.maxLogs = 1000 // Keep last 1000 logs in memory
    this.logLevel = import.meta.env.PROD ? 'error' : 'debug'
    this.enableLocalStorage = true
    this.enableConsole = true
    
    // Initialize logger
    this.init()
  }

  init() {
    // Load existing logs from localStorage
    this.loadLogsFromStorage()
    
    // Set up global error handlers
    this.setupGlobalErrorHandlers()
    
    // Set up periodic log cleanup
    this.setupCleanup()
    
    console.log('🔍 Logger initialized - Level:', this.logLevel)
  }

  setupGlobalErrorHandlers() {
    // Catch unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      this.error('Global Error', {
        message: event.error?.message || event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        type: 'javascript_error'
      })
    })

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      // Extract more useful information from the rejection
      let reasonData = event.reason
      
      if (event.reason instanceof Error) {
        reasonData = {
          message: event.reason.message,
          stack: event.reason.stack,
          name: event.reason.name
        }
      } else if (typeof event.reason === 'object' && event.reason !== null) {
        try {
          reasonData = JSON.parse(JSON.stringify(event.reason))
        } catch {
          reasonData = { error: 'Could not serialize rejection reason' }
        }
      }

      this.error('Unhandled Promise Rejection', {
        reason: reasonData,
        reasonType: typeof event.reason,
        stack: event.reason?.stack,
        message: event.reason?.message || 'Unknown rejection',
        type: 'promise_rejection'
      })
    })

    // Catch network errors
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args)
        
        // Log API calls
        this.debug('API Request', {
          url: args[0],
          method: args[1]?.method || 'GET',
          status: response.status,
          statusText: response.statusText,
          type: 'api_request'
        })

        // Log API errors
        if (!response.ok) {
          this.warn('API Error Response', {
            url: args[0],
            method: args[1]?.method || 'GET',
            status: response.status,
            statusText: response.statusText,
            type: 'api_error'
          })
        }

        return response
      } catch (error) {
        this.error('Network Error', {
          url: args[0],
          method: args[1]?.method || 'GET',
          error: error.message,
          stack: error.stack,
          type: 'network_error'
        })
        throw error
      }
    }
  }

  setupCleanup() {
    // Clean up logs every hour
    setInterval(() => {
      this.cleanupLogs()
    }, 60 * 60 * 1000)
  }

  cleanupLogs() {
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
      this.saveLogsToStorage()
    }
  }

  loadLogsFromStorage() {
    if (!this.enableLocalStorage) return
    
    try {
      const storedLogs = localStorage.getItem('app_logs')
      if (storedLogs) {
        this.logs = JSON.parse(storedLogs)
      }
    } catch (error) {
      console.warn('Failed to load logs from storage:', error)
    }
  }

  saveLogsToStorage() {
    if (!this.enableLocalStorage) return
    
    try {
      localStorage.setItem('app_logs', JSON.stringify(this.logs.slice(-this.maxLogs)))
    } catch (error) {
      console.warn('Failed to save logs to storage:', error)
    }
  }

  createLogEntry(level, message, data = {}) {
    const logEntry = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      url: window.location.href,
      userAgent: navigator.userAgent,
      user: this.getCurrentUser(),
      sessionId: this.getSessionId()
    }

    this.logs.push(logEntry)
    this.cleanupLogs()
    this.saveLogsToStorage()

    return logEntry
  }

  getCurrentUser() {
    try {
      // Try to get user from auth store or localStorage
      const user = localStorage.getItem('user')
      return user ? JSON.parse(user) : null
    } catch {
      return null
    }
  }

  getSessionId() {
    let sessionId = sessionStorage.getItem('session_id')
    if (!sessionId) {
      sessionId = Date.now() + '_' + Math.random().toString(36).substr(2, 9)
      sessionStorage.setItem('session_id', sessionId)
    }
    return sessionId
  }

  shouldLog(level) {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 }
    return levels[level] >= levels[this.logLevel]
  }

  debug(message, data = {}) {
    if (!this.shouldLog('debug')) return
    
    const logEntry = this.createLogEntry('debug', message, data)
    
    if (this.enableConsole) {
      console.debug(`🔍 [DEBUG] ${message}`, data)
    }
    
    return logEntry
  }

  info(message, data = {}) {
    if (!this.shouldLog('info')) return
    
    const logEntry = this.createLogEntry('info', message, data)
    
    if (this.enableConsole) {
      console.info(`ℹ️ [INFO] ${message}`, data)
    }
    
    return logEntry
  }

  warn(message, data = {}) {
    if (!this.shouldLog('warn')) return
    
    const logEntry = this.createLogEntry('warn', message, data)
    
    if (this.enableConsole) {
      console.warn(`⚠️ [WARN] ${message}`, data)
    }
    
    return logEntry
  }

  error(message, data = {}) {
    if (!this.shouldLog('error')) return
    
    const logEntry = this.createLogEntry('error', message, data)
    
    if (this.enableConsole) {
      console.error(`❌ [ERROR] ${message}`, data)
    }
    
    return logEntry
  }

  // Log user actions
  action(action, data = {}) {
    this.info(`User Action: ${action}`, { ...data, type: 'user_action' })
  }

  // Log performance metrics
  performance(metric, value, data = {}) {
    this.debug(`Performance: ${metric}`, { 
      value, 
      ...data, 
      type: 'performance_metric' 
    })
  }

  // Log API calls with detailed information
  apiCall(method, url, requestData, responseData, duration) {
    this.debug('API Call', {
      method,
      url,
      requestData,
      responseData,
      duration,
      type: 'api_call'
    })
  }

  // Log Supabase specific errors
  supabaseError(operation, error, context = {}) {
    this.error(`Supabase Error: ${operation}`, {
      error: {
        message: error.message,
        code: error.code,
        hint: error.hint,
        details: error.details
      },
      context,
      type: 'supabase_error'
    })
  }

  // Get logs for debugging
  getLogs(filters = {}) {
    let filteredLogs = [...this.logs]

    if (filters.level) {
      filteredLogs = filteredLogs.filter(log => log.level === filters.level)
    }

    if (filters.type) {
      filteredLogs = filteredLogs.filter(log => log.data.type === filters.type)
    }

    if (filters.since) {
      const since = new Date(filters.since)
      filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= since)
    }

    if (filters.search) {
      const search = filters.search.toLowerCase()
      filteredLogs = filteredLogs.filter(log => 
        log.message.toLowerCase().includes(search) ||
        JSON.stringify(log.data).toLowerCase().includes(search)
      )
    }

    return filteredLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  }

  // Export logs for analysis
  exportLogs() {
    const logs = this.getLogs()
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = `app-logs-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Clear all logs
  clearLogs() {
    this.logs = []
    this.saveLogsToStorage()
    console.log('🗑️ All logs cleared')
  }

  // Get summary of recent errors
  getErrorSummary(hours = 24) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000)
    const errors = this.getLogs({ level: 'error', since: since.toISOString() })
    
    const summary = {
      total: errors.length,
      byType: {},
      recent: errors.slice(0, 5)
    }

    errors.forEach(error => {
      const type = error.data.type || 'unknown'
      summary.byType[type] = (summary.byType[type] || 0) + 1
    })

    return summary
  }

  // Monitor specific functions
  monitor(fn, name) {
    return async (...args) => {
      const start = performance.now()
      this.debug(`Starting ${name}`, { args })
      
      try {
        const result = await fn(...args)
        const duration = performance.now() - start
        this.performance(name, duration)
        this.debug(`Completed ${name}`, { duration, success: true })
        return result
      } catch (error) {
        const duration = performance.now() - start
        this.error(`Failed ${name}`, { duration, error: error.message, args })
        throw error
      }
    }
  }
}

// Create singleton instance
const logger = new Logger()

export default logger