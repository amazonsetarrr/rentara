import { supabase } from './supabase'

export const unitsService = {
  async getUnits(propertyId = null) {
    let query = supabase
      .from('units')
      .select(`
        *,
        properties (
          id,
          name,
          address
        ),
        tenants (
          id,
          first_name,
          last_name,
          email,
          lease_end_date,
          status
        )
      `)
      .order('created_at', { ascending: false })

    if (propertyId) {
      query = query.eq('property_id', propertyId)
    }

    const { data, error } = await query
    return { data, error }
  },

  async getUnit(id) {
    const { data, error } = await supabase
      .from('units')
      .select(`
        *,
        properties (
          id,
          name,
          address
        ),
        tenants (
          id,
          first_name,
          last_name,
          email,
          phone,
          lease_start_date,
          lease_end_date,
          rent_amount,
          status
        )
      `)
      .eq('id', id)
      .single()
    
    return { data, error }
  },

  async getVacantUnits() {
    const { data, error } = await supabase
      .from('units')
      .select(`
        *,
        properties (
          id,
          name
        )
      `)
      .eq('status', 'vacant')
      .order('properties.name', { ascending: true })
    
    return { data, error }
  },

  async createUnit(unit) {
    // Get current user's organization
    const user = (await supabase.auth.getUser()).data.user
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    const { data, error } = await supabase
      .from('units')
      .insert([{
        ...unit,
        organization_id: profile.organization_id,
        created_by: user.id
      }])
      .select(`
        *,
        properties (
          id,
          name
        )
      `)
      .single()
    
    return { data, error }
  },

  async updateUnit(id, updates) {
    const { data, error } = await supabase
      .from('units')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        properties (
          id,
          name
        )
      `)
      .single()
    
    return { data, error }
  },

  async updateUnitStatus(id, status) {
    const { data, error } = await supabase
      .from('units')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    return { data, error }
  },

  async deleteUnit(id) {
    const { data, error } = await supabase
      .from('units')
      .delete()
      .eq('id', id)
    
    return { data, error }
  },

  // Get units for dropdown/select
  async getUnitsOptions(propertyId = null) {
    let query = supabase
      .from('units')
      .select(`
        id, 
        unit_number, 
        status,
        properties (name)
      `)
      .order('unit_number')

    if (propertyId) {
      query = query.eq('property_id', propertyId)
    }

    const { data, error } = await query
    return { data, error }
  }
}