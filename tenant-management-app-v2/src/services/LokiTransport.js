// Loki Transport for shipping logs to Grafana Loki
// Handles batching, retry logic, and Loki-specific formatting

class LokiTransport {
  constructor(options = {}) {
    this.enabled = options.enabled || import.meta.env.VITE_LOKI_ENABLED === 'true'
    this.endpoint = options.endpoint || import.meta.env.VITE_LOKI_ENDPOINT
    this.username = options.username || import.meta.env.VITE_LOKI_USERNAME
    this.password = options.password || import.meta.env.VITE_LOKI_PASSWORD
    this.tenant = options.tenant || import.meta.env.VITE_LOKI_TENANT || 'rentara'

    // Disable in local development due to CORS restrictions
    this.isLocalDev = import.meta.env.MODE === 'development' && window.location.hostname === 'localhost'
    if (this.isLocalDev && this.enabled) {
      console.warn('🟡 Loki transport disabled in local development due to CORS restrictions')
      console.warn('🟡 Logs will be stored locally and shipped when deployed to production')
      this.enabled = false
      this.localDevMode = true
    }

    // Batching configuration
    this.batchSize = options.batchSize || 10
    this.flushInterval = options.flushInterval || 5000 // 5 seconds
    this.maxRetries = options.maxRetries || 3
    this.retryDelay = options.retryDelay || 1000 // 1 second

    // Internal state
    this.logBuffer = []
    this.isFlushScheduled = false
    this.flushTimer = null

    // Labels for all logs from this app
    this.defaultLabels = {
      app: 'rentara-tenant-management',
      version: '2.0.0',
      environment: import.meta.env.MODE || 'development',
      tenant: this.tenant
    }

    // Initialize if enabled
    if (this.enabled && this.endpoint) {
      this.init()
      console.log('🚀 LokiTransport initialized', {
        endpoint: this.endpoint,
        tenant: this.tenant,
        environment: this.defaultLabels.environment
      })
    } else if (this.localDevMode) {
      console.log('🟡 LokiTransport in local development mode - logs stored locally only')
    } else if (this.enabled) {
      console.warn('⚠️ LokiTransport enabled but missing endpoint configuration')
    }
  }

  init() {
    // Set up periodic flush
    this.scheduleFlush()

    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      this.flush(true) // Force immediate flush
    })

    // Flush on visibility change (when tab becomes hidden)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.flush()
      }
    })
  }

  // Add log to buffer for batching
  push(logEntry) {
    if (!this.enabled || !this.endpoint) return

    // Convert log entry to Loki format
    const lokiLog = this.formatForLoki(logEntry)
    this.logBuffer.push(lokiLog)

    // Flush if buffer is full
    if (this.logBuffer.length >= this.batchSize) {
      this.flush()
    } else {
      this.scheduleFlush()
    }
  }

  // Format log entry for Loki API
  formatForLoki(logEntry) {
    // Loki expects nanosecond timestamps
    const timestamp = (new Date(logEntry.timestamp).getTime() * 1000000).toString()

    // Create labels for this log entry
    const labels = {
      ...this.defaultLabels,
      level: logEntry.level,
      log_type: logEntry.data.type || 'general',
      session_id: logEntry.sessionId,
      user_id: logEntry.user?.id || 'anonymous'
    }

    // Create log line with structured data
    const logLine = {
      message: logEntry.message,
      data: logEntry.data,
      url: logEntry.url,
      userAgent: logEntry.userAgent,
      user: logEntry.user,
      timestamp: logEntry.timestamp
    }

    return {
      stream: labels,
      values: [[timestamp, JSON.stringify(logLine)]]
    }
  }

  // Schedule a flush operation
  scheduleFlush() {
    if (this.isFlushScheduled) return

    this.isFlushScheduled = true
    this.flushTimer = setTimeout(() => {
      this.flush()
    }, this.flushInterval)
  }

  // Flush logs to Loki
  async flush(immediate = false) {
    if (this.logBuffer.length === 0) return

    // Clear scheduled flush
    if (this.flushTimer) {
      clearTimeout(this.flushTimer)
      this.flushTimer = null
    }
    this.isFlushScheduled = false

    // Get logs to send and clear buffer
    const logsToSend = [...this.logBuffer]
    this.logBuffer = []

    try {
      await this.sendToLoki(logsToSend, immediate)
    } catch (error) {
      console.error('Failed to send logs to Loki:', error)

      // Put logs back in buffer for retry (if not immediate)
      if (!immediate && logsToSend.length < 100) { // Prevent infinite growth
        this.logBuffer.unshift(...logsToSend)
      }
    }
  }

  // Send logs to Loki with retry logic
  async sendToLoki(logs, immediate = false) {
    if (!this.endpoint) throw new Error('Loki endpoint not configured')

    // Group logs by stream (labels) for Loki format
    const streams = this.groupLogsByStream(logs)

    const payload = {
      streams: streams
    }

    // Prepare headers
    const headers = {
      'Content-Type': 'application/json'
    }

    // Add authentication if configured
    if (this.username && this.password) {
      headers['Authorization'] = `Basic ${btoa(`${this.username}:${this.password}`)}`
    }

    // Add tenant header if configured
    if (this.tenant) {
      headers['X-Scope-OrgID'] = this.tenant
    }

    let lastError
    let retries = immediate ? 1 : this.maxRetries

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const response = await fetch(`${this.endpoint}/loki/api/v1/push`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        })

        if (!response.ok) {
          throw new Error(`Loki responded with ${response.status}: ${response.statusText}`)
        }

        console.debug(`📤 Sent ${logs.length} logs to Loki (attempt ${attempt + 1})`)
        return // Success

      } catch (error) {
        lastError = error
        console.warn(`Failed to send logs to Loki (attempt ${attempt + 1}):`, error.message)

        // Wait before retry (except on last attempt or immediate flush)
        if (attempt < retries - 1 && !immediate) {
          await this.sleep(this.retryDelay * Math.pow(2, attempt)) // Exponential backoff
        }
      }
    }

    throw lastError
  }

  // Group logs by their stream labels for Loki format
  groupLogsByStream(logs) {
    const streamMap = new Map()

    logs.forEach(log => {
      const streamKey = JSON.stringify(log.stream)

      if (!streamMap.has(streamKey)) {
        streamMap.set(streamKey, {
          stream: log.stream,
          values: []
        })
      }

      streamMap.get(streamKey).values.push(...log.values)
    })

    return Array.from(streamMap.values())
  }

  // Utility function for delays
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Get configuration status
  getStatus() {
    return {
      enabled: this.enabled,
      localDevMode: this.localDevMode || false,
      endpoint: this.endpoint,
      tenant: this.tenant,
      environment: this.defaultLabels.environment,
      bufferSize: this.logBuffer.length,
      isFlushScheduled: this.isFlushScheduled
    }
  }

  // Manual flush for debugging
  async forceFlush() {
    await this.flush(true)
  }

  // Disable transport
  disable() {
    this.enabled = false
    if (this.flushTimer) {
      clearTimeout(this.flushTimer)
      this.flushTimer = null
    }
    this.logBuffer = []
    console.log('🛑 LokiTransport disabled')
  }

  // Enable transport
  enable() {
    if (this.endpoint) {
      this.enabled = true
      this.init()
      console.log('✅ LokiTransport enabled')
    } else {
      console.error('Cannot enable LokiTransport: endpoint not configured')
    }
  }
}

export default LokiTransport