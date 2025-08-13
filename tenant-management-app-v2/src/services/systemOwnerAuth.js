import { supabase } from './supabase'

export const systemOwnerAuthService = {
  // Sign in system owner
  async signIn(email, password) {
    try {
      console.log('System owner sign in attempt for:', email)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('Auth sign in error:', error)
        return { data: null, error }
      }

      console.log('Auth successful, checking system owner status...')

      // Check if user_profiles table exists and user is system owner
      try {
        console.log('Checking user profile for system owner status...')
        
        // First check if the is_system_owner column exists by trying a simple query
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('id, email, full_name, role')
          .eq('id', data.user.id)
          .single()

        console.log('Basic profile query result:', { profile, profileError })

        if (profileError) {
          console.error('Profile query error:', profileError)
          // If table doesn't exist or other DB error, provide specific error
          await supabase.auth.signOut()
          return { 
            data: null, 
            error: { message: `Database error: ${profileError.message}. Please ensure the database schema is set up correctly.` }
          }
        }

        if (!profile) {
          console.log('No profile found for user')
          await supabase.auth.signOut()
          return { 
            data: null, 
            error: { message: 'User profile not found. Please ensure you have an account in this system.' }
          }
        }

        // Now try to check for system owner column - this might fail if column doesn't exist
        try {
          const { data: systemOwnerCheck, error: systemOwnerError } = await supabase
            .from('user_profiles')
            .select('is_system_owner')
            .eq('id', data.user.id)
            .single()

          console.log('System owner check result:', { systemOwnerCheck, systemOwnerError })

          if (systemOwnerError || !systemOwnerCheck?.is_system_owner) {
            console.log('User is not a system owner or column does not exist')
            await supabase.auth.signOut()
            return { 
              data: null, 
              error: { message: 'Access denied. System owner privileges required, or system owner schema not set up.' }
            }
          }

          console.log('System owner verification successful')
          return { data: { user: data.user, profile: { ...profile, is_system_owner: true } }, error: null }
        } catch (systemOwnerError) {
          console.error('System owner column check failed:', systemOwnerError)
          await supabase.auth.signOut()
          return { 
            data: null, 
            error: { message: 'System owner authentication not configured. Please run the system owner database setup.' }
          }
        }
      } catch (dbError) {
        console.error('Database error during system owner check:', dbError)
        await supabase.auth.signOut()
        return { 
          data: null, 
          error: { message: 'Database error. Please ensure the system owner schema is set up.' }
        }
      }
    } catch (error) {
      console.error('System owner sign in error:', error)
      return { data: null, error }
    }
  },

  // Create system owner
  async createSystemOwner(email, password, fullName, permissions = {}) {
    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) return { data: null, error: authError }

      // 2. Create system owner profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .insert([{
          id: authData.user.id,
          email,
          full_name: fullName,
          organization_id: null, // System owners don't belong to organizations
          role: 'system_owner',
          is_system_owner: true
        }])
        .select()
        .single()

      if (profileError) {
        await supabase.auth.admin.deleteUser(authData.user.id)
        return { data: null, error: profileError }
      }

      // 3. Create system owner record
      const { data: systemOwnerData, error: systemOwnerError } = await supabase
        .from('system_owners')
        .insert([{
          id: authData.user.id,
          full_name: fullName,
          email,
          permissions: {
            manage_organizations: true,
            view_analytics: true,
            manage_billing: true,
            ...permissions
          }
        }])
        .select()
        .single()

      if (systemOwnerError) {
        await supabase.auth.admin.deleteUser(authData.user.id)
        return { data: null, error: systemOwnerError }
      }

      return { 
        data: { 
          user: authData.user, 
          profile: profileData,
          systemOwner: systemOwnerData 
        }, 
        error: null 
      }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Get system owner profile
  async getSystemOwnerProfile(userId) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select(`
        *,
        system_owners(*)
      `)
      .eq('id', userId)
      .eq('is_system_owner', true)
      .single()
    
    return { data, error }
  },

  // Check if user is system owner
  async isSystemOwner(userId) {
    const { data } = await supabase
      .from('user_profiles')
      .select('is_system_owner')
      .eq('id', userId)
      .single()
    
    return data?.is_system_owner === true
  },

  // Log system owner action
  async logAction(action, organizationId = null, details = {}, ipAddress = null) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return { error: 'No authenticated user' }

      const { error } = await supabase
        .from('system_audit_log')
        .insert([{
          system_owner_id: user.id,
          organization_id: organizationId,
          action,
          details,
          ip_address: ipAddress
        }])

      return { error }
    } catch (error) {
      return { error }
    }
  }
}