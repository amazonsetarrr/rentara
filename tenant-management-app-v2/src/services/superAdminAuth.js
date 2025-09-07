import { supabase } from './supabase'

export const superAdminAuthService = {
  // Sign in super admin
  async signIn(email, password) {
    try {
      console.log('Super admin sign in attempt for:', email)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('Auth sign in error:', error)
        return { data: null, error }
      }

      console.log('Auth successful, checking super admin status...')

      // Check if user_profiles table exists and user is super admin
      try {
        console.log('Checking user profile for super admin status...')
        
        // First check if the is_super_admin column exists by trying a simple query
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

        // Now try to check for super admin column - this might fail if column doesn't exist
        try {
          const { data: superAdminCheck, error: superAdminError } = await supabase
            .from('user_profiles')
            .select('is_super_admin')
            .eq('id', data.user.id)
            .single()

          console.log('Super admin check result:', { superAdminCheck, superAdminError })

          if (superAdminError || !superAdminCheck?.is_super_admin) {
            console.log('User is not a super admin or column does not exist')
            await supabase.auth.signOut()
            return { 
              data: null, 
              error: { message: 'Access denied. Super admin privileges required, or super admin schema not set up.' }
            }
          }

          console.log('Super admin verification successful')
          return { data: { user: data.user, profile: { ...profile, is_super_admin: true } }, error: null }
        } catch (superAdminError) {
          console.error('Super admin column check failed:', superAdminError)
          await supabase.auth.signOut()
          return { 
            data: null, 
            error: { message: 'Super admin authentication not configured. Please run the super admin database setup.' }
          }
        }
      } catch (dbError) {
        console.error('Database error during super admin check:', dbError)
        await supabase.auth.signOut()
        return { 
          data: null, 
          error: { message: 'Database error. Please ensure the super admin schema is set up.' }
        }
      }
    } catch (error) {
      console.error('Super admin sign in error:', error)
      return { data: null, error }
    }
  },

  // Create super admin
  async createSuperAdmin(email, password, fullName, permissions = {}) {
    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) return { data: null, error: authError }

      // 2. Create super admin profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .insert([{
          id: authData.user.id,
          email,
          full_name: fullName,
          organization_id: null, // Super admins don't belong to organizations
          role: 'super_admin',
          is_super_admin: true
        }])
        .select()
        .single()

      if (profileError) {
        await supabase.auth.admin.deleteUser(authData.user.id)
        return { data: null, error: profileError }
      }

      // 3. Create super admin record
      const { data: superAdminData, error: superAdminError } = await supabase
        .from('super_admins')
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

      if (superAdminError) {
        await supabase.auth.admin.deleteUser(authData.user.id)
        return { data: null, error: superAdminError }
      }

      return { 
        data: { 
          user: authData.user, 
          profile: profileData,
          superAdmin: superAdminData 
        }, 
        error: null 
      }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Get super admin profile
  async getSuperAdminProfile(userId) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select(`
        *,
        super_admins(*)
      `)
      .eq('id', userId)
      .eq('is_super_admin', true)
      .single()
    
    return { data, error }
  },

  // Check if user is super admin
  async isSuperAdmin(userId) {
    const { data } = await supabase
      .from('user_profiles')
      .select('is_super_admin')
      .eq('id', userId)
      .single()
    
    return data?.is_super_admin === true
  },

  // Log super admin action
  async logAction(action, organizationId = null, details = {}, ipAddress = null) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return { error: 'No authenticated user' }

      const { error } = await supabase
        .from('super_admin_audit_log')
        .insert([{
          super_admin_id: user.id,
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