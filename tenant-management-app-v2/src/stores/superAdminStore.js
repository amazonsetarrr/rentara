import { create } from 'zustand'
import { superAdminAuthService } from '../services/superAdminAuth'
import { supabase } from '../services/supabase'

export const useSuperAdminStore = create((set, get) => ({
  user: null,
  profile: null,
  superAdmin: null,
  loading: true,
  organizations: [],
  metrics: null,
  
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setSuperAdmin: (superAdmin) => set({ superAdmin }),
  setLoading: (loading) => set({ loading }),
  setOrganizations: (organizations) => set({ organizations }),
  setMetrics: (metrics) => set({ metrics }),
  
  checkAuth: async () => {
    try {
      set({ loading: true })
      
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        try {
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('id, email, full_name, is_super_admin, role')
            .eq('id', session.user.id)
            .single()

          if (profileError || !profile?.is_super_admin) {
            console.log('User is not a super admin or profile not found')
            set({ user: null, profile: null, superAdmin: null })
            return false
          }

          set({ 
            user: session.user, 
            profile: profile,
            superAdmin: { id: session.user.id, email: profile.email, full_name: profile.full_name }
          })
          return true
        } catch (dbError) {
          console.error('Database error during auth check:', dbError)
          set({ user: null, profile: null, superAdmin: null })
          return false
        }
      } else {
        set({ user: null, profile: null, superAdmin: null })
        return false
      }
    } catch (error) {
      console.error('Super admin auth check error:', error)
      set({ user: null, profile: null, superAdmin: null })
      return false
    } finally {
      set({ loading: false })
    }
  },

  signIn: async (email, password) => {
    const { data, error } = await superAdminAuthService.signIn(email, password)
    
    if (data) {
      set({ 
        user: data.user, 
        profile: data.profile,
        superAdmin: data.profile.super_admins?.[0] || null
      })
    }
    
    return { data, error }
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ 
      user: null, 
      profile: null, 
      superAdmin: null,
      organizations: [],
      metrics: null
    })
  },

  // Fetch all organizations for system overview
  fetchOrganizations: async () => {
    try {
      console.log('Fetching organizations...')
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Organizations fetch timeout')), 5000)
      )
      
      const fetchPromise = supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false })

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise])

      console.log('Organizations fetch result:', { data, error })

      if (error) {
        console.error('Organizations fetch error:', error)
        // If table doesn't exist, create empty array and continue
        set({ organizations: [] })
        return { data: [], error: null } // Don't propagate error to prevent hanging
      }

      set({ organizations: data || [] })
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching organizations:', error)
      set({ organizations: [] })
      return { data: [], error: null } // Don't propagate error to prevent hanging
    }
  },

  // Create new organization
  createOrganization: async (organizationData) => {
    try {
      console.log('Creating organization:', organizationData)
      
      const { data, error } = await supabase
        .from('organizations')
        .insert([{
          name: organizationData.name,
          slug: organizationData.slug,
          subscription_status: organizationData.subscription_status || 'trial',
          subscription_plan: organizationData.subscription_plan || 'starter',
          trial_ends_at: organizationData.trial_ends_at
        }])
        .select()
        .single()

      if (error) {
        console.error('Organization creation error:', error)
        throw error
      }

      console.log('Organization created successfully:', data)

      // Try to log the action (don't fail if logging fails)
      try {
        await superAdminAuthService.logAction('create_organization', data.id, {
          organization_name: data.name,
          subscription_plan: data.subscription_plan
        })
      } catch (logError) {
        console.warn('Failed to log organization creation:', logError)
      }

      // Update local state by adding to organizations array
      const currentOrgs = get().organizations
      set({ organizations: [data, ...currentOrgs] })

      return { data, error: null }
    } catch (error) {
      console.error('Error creating organization:', error)
      return { data: null, error }
    }
  },

  // Update organization
  updateOrganization: async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      // Log the action
      await superAdminAuthService.logAction('update_organization', id, {
        updates
      })

      // Refresh organizations list
      await get().fetchOrganizations()

      return { data, error: null }
    } catch (error) {
      console.error('Error updating organization:', error)
      return { data: null, error }
    }
  },

  // Delete organization
  deleteOrganization: async (id) => {
    try {
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Log the action
      await superAdminAuthService.logAction('delete_organization', id)

      // Refresh organizations list
      await get().fetchOrganizations()

      return { error: null }
    } catch (error) {
      console.error('Error deleting organization:', error)
      return { error }
    }
  },

  // Fetch system-wide metrics
  fetchSystemMetrics: async () => {
    try {
      console.log('Fetching system metrics...')

      // Add overall timeout
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Metrics fetch timeout')), 8000)
      )

      const metricsPromise = (async () => {
        // Try to get basic counts, handle errors gracefully
        let totalOrganizations = 0
        let totalUsers = 0
        let totalProperties = 0
        let totalActiveTenants = 0

        try {
          const { count: orgsCount, error: orgsError } = await supabase
            .from('organizations')
            .select('*', { count: 'exact', head: true })
          
          if (!orgsError) totalOrganizations = orgsCount || 0
          console.log('Organizations count:', totalOrganizations)
        } catch (err) {
          console.log('Could not fetch organizations count:', err.message)
        }

        try {
          const { count: usersCount, error: usersError } = await supabase
            .from('user_profiles')
            .select('*', { count: 'exact', head: true })
            .eq('is_super_admin', false)
          
          if (!usersError) totalUsers = usersCount || 0
          console.log('Users count:', totalUsers)
        } catch (err) {
          console.log('Could not fetch users count:', err.message)
        }

        try {
          const { count: propertiesCount, error: propertiesError } = await supabase
            .from('properties')
            .select('*', { count: 'exact', head: true })
          
          if (!propertiesError) totalProperties = propertiesCount || 0
          console.log('Properties count:', totalProperties)
        } catch (err) {
          console.log('Could not fetch properties count:', err.message)
        }

        try {
          const { count: tenantsCount, error: tenantsError } = await supabase
            .from('tenants')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active')
          
          if (!tenantsError) totalActiveTenants = tenantsCount || 0
          console.log('Active tenants count:', totalActiveTenants)
        } catch (err) {
          console.log('Could not fetch tenants count:', err.message)
        }

        return {
          totalOrganizations,
          totalUsers,
          totalProperties,
          totalActiveTenants,
          lastUpdated: new Date().toISOString()
        }
      })()

      const metrics = await Promise.race([metricsPromise, timeout])

      console.log('Final metrics:', metrics)
      set({ metrics })
      return { data: metrics, error: null }
    } catch (error) {
      console.error('Error fetching system metrics:', error)
      const fallbackMetrics = {
        totalOrganizations: 0,
        totalUsers: 1, // At least the super admin
        totalProperties: 0,
        totalActiveTenants: 0,
        lastUpdated: new Date().toISOString()
      }
      set({ metrics: fallbackMetrics })
      return { data: fallbackMetrics, error: null }
    }
  }
}))

// Listen for auth state changes
supabase.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_OUT') {
    useSuperAdminStore.getState().signOut()
  }
})