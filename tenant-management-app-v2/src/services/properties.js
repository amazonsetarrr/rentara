import { supabase } from './supabase'

export const propertiesService = {
  async getProperties() {
    const { data, error } = await supabase
      .from('properties')
      .select(`
        *,
        units (
          id,
          status
        )
      `)
      .order('created_at', { ascending: false })
    
    // Calculate occupancy stats
    const propertiesWithStats = data?.map(property => ({
      ...property,
      total_units: property.units?.length || 0,
      occupied_units: property.units?.filter(unit => unit.status === 'occupied').length || 0,
      vacant_units: property.units?.filter(unit => unit.status === 'vacant').length || 0,
      occupancy_rate: property.units?.length > 0 
        ? Math.round((property.units.filter(unit => unit.status === 'occupied').length / property.units.length) * 100)
        : 0
    })) || []

    return { data: propertiesWithStats, error }
  },

  async getProperty(id) {
    const { data, error } = await supabase
      .from('properties')
      .select(`
        *,
        units (
          id,
          unit_number,
          unit_type,
          rent_amount,
          status,
          tenants (
            id,
            first_name,
            last_name,
            lease_end_date
          )
        )
      `)
      .eq('id', id)
      .single()
    
    return { data, error }
  },

  async createProperty(property) {
    // Get current user's organization
    const user = (await supabase.auth.getUser()).data.user
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    const { data, error } = await supabase
      .from('properties')
      .insert([{
        ...property,
        organization_id: profile.organization_id,
        created_by: user.id
      }])
      .select()
      .single()
    
    return { data, error }
  },

  async updateProperty(id, updates) {
    const { data, error } = await supabase
      .from('properties')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    return { data, error }
  },

  async deleteProperty(id) {
    const { data, error } = await supabase
      .from('properties')
      .delete()
      .eq('id', id)
    
    return { data, error }
  },

  // Get properties for dropdown/select
  async getPropertiesOptions() {
    const { data, error } = await supabase
      .from('properties')
      .select('id, name')
      .order('name')
    
    return { data, error }
  }
}