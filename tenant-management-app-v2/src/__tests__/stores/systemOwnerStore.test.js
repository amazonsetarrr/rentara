import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useSystemOwnerStore } from '../../stores/systemOwnerStore'
import { signInSystemOwner } from '../../services/systemOwnerAuth'
import { supabase } from '../../services/supabase'

vi.mock('../../services/systemOwnerAuth')
vi.mock('../../services/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn()
    })),
    auth: {
      signOut: vi.fn()
    },
    rpc: vi.fn()
  }
}))

Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000/superadmin',
    assign: vi.fn(),
    replace: vi.fn()
  },
  writable: true
})

describe('systemOwnerStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useSystemOwnerStore.setState({
      user: null,
      organizations: [],
      metrics: null,
      loading: false,
      error: null
    })
  })

  describe('login', () => {
    it('successfully logs in system owner', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'admin@example.com',
        role: 'system_owner'
      }

      signInSystemOwner.mockResolvedValue({
        success: true,
        user: mockUser
      })

      await useSystemOwnerStore.getState().login('admin@example.com', 'password123')

      const state = useSystemOwnerStore.getState()
      expect(state.user).toEqual(mockUser)
      expect(state.error).toBeNull()
      expect(state.loading).toBe(false)
    })

    it('handles login failure', async () => {
      signInSystemOwner.mockResolvedValue({
        success: false,
        error: { message: 'Invalid credentials' }
      })

      await useSystemOwnerStore.getState().login('admin@example.com', 'wrong')

      const state = useSystemOwnerStore.getState()
      expect(state.user).toBeNull()
      expect(state.error).toBe('Invalid credentials')
      expect(state.loading).toBe(false)
    })

    it('handles network errors', async () => {
      signInSystemOwner.mockRejectedValue(new Error('Network error'))

      await useSystemOwnerStore.getState().login('admin@example.com', 'password123')

      const state = useSystemOwnerStore.getState()
      expect(state.error).toBe('Login failed. Please try again.')
      expect(state.loading).toBe(false)
    })
  })

  describe('fetchOrganizations', () => {
    it('successfully fetches organizations', async () => {
      const mockOrganizations = [
        {
          id: '1',
          name: 'Acme Corp',
          subscription_plan: 'pro',
          subscription_status: 'active'
        },
        {
          id: '2',
          name: 'Tech Solutions',
          subscription_plan: 'basic',
          subscription_status: 'trial'
        }
      ]

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockOrganizations,
          error: null
        })
      }

      supabase.from.mockReturnValue(mockChain)

      await useSystemOwnerStore.getState().fetchOrganizations()

      const state = useSystemOwnerStore.getState()
      expect(state.organizations).toEqual(mockOrganizations)
      expect(state.error).toBeNull()
    })

    it('handles fetch organizations error', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' }
        })
      }

      supabase.from.mockReturnValue(mockChain)

      await useSystemOwnerStore.getState().fetchOrganizations()

      const state = useSystemOwnerStore.getState()
      expect(state.error).toBe('Database error')
    })
  })

  describe('createOrganization', () => {
    it('successfully creates organization', async () => {
      const orgData = {
        name: 'New Corp',
        slug: 'new-corp',
        adminEmail: 'admin@newcorp.com',
        subscriptionPlan: 'pro'
      }

      const mockCreated = {
        id: '3',
        ...orgData,
        subscription_status: 'active'
      }

      const mockChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockCreated,
          error: null
        })
      }

      supabase.from.mockReturnValue(mockChain)

      const result = await useSystemOwnerStore.getState().createOrganization(orgData)

      expect(result).toEqual({ success: true })
      expect(mockChain.insert).toHaveBeenCalledWith({
        name: 'New Corp',
        slug: 'new-corp',
        admin_email: 'admin@newcorp.com',
        subscription_plan: 'pro',
        subscription_status: 'trial',
        trial_ends_at: expect.any(String)
      })
    })

    it('handles create organization error', async () => {
      const mockChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Organization already exists' }
        })
      }

      supabase.from.mockReturnValue(mockChain)

      const result = await useSystemOwnerStore.getState().createOrganization({
        name: 'Existing Corp'
      })

      expect(result).toEqual({
        success: false,
        error: { message: 'Organization already exists' }
      })
    })
  })

  describe('fetchMetrics', () => {
    it('successfully fetches metrics', async () => {
      const mockMetrics = {
        totalOrganizations: 25,
        activeOrganizations: 20,
        totalRevenue: 15000,
        monthlyRevenue: 2500
      }

      supabase.rpc.mockResolvedValue({
        data: mockMetrics,
        error: null
      })

      await useSystemOwnerStore.getState().fetchMetrics()

      const state = useSystemOwnerStore.getState()
      expect(state.metrics).toEqual(mockMetrics)
      expect(state.error).toBeNull()
    })

    it('handles fetch metrics error', async () => {
      supabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Metrics error' }
      })

      await useSystemOwnerStore.getState().fetchMetrics()

      const state = useSystemOwnerStore.getState()
      expect(state.error).toBe('Metrics error')
    })
  })

  describe('logout', () => {
    it('successfully logs out and redirects', async () => {
      useSystemOwnerStore.setState({
        user: { id: 'user-123' },
        organizations: [{ id: '1' }]
      })

      supabase.auth.signOut.mockResolvedValue({ error: null })

      await useSystemOwnerStore.getState().logout()

      const state = useSystemOwnerStore.getState()
      expect(state.user).toBeNull()
      expect(state.organizations).toEqual([])
      expect(state.metrics).toBeNull()
      expect(window.location.href).toBe('/superadmin/auth')
    })

    it('handles logout error', async () => {
      supabase.auth.signOut.mockResolvedValue({
        error: { message: 'Logout failed' }
      })

      await useSystemOwnerStore.getState().logout()

      const state = useSystemOwnerStore.getState()
      expect(state.user).toBeNull()
      expect(window.location.href).toBe('/superadmin/auth')
    })
  })

  describe('state management', () => {
    it('clearError clears error state', () => {
      useSystemOwnerStore.setState({ error: 'Some error' })

      useSystemOwnerStore.getState().clearError()

      expect(useSystemOwnerStore.getState().error).toBeNull()
    })

    it('setLoading updates loading state', () => {
      useSystemOwnerStore.getState().setLoading(true)

      expect(useSystemOwnerStore.getState().loading).toBe(true)
    })
  })
})