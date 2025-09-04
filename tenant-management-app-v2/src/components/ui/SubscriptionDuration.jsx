import { useState, useEffect } from 'react'
import { getStandardDuration, SUBSCRIPTION_DURATIONS } from '../../utils/subscriptionUtils'

/**
 * SubscriptionDuration Component
 * 
 * Displays subscription duration information using standardized model:
 * - Trial: 14 days
 * - Monthly: 30 days  
 * - Annual: 1 year (365 days)
 * 
 * All subscription plans include the same feature set.
 */
function SubscriptionDuration({ subscriptionInfo }) {
  const [timeRemaining, setTimeRemaining] = useState('')

  useEffect(() => {
    if (!subscriptionInfo?.ends_at) return

    const updateTimeRemaining = () => {
      const now = new Date()
      const endDate = new Date(subscriptionInfo.ends_at)
      const diff = endDate - now

      if (diff <= 0) {
        setTimeRemaining('Expired')
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

      if (days > 0) {
        setTimeRemaining(`${days} day${days > 1 ? 's' : ''}`)
      } else if (hours > 0) {
        setTimeRemaining(`${hours} hour${hours > 1 ? 's' : ''}`)
      } else {
        setTimeRemaining(`${minutes} minute${minutes > 1 ? 's' : ''}`)
      }
    }

    updateTimeRemaining()
    const interval = setInterval(updateTimeRemaining, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [subscriptionInfo?.ends_at])

  if (!subscriptionInfo) {
    return (
      <div className="text-sm text-gray-500">
        No subscription info available
      </div>
    )
  }

  const {
    subscription_status,
    subscription_plan,
    billing_cycle,
    days_remaining,
    progress_percentage,
    is_expired
  } = subscriptionInfo

  const getStatusColor = () => {
    if (is_expired) return 'text-red-600 bg-red-100'
    if (days_remaining <= 7) return 'text-orange-600 bg-orange-100'
    if (subscription_status === 'trial') return 'text-blue-600 bg-blue-100'
    return 'text-green-600 bg-green-100'
  }

  const getProgressBarColor = () => {
    if (is_expired) return 'bg-red-500'
    if (days_remaining <= 7) return 'bg-orange-500'
    if (subscription_status === 'trial') return 'bg-blue-500'
    return 'bg-green-500'
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">
            {subscription_status === 'trial' ? 'Trial Period' : 'Subscription'}
          </p>
          <div className="flex items-center space-x-2">
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor()}`}>
              {subscription_plan} {subscription_status === 'trial' ? 'Trial' : billing_cycle}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900">
            {is_expired ? 'Expired' : `${days_remaining} days left`}
          </p>
          <p className="text-xs text-gray-500">
            {timeRemaining}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor()}`}
            style={{ width: `${Math.min(progress_percentage || 0, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>Started {formatDate(subscriptionInfo.subscription_started_at || subscriptionInfo.created_at)}</span>
          <span>Ends {formatDate(subscriptionInfo.ends_at)}</span>
        </div>
      </div>

      {/* Additional Info */}
      {subscription_status === 'trial' && (
        <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded-md">
          <p>
            <strong>14-Day Trial:</strong> Upgrade before expiration to continue using all features.
            All plans include the same feature set.
          </p>
        </div>
      )}

      {is_expired && (
        <div className="text-xs text-red-600 bg-red-50 p-2 rounded-md">
          <p>
            <strong>Subscription Expired:</strong> Please renew to restore full access.
          </p>
        </div>
      )}

      {days_remaining <= 7 && days_remaining > 0 && !is_expired && (
        <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded-md">
          <p>
            <strong>Renewal Reminder:</strong> Your subscription expires soon.
          </p>
        </div>
      )}
    </div>
  )
}

export default SubscriptionDuration