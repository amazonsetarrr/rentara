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
      console.log('🔄 Starting auth check...')
      set({ loading: true })
      
      const { data: { session } } = await supabase.auth.getSession()
      console.log('📝 Session data:', session?.user ? 'User found' : 'No user')
      
      if (session?.user) {
        console.log('👤 Setting user:', session.user.email)
        set({ user: session.user })
        
        try {
          console.log('🔍 Querying user profile...')
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
          
          console.log('📊 Profile query result:', { profile, profileError })
          
          if (profile) {
            console.log('✅ Profile loaded successfully')
            set({ profile })
          } else {
            console.warn('⚠️ Profile not found, creating fallback:', profileError)
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
            console.log('🔄 Using fallback profile:', fallbackProfile)
            set({ profile: fallbackProfile })
          }
        } catch (error) {
          console.warn('❌ Profile query failed, using fallback:', error)
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
          console.log('🔄 Using fallback profile:', fallbackProfile)
          set({ profile: fallbackProfile })
        }
      } else {
        console.log('❌ No session found')
        set({ user: null, profile: null })
      }
    } catch (error) {
      console.error('❌ Auth check error:', error)
      set({ user: null, profile: null })
    } finally {
      console.log('✅ Auth check completed')
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