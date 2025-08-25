import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAuthStore } from '../../stores/authStore'
import { supabase } from '../../services/supabase'

vi.mock('../../services/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } }
      }))
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn()
    }))
  }
}))

Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    assign: vi.fn(),
    replace: vi.fn()
  },
  writable: true
})

describe('authStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({
      user: null,
      profile: null,
      loading: true
    })
  })

  describe('checkAuth', () => {
    it('sets user and profile when session exists', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com'
      }

      const mockProfile = {
        id: 'user-123',
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'owner',
        organizations: {
          name: 'Test Org',
          subscription_plan: 'pro'
        }
      }

      supabase.auth.getSession.mockResolvedValue({
        data: { session: { user: mockUser } }
      })

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockProfile,
          error: null
        })
      }

      supabase.from.mockReturnValue(mockChain)

      await useAuthStore.getState().checkAuth()

      const state = useAuthStore.getState()
      expect(state.user).toEqual(mockUser)
      expect(state.profile).toEqual(mockProfile)
      expect(state.loading).toBe(false)
    })

    it('creates fallback profile when database query fails', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com'
      }

      supabase.auth.getSession.mockResolvedValue({
        data: { session: { user: mockUser } }
      })

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Profile not found' }
        })
      }

      supabase.from.mockReturnValue(mockChain)

      await useAuthStore.getState().checkAuth()

      const state = useAuthStore.getState()
      expect(state.user).toEqual(mockUser)
      expect(state.profile).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        full_name: 'test',
        role: 'owner',
        organizations: {
          name: 'Your Organization',
          subscription_plan: 'Trial'
        }
      })
    })

    it('clears user and profile when no session', async () => {
      supabase.auth.getSession.mockResolvedValue({
        data: { session: null }
      })

      await useAuthStore.getState().checkAuth()

      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.profile).toBeNull()
      expect(state.loading).toBe(false)
    })

    it('handles auth check errors', async () => {
      supabase.auth.getSession.mockRejectedValue(
        new Error('Network error')
      )

      await useAuthStore.getState().checkAuth()

      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.profile).toBeNull()
      expect(state.loading).toBe(false)
    })
  })

  describe('signOut', () => {
    it('clears state and redirects on successful signout', async () => {
      useAuthStore.setState({
        user: { id: 'user-123' },
        profile: { id: 'user-123', name: 'Test' },
        loading: false
      })

      supabase.auth.signOut.mockResolvedValue({ error: null })

      await useAuthStore.getState().signOut()

      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.profile).toBeNull()
      expect(state.loading).toBe(false)
      expect(supabase.auth.signOut).toHaveBeenCalled()
      expect(window.location.href).toBe('/auth')
    })

    it('clears state even on signout error', async () => {
      useAuthStore.setState({
        user: { id: 'user-123' },
        profile: { id: 'user-123' },
        loading: false
      })

      supabase.auth.signOut.mockResolvedValue({
        error: { message: 'Signout failed' }
      })

      await useAuthStore.getState().signOut()

      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.profile).toBeNull()
      expect(window.location.href).toBe('/auth')
    })

    it('handles signout network errors', async () => {
      useAuthStore.setState({
        user: { id: 'user-123' },
        profile: { id: 'user-123' }
      })

      supabase.auth.signOut.mockRejectedValue(
        new Error('Network error')
      )

      await useAuthStore.getState().signOut()

      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.profile).toBeNull()
      expect(window.location.href).toBe('/auth')
    })
  })

  describe('state setters', () => {
    it('setUser updates user state', () => {
      const user = { id: 'user-123', email: 'test@example.com' }
      
      useAuthStore.getState().setUser(user)
      
      expect(useAuthStore.getState().user).toEqual(user)
    })

    it('setProfile updates profile state', () => {
      const profile = { id: 'user-123', name: 'Test User' }
      
      useAuthStore.getState().setProfile(profile)
      
      expect(useAuthStore.getState().profile).toEqual(profile)
    })

    it('setLoading updates loading state', () => {
      useAuthStore.getState().setLoading(false)
      
      expect(useAuthStore.getState().loading).toBe(false)
    })
  })
})