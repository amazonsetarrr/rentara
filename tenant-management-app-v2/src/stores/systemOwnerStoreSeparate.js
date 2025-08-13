import { create } from 'zustand'
import { systemOwnerAuthService } from '../services/systemOwnerAuthSeparate'
import { supabase } from '../services/supabase'

export const useSystemOwnerStore = create((set, get) => ({
  owner: null,
  loading: true,
  organizations: [],
  metrics: null,
  
  setOwner: (owner) => set({ owner }),
  setLoading: (loading) => set({ loading }),
  setOrganizations: (organizations) => set({ organizations }),
  setMetrics: (metrics) => set({ metrics }),
  
  checkAuth: async () => {
    try {
      set({ loading: true })
      
      if (!systemOwnerAuthService.isAuthenticated()) {
        set({ owner: null })
        return false
      }

      const { data: owner, error } = await systemOwnerAuthService.verifySession()
      
      if (error || !owner) {
        set({ owner: null })
        return false
      }

      set({ owner })
      return true
    } catch (error) {
      console.error('System owner auth check error:', error)
      set({ owner: null })
      return false
    } finally {
      set({ loading: false })
    }
  },

  signIn: async (email, password) => {
    try {
      const { data, error } = await systemOwnerAuthService.signIn(email, password)
      
      if (error) {
        return { data: null, error }
      }

      set({ owner: data.owner })
      return { data, error: null }
    } catch (error) {
      console.error('Sign in error:', error)
      return { data: null, error }
    }
  },

  signOut: async () => {
    systemOwnerAuthService.signOut()
    set({ 
      owner: null, 
      organizations: [],
      metrics: null
    })
  },

  // Fetch all organizations using authenticated queries
  fetchOrganizations: async () => {
    try {
      console.log('Fetching organizations...')
      
      const result = await systemOwnerAuthService.executeWithAuth(async () => {
        const { data, error } = await supabase
          .from('organizations')
          .select('*')
          .order('created_at', { ascending: false })

        return { data, error }
      })

      console.log('Organizations fetch result:', result)

      if (result.error) {
        console.error('Organizations fetch error:', result.error)
        set({ organizations: [] })
        return { data: [], error: result.error }
      }

      set({ organizations: result.data || [] })
      return { data: result.data, error: null }
    } catch (error) {
      console.error('Error fetching organizations:', error)
      set({ organizations: [] })
      return { data: [], error }
    }
  },

  // Create new organization
  createOrganization: async (organizationData) => {
    try {
      const result = await systemOwnerAuthService.executeWithAuth(async () => {
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

        return { data, error }
      })

      if (result.error) {
        return { data: null, error: result.error }
      }

      // Log the action
      await get().logAction('create_organization', result.data.id, {
        organization_name: result.data.name,
        subscription_plan: result.data.subscription_plan
      })

      // Refresh organizations list
      await get().fetchOrganizations()

      return { data: result.data, error: null }
    } catch (error) {
      console.error('Error creating organization:', error)
      return { data: null, error }
    }
  },

  // Update organization
  updateOrganization: async (id, updates) => {
    try {
      const result = await systemOwnerAuthService.executeWithAuth(async () => {
        const { data, error } = await supabase
          .from('organizations')
          .update(updates)
          .eq('id', id)
          .select()
          .single()

        return { data, error }
      })

      if (result.error) {
        return { data: null, error: result.error }
      }

      // Log the action
      await get().logAction('update_organization', id, { updates })

      // Refresh organizations list
      await get().fetchOrganizations()

      return { data: result.data, error: null }
    } catch (error) {
      console.error('Error updating organization:', error)
      return { data: null, error }
    }
  },

  // Delete organization
  deleteOrganization: async (id) => {
    try {
      const result = await systemOwnerAuthService.executeWithAuth(async () => {
        const { error } = await supabase
          .from('organizations')
          .delete()
          .eq('id', id)

        return { error }
      })

      if (result.error) {
        return { error: result.error }
      }

      // Log the action
      await get().logAction('delete_organization', id)

      // Refresh organizations list
      await get().fetchOrganizations()

      return { error: null }
    } catch (error) {
      console.error('Error deleting organization:', error)
      return { error }
    }
  },

  // Fetch system-wide metrics with authenticated queries
  fetchSystemMetrics: async () => {
    try {
      console.log('Fetching system metrics...')

      let totalOrganizations = 0
      let totalUsers = 0
      let totalProperties = 0
      let totalActiveTenants = 0

      try {
        const result = await systemOwnerAuthService.executeWithAuth(async () => {
          // Get counts using authenticated queries
          const [orgsResult, usersResult, propertiesResult, tenantsResult] = await Promise.allSettled([
            supabase.from('organizations').select('*', { count: 'exact', head: true }),
            supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
            supabase.from('properties').select('*', { count: 'exact', head: true }),
            supabase.from('tenants').select('*', { count: 'exact', head: true }).eq('status', 'active')
          ])

          return {
            organizations: orgsResult.status === 'fulfilled' ? orgsResult.value : null,
            users: usersResult.status === 'fulfilled' ? usersResult.value : null,
            properties: propertiesResult.status === 'fulfilled' ? propertiesResult.value : null,
            tenants: tenantsResult.status === 'fulfilled' ? tenantsResult.value : null
          }
        })

        if (result.organizations && !result.organizations.error) {
          totalOrganizations = result.organizations.count || 0
        }
        if (result.users && !result.users.error) {
          totalUsers = result.users.count || 0
        }
        if (result.properties && !result.properties.error) {
          totalProperties = result.properties.count || 0
        }
        if (result.tenants && !result.tenants.error) {
          totalActiveTenants = result.tenants.count || 0
        }

        console.log('Metrics collected:', {
          totalOrganizations,
          totalUsers,
          totalProperties,
          totalActiveTenants
        })
      } catch (err) {
        console.log('Could not fetch some metrics:', err.message)
      }

      const metrics = {
        totalOrganizations,
        totalUsers,
        totalProperties,
        totalActiveTenants,
        lastUpdated: new Date().toISOString()
      }

      console.log('Final metrics:', metrics)
      set({ metrics })
      return { data: metrics, error: null }
    } catch (error) {
      console.error('Error fetching system metrics:', error)
      const fallbackMetrics = {
        totalOrganizations: 0,
        totalUsers: 0,
        totalProperties: 0,
        totalActiveTenants: 0,
        lastUpdated: new Date().toISOString()
      }
      set({ metrics: fallbackMetrics })
      return { data: fallbackMetrics, error }
    }
  },

  // Log system owner actions
  logAction: async (action, organizationId = null, details = {}) => {
    try {
      const owner = get().owner
      if (!owner) return { error: 'No authenticated owner' }

      await systemOwnerAuthService.executeWithAuth(async () => {
        const { error } = await supabase
          .from('system_auth.system_audit_log')
          .insert([{
            system_owner_id: owner.id,
            organization_id: organizationId,
            action,
            details
          }])

        return { error }
      })
    } catch (error) {
      console.error('Error logging action:', error)
    }
  }
}))

// No auth state listener needed since we use our own authentication