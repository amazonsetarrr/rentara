import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import SubscriptionDuration from '../../../components/ui/SubscriptionDuration'

describe('SubscriptionDuration', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should display no subscription info message when subscriptionInfo is null', () => {
    render(<SubscriptionDuration subscriptionInfo={null} />)
    expect(screen.getByText('No subscription info available')).toBeInTheDocument()
  })

  it('should display trial subscription information', () => {
    const subscriptionInfo = {
      subscription_status: 'trial',
      subscription_plan: 'starter',
      billing_cycle: 'monthly',
      ends_at: '2024-01-30T12:00:00Z',
      subscription_started_at: '2024-01-01T12:00:00Z',
      days_remaining: 15,
      progress_percentage: 50,
      is_expired: false
    }

    render(<SubscriptionDuration subscriptionInfo={subscriptionInfo} />)
    
    expect(screen.getByText('Trial Period')).toBeInTheDocument()
    expect(screen.getByText('starter Trial')).toBeInTheDocument()
    expect(screen.getByText('15 days left')).toBeInTheDocument()
  })

  it('should display active subscription information', () => {
    const subscriptionInfo = {
      subscription_status: 'active',
      subscription_plan: 'professional',
      billing_cycle: 'annual',
      ends_at: '2024-12-31T12:00:00Z',
      subscription_started_at: '2024-01-01T12:00:00Z',
      days_remaining: 350,
      progress_percentage: 4,
      is_expired: false
    }

    render(<SubscriptionDuration subscriptionInfo={subscriptionInfo} />)
    
    expect(screen.getByText('Subscription')).toBeInTheDocument()
    expect(screen.getByText('professional annual')).toBeInTheDocument()
    expect(screen.getByText('350 days left')).toBeInTheDocument()
  })

  it('should display expired subscription warning', () => {
    const subscriptionInfo = {
      subscription_status: 'active',
      subscription_plan: 'starter',
      billing_cycle: 'monthly',
      ends_at: '2024-01-10T12:00:00Z',
      subscription_started_at: '2024-01-01T12:00:00Z',
      days_remaining: -5,
      progress_percentage: 100,
      is_expired: true
    }

    render(<SubscriptionDuration subscriptionInfo={subscriptionInfo} />)
    
    expect(screen.getByText('Expired')).toBeInTheDocument()
    expect(screen.getByText('Subscription Expired: Please renew to restore full access.')).toBeInTheDocument()
  })

  it('should display near expiration warning', () => {
    const subscriptionInfo = {
      subscription_status: 'active',
      subscription_plan: 'professional',
      billing_cycle: 'monthly',
      ends_at: '2024-01-18T12:00:00Z',
      subscription_started_at: '2024-01-01T12:00:00Z',
      days_remaining: 3,
      progress_percentage: 80,
      is_expired: false
    }

    render(<SubscriptionDuration subscriptionInfo={subscriptionInfo} />)
    
    expect(screen.getByText('3 days left')).toBeInTheDocument()
    expect(screen.getByText('Renewal Reminder: Your subscription expires soon.')).toBeInTheDocument()
  })

  it('should display trial upgrade message', () => {
    const subscriptionInfo = {
      subscription_status: 'trial',
      subscription_plan: 'starter',
      billing_cycle: 'monthly',
      ends_at: '2024-01-25T12:00:00Z',
      subscription_started_at: '2024-01-01T12:00:00Z',
      days_remaining: 10,
      progress_percentage: 33,
      is_expired: false
    }

    render(<SubscriptionDuration subscriptionInfo={subscriptionInfo} />)
    
    expect(screen.getByText('Trial Period: Upgrade before expiration to continue using all features.')).toBeInTheDocument()
  })

  it('should display correct progress bar styling for different states', () => {
    const { rerender } = render(
      <SubscriptionDuration 
        subscriptionInfo={{
          subscription_status: 'trial',
          subscription_plan: 'starter',
          billing_cycle: 'monthly',
          ends_at: '2024-01-25T12:00:00Z',
          subscription_started_at: '2024-01-01T12:00:00Z',
          days_remaining: 10,
          progress_percentage: 33,
          is_expired: false
        }}
      />
    )

    // Check for trial blue styling
    const progressBar = document.querySelector('.bg-blue-500')
    expect(progressBar).toBeInTheDocument()

    // Test expired state
    rerender(
      <SubscriptionDuration 
        subscriptionInfo={{
          subscription_status: 'active',
          subscription_plan: 'starter',
          billing_cycle: 'monthly',
          ends_at: '2024-01-10T12:00:00Z',
          subscription_started_at: '2024-01-01T12:00:00Z',
          days_remaining: -5,
          progress_percentage: 100,
          is_expired: true
        }}
      />
    )

    // Check for expired red styling
    const expiredProgressBar = document.querySelector('.bg-red-500')
    expect(expiredProgressBar).toBeInTheDocument()
  })

  it('should format dates correctly', () => {
    const subscriptionInfo = {
      subscription_status: 'active',
      subscription_plan: 'professional',
      billing_cycle: 'monthly',
      ends_at: '2024-02-15T12:00:00Z',
      subscription_started_at: '2024-01-01T12:00:00Z',
      created_at: '2024-01-01T12:00:00Z',
      days_remaining: 31,
      progress_percentage: 50,
      is_expired: false
    }

    render(<SubscriptionDuration subscriptionInfo={subscriptionInfo} />)
    
    expect(screen.getByText('Started Jan 1, 2024')).toBeInTheDocument()
    expect(screen.getByText('Ends Feb 15, 2024')).toBeInTheDocument()
  })
})