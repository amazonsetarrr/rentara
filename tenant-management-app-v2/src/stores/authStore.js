import { create } from 'zustand'
import { supabase } from '../services/supabase'

export const useAuthStore = create((set) => ({
  user: null,
  profile: null,
  loading: true,
  
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
  
  checkAuth: async () => {
    try {
      set({ loading: true })
      
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        set({ user: session.user })
        
        try {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select(`
              *,
              organizations (
                id,
                name,
                subscription_status,
                subscription_plan,
                trial_ends_at
              )
            `)
            .eq('id', session.user.id)
            .single()
          
          if (profile) {
            set({ profile })
          } else {
            // Create a fallback profile if database query fails
            const fallbackProfile = {
              id: session.user.id,
              email: session.user.email,
              full_name: session.user.email?.split('@')[0] || 'User',
              role: 'owner',
              organizations: {
                name: 'Your Organization',
                subscription_plan: 'Trial'
              }
            }
            set({ profile: fallbackProfile })
          }
        } catch {
          // Create a fallback profile if database query fails
          const fallbackProfile = {
            id: session.user.id,
            email: session.user.email,
            full_name: session.user.email?.split('@')[0] || 'User',
            role: 'owner',
            organizations: {
              name: 'Your Organization',
              subscription_plan: 'Trial'
            }
          }
          set({ profile: fallbackProfile })
        }
      } else {
        set({ user: null, profile: null })
      }
    } catch (error) {
      console.error('Auth check error:', error)
      set({ user: null, profile: null })
    } finally {
      set({ loading: false })
    }
  },

  signOut: async () => {
    try {
      console.log('Starting sign out process...')
      
      // Clear state first for immediate UI update
      set({ user: null, profile: null, loading: false })
      
      // Then sign out from Supabase
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Supabase sign out error:', error)
      }
      
      console.log('Sign out process completed')
      
      // Force redirect to auth page
      if (typeof window !== 'undefined') {
        window.location.href = '/auth'
      }
    } catch (error) {
      console.error('Sign out error:', error)
      // Clear state even if there's an error
      set({ user: null, profile: null, loading: false })
      
      // Still try to redirect
      if (typeof window !== 'undefined') {
        window.location.href = '/auth'
      }
    }
  }
}))

supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth state change:', event, !!session)
  
  if (event === 'SIGNED_OUT') {
    console.log('Auth state listener: User signed out')
    useAuthStore.getState().setUser(null)
    useAuthStore.getState().setProfile(null)
  } else if (session?.user && event === 'SIGNED_IN') {
    console.log('Auth state listener: User signed in')
    useAuthStore.getState().setUser(session.user)
  }
})