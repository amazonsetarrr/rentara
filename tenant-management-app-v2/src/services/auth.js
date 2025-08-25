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

      // After user signup, call the database function to create org and profile
      const { data: creationData, error: creationError } = await supabase.rpc(
        'handle_new_user_with_organization',
        {
          user_id: authData.user.id,
          email: authData.user.email,
          full_name: fullName,
          organization_name: organizationName
        }
      );

      if (creationError) {
        console.error('Error creating organization and profile:', creationError);
        // Consider cleanup logic here, e.g., deleting the auth user
        throw new Error('Failed to set up your organization. Please contact support.');
      }

      console.log('Registration successful - user, org, and profile created');
        
      // Check if user needs email confirmation
      if (!authData.session) {
        return { 
          data: { 
            user: authData.user,
            ...creationData,
            needsConfirmation: true,
            message: 'Account created! Please check your email to confirm your account before signing in.'
          }, 
          error: null 
        };
      }

      return { data: { user: authData.user, ...creationData }, error: null };
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