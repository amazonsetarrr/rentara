import { supabase } from './supabase'

export const authService = {
  // Sign up with organization creation
  async signUpWithOrganization(email, password, fullName, organizationName) {
    try {
      console.log('Starting registration for:', email)
      
      // 1. Sign up user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })
      
      console.log('Auth signup result:', { authData, authError })
      
      if (authError) {
        console.error('Auth error:', authError)
        throw authError
      }

      // Check if user was created but needs confirmation
      if (authData.user && !authData.session) {
        console.log('User created but needs email confirmation')
        return { 
          data: { 
            user: authData.user, 
            needsConfirmation: true,
            message: 'Please check your email to confirm your account before signing in.'
          }, 
          error: null 
        }
      }

      if (!authData.user) {
        console.error('No user returned from signup')
        throw new Error('Registration failed - no user created')
      }

      // If we have a session, try to create organization and profile
      // Note: This may fail due to RLS policies, but we'll handle it gracefully
      try {
        // 2. Create organization
        const orgSlug = organizationName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        console.log('Creating organization:', { name: organizationName, slug: orgSlug })
        
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

        console.log('Organization creation result:', { orgData, orgError })
        
        if (orgError) {
          console.error('Organization error:', orgError)
          // Don't throw here - the user was created successfully
          console.warn('Could not create organization immediately, user can do this later')
        }

        // 3. Create user profile
        if (orgData) {
          console.log('Creating user profile for user:', authData.user.id)
          
          const { error: profileError } = await supabase
            .from('user_profiles')
            .insert([{
              id: authData.user.id,
              email,
              full_name: fullName,
              organization_id: orgData.id,
              role: 'owner'
            }])

          console.log('Profile creation result:', { profileError })
          
          if (profileError) {
            console.error('Profile error:', profileError)
            console.warn('Could not create user profile immediately, user can do this later')
          }
        }
      } catch (dbError) {
        console.warn('Database operations failed, but user was created:', dbError)
      }

      console.log('Registration successful')
      return { data: { user: authData.user }, error: null }
    } catch (error) {
      console.error('Registration failed:', error)
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