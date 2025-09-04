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

  // Get subscription duration info
  async getSubscriptionDuration() {
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return { data: null, error: 'Not authenticated' }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!profile) return { data: null, error: 'Profile not found' }

    const { data, error } = await supabase
      .from('organization_subscription_info')
      .select('*')
      .eq('id', profile.organization_id)
      .single()

    return { data, error }
  },

  // Get organization stats with subscription info
  async getOrganizationStats() {
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return { data: null, error: 'Not authenticated' }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!profile) return { data: null, error: 'Profile not found' }

    // Fetch all data to perform manual counts, avoiding potential RLS issues with .count()
    const [propertiesResult, unitsResult, tenantsResult, subscriptionResult] = await Promise.all([
      supabase
        .from('properties')
        .select('id')
        .eq('organization_id', profile.organization_id),
      supabase
        .from('units')
        .select('id, status')
        .eq('organization_id', profile.organization_id),
      supabase
        .from('tenants')
        .select('id')
        .eq('organization_id', profile.organization_id)
        .eq('status', 'active'),
      supabase
        .from('organization_subscription_info')
        .select('*')
        .eq('id', profile.organization_id)
        .single()
    ]);

    if (propertiesResult.error || unitsResult.error || tenantsResult.error) {
      console.error('Error fetching stats:',
        propertiesResult.error,
        unitsResult.error,
        tenantsResult.error
      );
      return { data: null, error: 'Failed to fetch all stats' };
    }

    const total_properties = propertiesResult.data?.length || 0;
    const units = unitsResult.data || [];
    const total_units = units.length;
    const occupied_units = units.filter(unit => unit.status === 'occupied').length;
    const active_tenants = tenantsResult.data?.length || 0;

    const stats = {
      total_properties,
      total_units,
      occupied_units,
      active_tenants,
      occupancy_rate: total_units > 0
        ? Math.round((occupied_units / total_units) * 100)
        : 0,
      subscription_info: subscriptionResult.data || null
    };

    return { data: stats, error: null }
  }
}