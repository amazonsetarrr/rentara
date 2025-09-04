/**
 * Utility functions for subscription duration calculations
 * Standardized Model: Trial=14 days, Monthly=30 days, Annual=1 year
 */

/**
 * Standard subscription durations
 */
export const SUBSCRIPTION_DURATIONS = {
  trial: 14,      // 14 days
  monthly: 30,    // 30 days  
  annual: 365     // 1 year
}

/**
 * Get standard duration for subscription type
 * @param {string} status - Subscription status ('trial' or 'active')
 * @param {string} billingCycle - Billing cycle ('monthly' or 'annual')
 * @returns {number} Duration in days
 */
export function getStandardDuration(status, billingCycle = 'monthly') {
  if (status === 'trial') {
    return SUBSCRIPTION_DURATIONS.trial
  }
  
  if (billingCycle === 'annual') {
    return SUBSCRIPTION_DURATIONS.annual
  }
  
  return SUBSCRIPTION_DURATIONS.monthly
}

/**
 * Calculate subscription duration metrics using standardized durations
 * @param {Object} subscriptionInfo - Subscription info object
 * @returns {Object} Calculated metrics
 */
export function calculateSubscriptionMetrics(subscriptionInfo) {
  if (!subscriptionInfo) return null

  const now = new Date()
  const startDate = new Date(subscriptionInfo.subscription_started_at || subscriptionInfo.created_at)
  const endDate = new Date(subscriptionInfo.ends_at)

  // Use standardized duration instead of calculated duration
  const standardDays = getStandardDuration(subscriptionInfo.subscription_status, subscriptionInfo.billing_cycle)
  
  const elapsedMs = now - startDate
  const remainingMs = endDate - now

  const elapsedDays = Math.floor(elapsedMs / (1000 * 60 * 60 * 24))
  const remainingDays = Math.ceil(remainingMs / (1000 * 60 * 60 * 24))

  const progressPercentage = standardDays > 0 ? Math.min((elapsedDays / standardDays) * 100, 100) : 0

  return {
    totalDays: standardDays,
    elapsedDays: Math.max(elapsedDays, 0),
    remainingDays: Math.max(remainingDays, 0),
    progressPercentage: Math.round(progressPercentage * 10) / 10, // Round to 1 decimal
    isExpired: now > endDate,
    isNearExpiration: remainingDays <= 7 && remainingDays > 0
  }
}

/**
 * Format time remaining in human-readable format
 * @param {Date} endDate - Subscription end date
 * @returns {string} Formatted time remaining
 */
export function formatTimeRemaining(endDate) {
  const now = new Date()
  const diff = endDate - now

  if (diff <= 0) return 'Expired'

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''}`
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`
  } else {
    return `${minutes} minute${minutes > 1 ? 's' : ''}`
  }
}

/**
 * Get subscription status color classes
 * @param {Object} subscriptionInfo - Subscription info
 * @param {boolean} isExpired - Whether subscription is expired
 * @param {boolean} isNearExpiration - Whether subscription is near expiration
 * @returns {Object} Color classes for text and background
 */
export function getSubscriptionStatusColors(subscriptionInfo, isExpired, isNearExpiration) {
  if (isExpired) {
    return {
      text: 'text-red-600',
      background: 'bg-red-100',
      progress: 'bg-red-500',
      alert: 'bg-red-50 text-red-600'
    }
  }

  if (isNearExpiration) {
    return {
      text: 'text-orange-600',
      background: 'bg-orange-100',
      progress: 'bg-orange-500',
      alert: 'bg-orange-50 text-orange-600'
    }
  }

  if (subscriptionInfo?.subscription_status === 'trial') {
    return {
      text: 'text-blue-600',
      background: 'bg-blue-100',
      progress: 'bg-blue-500',
      alert: 'bg-blue-50 text-blue-600'
    }
  }

  return {
    text: 'text-green-600',
    background: 'bg-green-100',
    progress: 'bg-green-500',
    alert: 'bg-green-50 text-green-600'
  }
}

/**
 * Get subscription renewal message
 * @param {Object} subscriptionInfo - Subscription info
 * @param {boolean} isExpired - Whether subscription is expired
 * @param {boolean} isNearExpiration - Whether subscription is near expiration
 * @returns {string|null} Renewal message or null
 */
export function getSubscriptionMessage(subscriptionInfo, isExpired, isNearExpiration) {
  if (isExpired) {
    return 'Subscription Expired: Please renew to restore full access.'
  }

  if (isNearExpiration) {
    return 'Renewal Reminder: Your subscription expires soon.'
  }

  if (subscriptionInfo?.subscription_status === 'trial') {
    return 'Trial Period: Upgrade before expiration to continue using all features.'
  }

  return null
}

/**
 * Format date for display
 * @param {string|Date} dateString - Date to format
 * @returns {string} Formatted date string
 */
export function formatSubscriptionDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}