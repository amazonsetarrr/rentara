import { supabase } from './supabase'

export const organizationsService = {
  // Get current user's organization
  async getCurrentOrganization() {
    const { data, error } = await supabase
      .from('user_profiles')
      .select(`
        organizations (
          id,
          name,
          slug,
          subscription_status,
          subscription_plan,
          trial_ends_at,
          created_at
        )
      `)
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single()
    
    return { data: data?.organizations, error }
  },

  // Update organization
  async updateOrganization(id, updates) {
    const { data, error } = await supabase
      .from('organizations')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    return { data, error }
  },

  // Get organization users
  async getOrganizationUsers(organizationId) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, full_name, email, role, created_at')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
    
    return { data, error }
  },

  // Update user role
  async updateUserRole(userId, role) {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ role })
      .eq('id', userId)
      .select()
      .single()
    
    return { data, error }
  },

  // Get organization stats
  async getOrganizationStats() {
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return { data: null, error: 'Not authenticated' }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!profile) return { data: null, error: 'Profile not found' }

    // Get counts for properties, units, and tenants
    const [propertiesResult, unitsResult, tenantsResult] = await Promise.all([
      supabase
        .from('properties')
        .select('id', { count: 'exact' })
        .eq('organization_id', profile.organization_id),
      supabase
        .from('units')
        .select('id, status', { count: 'exact' })
        .eq('organization_id', profile.organization_id),
      supabase
        .from('tenants')
        .select('id, status', { count: 'exact' })
        .eq('organization_id', profile.organization_id)
        .eq('status', 'active')
    ])

    const stats = {
      total_properties: propertiesResult.count || 0,
      total_units: unitsResult.count || 0,
      occupied_units: unitsResult.data?.filter(unit => unit.status === 'occupied').length || 0,
      vacant_units: unitsResult.data?.filter(unit => unit.status === 'vacant').length || 0,
      maintenance_units: unitsResult.data?.filter(unit => unit.status === 'maintenance').length || 0,
      active_tenants: tenantsResult.count || 0
    }

    stats.occupancy_rate = stats.total_units > 0 
      ? Math.round((stats.occupied_units / stats.total_units) * 100) 
      : 0

    return { data: stats, error: null }
  }
}