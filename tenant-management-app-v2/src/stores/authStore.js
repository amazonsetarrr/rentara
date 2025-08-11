import { create } from 'zustand'
import { supabase } from '../services/supabase'

export const useAuthStore = create((set, get) => ({
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
          const { data: profile, error: profileError } = await supabase
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
        } catch (error) {
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
    await supabase.auth.signOut()
    set({ user: null, profile: null })
  }
}))

supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT') {
    useAuthStore.getState().setUser(null)
    useAuthStore.getState().setProfile(null)
  } else if (session?.user) {
    useAuthStore.getState().setUser(session.user)
  }
})