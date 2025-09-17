import { useState, useEffect } from 'react'
import logger from '../../services/logger'
import Card, { CardHeader, CardContent } from '../ui/Card'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import Select from '../ui/Select'
import Input from '../ui/Input'

export default function LogMonitor({ isOpen, onClose }) {
  const [logs, setLogs] = useState([])
  const [filters, setFilters] = useState({
    level: '',
    type: '',
    search: '',
    since: ''
  })
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [selectedLog, setSelectedLog] = useState(null)

  useEffect(() => {
    if (isOpen) {
      refreshLogs()
      
      if (autoRefresh) {
        const interval = setInterval(refreshLogs, 2000) // Refresh every 2 seconds
        return () => clearInterval(interval)
      }
    }
  }, [isOpen, filters, autoRefresh])

  const refreshLogs = () => {
    const filteredLogs = logger.getLogs(filters)
    setLogs(filteredLogs.slice(0, 100)) // Show latest 100 logs
  }

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }))
  }

  const getLevelColor = (level) => {
    switch (level) {
      case 'error': return 'error'
      case 'warn': return 'warning'
      case 'info': return 'info'
      case 'debug': return 'gray'
      default: return 'gray'
    }
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'user_action': return '👤'
      case 'api_request': return '🌐'
      case 'api_error': return '🚨'
      case 'db_query_start': return '🔍'
      case 'db_query_success': return '✅'
      case 'db_error': return '❌'
      case 'supabase_error': return '⚠️'
      case 'react_error': return '⚛️'
      case 'auth_state_change': return '🔐'
      case 'performance_metric': return '⚡'
      default: return '📝'
    }
  }

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  const exportLogs = () => {
    logger.exportLogs()
  }

  const clearLogs = () => {
    if (confirm('Are you sure you want to clear all logs?')) {
      logger.clearLogs()
      refreshLogs()
    }
  }

  const getErrorSummary = () => {
    return logger.getErrorSummary(24) // Last 24 hours
  }

  const getSystemStatus = () => {
    return logger.getSystemStatus()
  }

  const handleFlushToLoki = async () => {
    try {
      await logger.flushToLoki()
      alert('Logs flushed to Loki successfully!')
    } catch (error) {
      alert(`Failed to flush logs to Loki: ${error.message}`)
    }
  }

  const handleToggleLoki = () => {
    const lokiStatus = logger.getLokiStatus()
    if (lokiStatus.enabled) {
      logger.disableLoki()
    } else {
      logger.enableLoki()
    }
    refreshLogs()
  }

  if (!isOpen) return null

  const errorSummary = getErrorSummary()
  const systemStatus = getSystemStatus()

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-6xl bg-white rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b p-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                📊 Application Log Monitor
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Real-time monitoring of application logs and errors
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                {autoRefresh ? '⏸️' : '▶️'} Auto Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={exportLogs}>
                📥 Export
              </Button>
              <Button variant="outline" size="sm" onClick={clearLogs}>
                🗑️ Clear
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleFlushToLoki}
                disabled={!systemStatus.loki.enabled}
              >
                📤 Flush to Loki
              </Button>
              <Button
                variant={systemStatus.loki.enabled ? "error" : "success"}
                size="sm"
                onClick={handleToggleLoki}
              >
                {systemStatus.loki.enabled ? '🔴 Disable Loki' : '🟢 Enable Loki'}
              </Button>
              <Button variant="outline" size="sm" onClick={onClose}>
                ✕ Close
              </Button>
            </div>
          </div>

          <div className="p-6 max-h-[80vh] overflow-y-auto">
            {/* Loki Status */}
            <Card className={`mb-6 ${systemStatus.loki.enabled ? 'border-green-200 bg-green-50' : systemStatus.loki.localDevMode ? 'border-yellow-200 bg-yellow-50' : 'border-gray-200 bg-gray-50'}`}>
              <CardContent className="p-4">
                <h3 className="text-lg font-medium text-gray-800 mb-2">
                  📡 Loki Logging Status
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <Badge
                      variant={systemStatus.loki.enabled ? 'success' : systemStatus.loki.localDevMode ? 'warning' : 'gray'}
                      size="sm"
                    >
                      {systemStatus.loki.enabled ? '🟢 Enabled' : systemStatus.loki.localDevMode ? '🟡 Local Dev' : '🔴 Disabled'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Endpoint</p>
                    <p className="text-sm font-mono text-gray-800 truncate">
                      {systemStatus.loki.endpoint || 'Not configured'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Buffer Size</p>
                    <p className="text-lg font-bold text-gray-800">
                      {systemStatus.loki.bufferSize}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Environment</p>
                    <Badge variant="info" size="sm">
                      {systemStatus.loki.environment}
                    </Badge>
                  </div>
                </div>
                {systemStatus.loki.tenant && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">Tenant: <span className="font-mono">{systemStatus.loki.tenant}</span></p>
                  </div>
                )}
                {systemStatus.loki.localDevMode && (
                  <div className="mt-3 p-3 bg-yellow-100 border border-yellow-300 rounded-md">
                    <p className="text-sm text-yellow-800">
                      <strong>ℹ️ Local Development Mode:</strong> Loki transport is disabled due to CORS restrictions.
                      Logs are stored locally and will be shipped when deployed to production.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Error Summary */}
            {errorSummary.total > 0 && (
              <Card className="mb-6 border-red-200 bg-red-50">
                <CardContent className="p-4">
                  <h3 className="text-lg font-medium text-red-800 mb-2">
                    🚨 Recent Error Summary (24h)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-red-600">Total Errors</p>
                      <p className="text-2xl font-bold text-red-800">{errorSummary.total}</p>
                    </div>
                    <div>
                      <p className="text-sm text-red-600">Error Types</p>
                      <div className="space-y-1">
                        {Object.entries(errorSummary.byType).map(([type, count]) => (
                          <Badge key={type} variant="error" size="sm">
                            {type}: {count}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-red-600">Latest Error</p>
                      <p className="text-sm text-red-800">
                        {errorSummary.recent[0]?.message || 'No recent errors'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Filters */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <Select
                    label="Level"
                    value={filters.level}
                    onChange={(e) => handleFilterChange('level', e.target.value)}
                    options={[
                      { value: '', label: 'All Levels' },
                      { value: 'debug', label: 'Debug' },
                      { value: 'info', label: 'Info' },
                      { value: 'warn', label: 'Warning' },
                      { value: 'error', label: 'Error' }
                    ]}
                  />
                  
                  <Select
                    label="Type"
                    value={filters.type}
                    onChange={(e) => handleFilterChange('type', e.target.value)}
                    options={[
                      { value: '', label: 'All Types' },
                      { value: 'user_action', label: 'User Actions' },
                      { value: 'api_request', label: 'API Requests' },
                      { value: 'db_error', label: 'Database Errors' },
                      { value: 'supabase_error', label: 'Supabase Errors' },
                      { value: 'react_error', label: 'React Errors' },
                      { value: 'auth_state_change', label: 'Auth Changes' }
                    ]}
                  />
                  
                  <Input
                    label="Search"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    placeholder="Search logs..."
                  />
                  
                  <Input
                    label="Since"
                    type="datetime-local"
                    value={filters.since}
                    onChange={(e) => handleFilterChange('since', e.target.value)}
                  />
                  
                  <div className="flex items-end">
                    <Button variant="outline" onClick={refreshLogs} className="w-full">
                      🔄 Refresh
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Logs Table */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-medium">
                  Logs ({logs.length} entries)
                </h3>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left">Time</th>
                        <th className="px-4 py-2 text-left">Level</th>
                        <th className="px-4 py-2 text-left">Type</th>
                        <th className="px-4 py-2 text-left">Message</th>
                        <th className="px-4 py-2 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => (
                        <tr 
                          key={log.id} 
                          className="border-t hover:bg-gray-50 cursor-pointer"
                          onClick={() => setSelectedLog(log)}
                        >
                          <td className="px-4 py-2 text-gray-600">
                            {formatTimestamp(log.timestamp)}
                          </td>
                          <td className="px-4 py-2">
                            <Badge variant={getLevelColor(log.level)} size="sm">
                              {log.level.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="px-4 py-2">
                            <span className="flex items-center space-x-1">
                              <span>{getTypeIcon(log.data.type)}</span>
                              <span className="text-gray-600">
                                {log.data.type || 'general'}
                              </span>
                            </span>
                          </td>
                          <td className="px-4 py-2 max-w-md truncate">
                            {log.message}
                          </td>
                          <td className="px-4 py-2">
                            <Button
                              variant="text"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedLog(log)
                              }}
                            >
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {logs.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No logs found matching the current filters
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Log Detail Modal */}
          {selectedLog && (
            <div className="fixed inset-0 z-60 bg-black bg-opacity-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b p-4">
                  <h3 className="text-lg font-semibold">Log Details</h3>
                  <Button variant="text" onClick={() => setSelectedLog(null)}>
                    ✕
                  </Button>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <strong>Timestamp:</strong> {new Date(selectedLog.timestamp).toLocaleString()}
                    </div>
                    <div>
                      <strong>Level:</strong> 
                      <Badge variant={getLevelColor(selectedLog.level)} size="sm" className="ml-2">
                        {selectedLog.level.toUpperCase()}
                      </Badge>
                    </div>
                    <div>
                      <strong>Type:</strong> {selectedLog.data.type || 'general'}
                    </div>
                    <div>
                      <strong>Session:</strong> {selectedLog.sessionId}
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <strong>Message:</strong>
                    <p className="mt-1 p-2 bg-gray-100 rounded">{selectedLog.message}</p>
                  </div>
                  
                  <div className="mb-4">
                    <strong>URL:</strong>
                    <p className="mt-1 text-blue-600 break-all">{selectedLog.url}</p>
                  </div>
                  
                  <div>
                    <strong>Data:</strong>
                    <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-64">
                      {JSON.stringify(selectedLog.data, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}