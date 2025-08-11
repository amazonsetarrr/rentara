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

      if (!authData.user) {
        console.error('No user returned from signup')
        throw new Error('Registration failed - no user created')
      }

      // Always try to create organization and profile, regardless of session
      console.log('User created:', authData.user.id, 'Session:', !!authData.session)
      
      try {
        // 2. Create organization first
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
          console.error('Organization creation failed:', orgError)
          throw orgError
        }

        // 3. Create user profile
        console.log('Creating user profile for user:', authData.user.id)
        
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .insert([{
            id: authData.user.id,
            email,
            full_name: fullName,
            organization_id: orgData.id,
            role: 'owner'
          }])
          .select()

        console.log('Profile creation result:', { profileData, profileError })
        
        if (profileError) {
          console.error('Profile creation failed:', profileError)
          throw profileError
        }

        console.log('Registration successful - user and profile created')
        
        // Check if user needs email confirmation
        if (!authData.session) {
          return { 
            data: { 
              user: authData.user, 
              organization: orgData,
              needsConfirmation: true,
              message: 'Account created! Please check your email to confirm your account before signing in.'
            }, 
            error: null 
          }
        }

        return { data: { user: authData.user, organization: orgData }, error: null }
        
      } catch (dbError) {
        console.error('Database operations failed:', dbError)
        // If profile creation fails, still return success for auth but with warning
        return { 
          data: { 
            user: authData.user,
            warning: 'Account created but profile setup incomplete. Please contact support.'
          }, 
          error: null 
        }
      }
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