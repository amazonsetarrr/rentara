import { supabase } from './supabase'

export const authService = {
  // Sign up with organization creation
  async signUpWithOrganization(email, password, fullName, organizationName) {
    try {
      // 1. Sign up user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })
      
      if (authError) throw authError

      // 2. Create organization
      const orgSlug = organizationName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert([{
          name: organizationName,
          slug: orgSlug,
          subscription_status: 'trial',
          trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days
        }])
        .select()
        .single()

      if (orgError) throw orgError

      // 3. Create user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert([{
          id: authData.user.id,
          email,
          full_name: fullName,
          organization_id: orgData.id,
          role: 'owner'
        }])

      if (profileError) throw profileError

      return { data: { user: authData.user, organization: orgData }, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Sign in
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // Get current session
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession()
    return { session, error }
  },

  // Get user profile with organization
  async getUserProfile(userId) {
    const { data, error } = await supabase
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
      .eq('id', userId)
      .single()
    
    return { data, error }
  },

  // Join organization with invite code
  async joinOrganization(email, password, fullName, organizationId) {
    try {
      // 1. Sign up user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })
      
      if (authError) throw authError

      // 2. Create user profile with organization
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert([{
          id: authData.user.id,
          email,
          full_name: fullName,
          organization_id: organizationId,
          role: 'member'
        }])

      if (profileError) throw profileError

      return { data: authData, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }
}