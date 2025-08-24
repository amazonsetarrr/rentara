# 📊 Comprehensive Logging & Error Monitoring System

## 🎯 Overview

This application now includes a comprehensive logging and error monitoring system that helps you track errors, debug issues, and monitor application performance in real-time.

## 🚀 Features

### ✅ **Centralized Logging Service**
- **Real-time error tracking** - Captures all JavaScript errors, API failures, and Supabase issues
- **User action monitoring** - Tracks form submissions, button clicks, page views, modal interactions
- **Performance metrics** - Monitors API response times and function execution duration
- **Session tracking** - Groups logs by user session for easier debugging

### ✅ **Global Error Handling**
- **React Error Boundary** - Catches component errors with detailed stack traces
- **Unhandled Promise Rejections** - Captures async errors that slip through
- **Network Error Monitoring** - Tracks failed API calls and network issues
- **Supabase Error Interception** - Specific logging for database and auth errors

### ✅ **Real-time Log Monitor Dashboard**
- **Live log viewing** - See errors as they happen in real-time
- **Advanced filtering** - Filter by log level, type, time range, or search terms
- **Error summaries** - Quick overview of recent error patterns
- **Export functionality** - Download logs for detailed analysis

### ✅ **Persistent Storage**
- **LocalStorage backup** - Logs persisted across browser sessions
- **Smart cleanup** - Automatic log rotation to prevent memory issues
- **Session grouping** - Organize logs by user session for easier tracking

## 🔧 How to Use

### **1. Real-time Monitoring**

#### **Open Log Monitor Dashboard:**
- **Keyboard shortcut**: `Ctrl + Shift + L`
- **Development button**: Click the "📊 Logs" button (bottom-right corner in dev mode)

#### **Monitor Real-time Errors:**
```javascript
// The system automatically logs:
// ✅ All API calls and responses
// ✅ Form submissions and validations
// ✅ User actions (clicks, navigation)
// ✅ Authentication events
// ✅ Database query errors
// ✅ Component errors and crashes
```

### **2. Using Logger in Your Code**

#### **Import and Use the Hook:**
```javascript
import { useLogger } from '../hooks/useLogger'

function MyComponent() {
  const { 
    logAction, 
    logError, 
    logFormSubmit, 
    logButtonClick 
  } = useLogger()

  const handleSubmit = async (formData) => {
    logFormSubmit('Contact Form', { email: formData.email })
    
    try {
      await submitForm(formData)
      logAction('Form Submitted Successfully', { formType: 'contact' })
    } catch (error) {
      logError('Form Submission Failed', error, { formData })
    }
  }

  return (
    <button onClick={() => logButtonClick('Save Button')}>
      Save
    </button>
  )
}
```

#### **Direct Logger Usage:**
```javascript
import logger from '../services/logger'

// Log different levels
logger.debug('Debug information', { data })
logger.info('Info message', { context })
logger.warn('Warning message', { issue })
logger.error('Error occurred', { error, context })

// Log user actions
logger.action('Button Clicked', { buttonId: 'save-btn' })

// Log performance
logger.performance('API Call Duration', 150, { endpoint: '/api/users' })

// Log Supabase errors
logger.supabaseError('User Login', error, { email: 'user@example.com' })
```

### **3. Monitor Specific Issues**

#### **Database Connection Issues:**
```javascript
// Look for logs with type: 'supabase_error' or 'db_error'
// These will show you exactly what database queries are failing
```

#### **Authentication Problems:**
```javascript
// Look for logs with type: 'auth_state_change' or 'auth_success'
// These track login/logout events and session changes
```

#### **Payment System Errors:**
```javascript
// Look for logs with type: 'user_action' and search for 'Payment'
// This will show you Record Payment form submissions and errors
```

## 🔍 Debugging Common Issues

### **1. Supabase Connection Errors**
```javascript
// In Log Monitor, filter by:
// Level: Error
// Type: supabase_error
// 
// Look for:
// - "CORS policy" errors (check domain configuration)
// - "Row Level Security" errors (check RLS policies)
// - "relation does not exist" (missing database tables)
```

### **2. Payment Recording Issues**
```javascript
// In Log Monitor, search for: "Record Payment"
// This will show you:
// - Form validation errors
// - API call failures
// - Success confirmations
```

### **3. Authentication Issues**
```javascript
// Filter by Type: auth_state_change
// Look for failed login attempts and session problems
```

## 📈 Log Monitor Dashboard

### **Accessing the Dashboard:**
1. **Development Mode**: Click "📊 Logs" button (bottom-right)
2. **Keyboard Shortcut**: `Ctrl + Shift + L` (works anytime)

### **Dashboard Features:**
- **🔴 Error Summary**: Shows recent error counts and types
- **🔍 Advanced Filters**: Filter by level, type, time, search terms
- **📥 Export Logs**: Download logs as JSON for detailed analysis
- **🗑️ Clear Logs**: Reset log history
- **⏸️ Auto Refresh**: Toggle real-time updates

### **Filter Options:**
- **Level**: Debug, Info, Warning, Error
- **Type**: User Actions, API Requests, Database Errors, React Errors
- **Time Range**: Filter logs by date/time
- **Search**: Find specific log messages

## 🚨 Error Types Explained

| Type | Description | What to Look For |
|------|-------------|------------------|
| `supabase_error` | Database/Auth errors | Connection issues, RLS policy blocks, missing tables |
| `api_error` | HTTP request failures | Network issues, 400/500 status codes |
| `react_error` | Component crashes | JavaScript errors, rendering issues |
| `user_action` | User interactions | Form submissions, button clicks, navigation |
| `db_query_start/success` | Database operations | Query performance, success/failure rates |
| `auth_state_change` | Authentication events | Login/logout, session changes |
| `performance_metric` | Performance data | Slow API calls, function execution times |

## 🔧 Configuration

### **Environment Variables:**
```bash
# In development, all logs are shown
NODE_ENV=development

# In production, only errors and warnings
NODE_ENV=production
```

### **Logger Settings:**
```javascript
// In src/services/logger.js
logLevel: 'debug'        // 'debug', 'info', 'warn', 'error'
maxLogs: 1000           // Maximum logs to keep in memory
enableLocalStorage: true // Persist logs across sessions
enableConsole: true     // Show logs in browser console
```

## 💡 Best Practices

### **1. Use Appropriate Log Levels:**
```javascript
logger.debug()  // Development debugging
logger.info()   // General information
logger.warn()   // Potential issues
logger.error()  // Actual problems
```

### **2. Include Context:**
```javascript
// Good ✅
logger.error('Payment failed', { 
  paymentId: 'pay_123', 
  amount: 150.00, 
  error: error.message 
})

// Poor ❌
logger.error('Something went wrong')
```

### **3. Monitor Key User Flows:**
```javascript
// Track important user actions
logAction('Payment Initiated', { amount, method })
logAction('Payment Completed', { transactionId })
logAction('Payment Failed', { error, reason })
```

## 📊 Monitoring Production Issues

### **Real-time Error Tracking:**
1. Open Log Monitor (`Ctrl + Shift + L`)
2. Filter by Level: "Error"
3. Look for patterns in error types
4. Export logs for detailed analysis

### **Performance Monitoring:**
1. Filter by Type: "performance_metric"
2. Look for slow API calls (>1000ms)
3. Identify bottlenecks in user workflows

### **User Experience Issues:**
1. Filter by Type: "user_action"
2. Look for failed form submissions
3. Track navigation patterns and errors

## 🎯 Next Steps

With this logging system in place, you can now:

1. **Monitor your Supabase database errors** in real-time
2. **Track Record Payment functionality** issues step-by-step
3. **Debug authentication problems** with detailed session logs
4. **Identify performance bottlenecks** in your application
5. **Export error reports** for detailed analysis

**Open the Log Monitor now** (`Ctrl + Shift + L`) and watch your application logs in real-time! 🚀