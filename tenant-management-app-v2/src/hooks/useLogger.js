// React hook for easy logging integration
import { useCallback } from 'react'
import logger from '../services/logger'

export function useLogger() {
  const logAction = useCallback((action, data = {}) => {
    logger.action(action, data)
  }, [])

  const logError = useCallback((message, error, context = {}) => {
    logger.error(message, { 
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error,
      context
    })
  }, [])

  const logWarning = useCallback((message, data = {}) => {
    logger.warn(message, data)
  }, [])

  const logInfo = useCallback((message, data = {}) => {
    logger.info(message, data)
  }, [])

  const logPerformance = useCallback((metric, value, data = {}) => {
    logger.performance(metric, value, data)
  }, [])

  const logPageView = useCallback((page, data = {}) => {
    logger.action('Page View', { page, ...data })
  }, [])

  const logFormSubmit = useCallback((form, data = {}) => {
    logger.action('Form Submit', { form, ...data })
  }, [])

  const logButtonClick = useCallback((button, data = {}) => {
    logger.action('Button Click', { button, ...data })
  }, [])

  const logModalOpen = useCallback((modal, data = {}) => {
    logger.action('Modal Open', { modal, ...data })
  }, [])

  const logModalClose = useCallback((modal, data = {}) => {
    logger.action('Modal Close', { modal, ...data })
  }, [])

  const logApiCall = useCallback((method, url, requestData, responseData, duration) => {
    logger.apiCall(method, url, requestData, responseData, duration)
  }, [])

  const wrapAsyncFunction = useCallback((fn, name) => {
    return logger.monitor(fn, name)
  }, [])

  return {
    logAction,
    logError,
    logWarning,
    logInfo,
    logPerformance,
    logPageView,
    logFormSubmit,
    logButtonClick,
    logModalOpen,
    logModalClose,
    logApiCall,
    wrapAsyncFunction
  }
}