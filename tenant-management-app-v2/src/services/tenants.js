import { supabase } from './supabase'

export const tenantsService = {
  async getTenants() {
    const { data, error } = await supabase
      .from('tenants')
      .select(`
        *,
        units (
          id,
          unit_number,
          properties (
            id,
            name,
            address
          )
        )
      `)
      .order('created_at', { ascending: false })
    
    return { data, error }
  },

  async getTenant(id) {
    const { data, error } = await supabase
      .from('tenants')
      .select(`
        *,
        units (
          id,
          unit_number,
          unit_type,
          rent_amount,
          properties (
            id,
            name,
            address
          )
        ),
        lease_history (
          id,
          lease_start_date,
          lease_end_date,
          rent_amount,
          move_in_date,
          move_out_date,
          status
        )
      `)
      .eq('id', id)
      .single()
    
    return { data, error }
  },

  async createTenant(tenant) {
    // Get current user's organization
    const user = (await supabase.auth.getUser()).data.user
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    const { data, error } = await supabase
      .from('tenants')
      .insert([{
        ...tenant,
        organization_id: profile.organization_id,
        created_by: user.id
      }])
      .select(`
        *,
        units (
          id,
          unit_number,
          properties (
            id,
            name
          )
        )
      `)
      .single()

    // If tenant is active and has a unit, update unit status to occupied
    if (!error && tenant.status === 'active' && tenant.unit_id) {
      await supabase
        .from('units')
        .update({ status: 'occupied' })
        .eq('id', tenant.unit_id)

      // Create lease history record
      await supabase
        .from('lease_history')
        .insert([{
          organization_id: profile.organization_id,
          tenant_id: data.id,
          unit_id: tenant.unit_id,
          lease_start_date: tenant.lease_start_date,
          lease_end_date: tenant.lease_end_date,
          rent_amount: tenant.rent_amount,
          deposit_amount: tenant.security_deposit,
          move_in_date: tenant.move_in_date,
          status: 'active'
        }])
    }
    
    return { data, error }
  },

  async updateTenant(id, updates) {
    const { data: currentTenant } = await supabase
      .from('tenants')
      .select('unit_id, status')
      .eq('id', id)
      .single()

    const { data, error } = await supabase
      .from('tenants')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        units (
          id,
          unit_number,
          properties (
            id,
            name
          )
        )
      `)
      .single()

    // Handle unit status changes
    if (!error) {
      // If tenant moved out or became inactive, update old unit status
      if (currentTenant?.unit_id && (updates.status === 'moved_out' || updates.status === 'inactive')) {
        await supabase
          .from('units')
          .update({ status: 'vacant' })
          .eq('id', currentTenant.unit_id)
      }

      // If tenant moved to new unit or became active, update new unit status
      if (updates.unit_id && updates.status === 'active') {
        await supabase
          .from('units')
          .update({ status: 'occupied' })
          .eq('id', updates.unit_id)
      }
    }
    
    return { data, error }
  },

  async deleteTenant(id) {
    // Get tenant info before deletion to update unit status
    const { data: tenant } = await supabase
      .from('tenants')
      .select('unit_id, status')
      .eq('id', id)
      .single()

    const { data, error } = await supabase
      .from('tenants')
      .delete()
      .eq('id', id)

    // If tenant was active and had a unit, mark unit as vacant
    if (!error && tenant?.unit_id && tenant.status === 'active') {
      await supabase
        .from('units')
        .update({ status: 'vacant' })
        .eq('id', tenant.unit_id)
    }
    
    return { data, error }
  },

  // Get tenants with expiring leases
  async getExpiringLeases(days = 30) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() + days)

    const { data, error } = await supabase
      .from('tenants')
      .select(`
        *,
        units (
          id,
          unit_number,
          properties (
            id,
            name
          )
        )
      `)
      .eq('status', 'active')
      .lte('lease_end_date', cutoffDate.toISOString().split('T')[0])
      .order('lease_end_date')
    
    return { data, error }
  },

  // Move tenant to different unit
  async moveTenant(tenantId, newUnitId, moveDate) {
    const { data: tenant } = await supabase
      .from('tenants')
      .select('unit_id, organization_id')
      .eq('id', tenantId)
      .single()

    if (!tenant) return { data: null, error: 'Tenant not found' }

    // Update old unit to vacant
    if (tenant.unit_id) {
      await supabase
        .from('units')
        .update({ status: 'vacant' })
        .eq('id', tenant.unit_id)
    }

    // Update new unit to occupied
    await supabase
      .from('units')
      .update({ status: 'occupied' })
      .eq('id', newUnitId)

    // Update tenant with new unit
    const { data, error } = await supabase
      .from('tenants')
      .update({
        unit_id: newUnitId,
        move_in_date: moveDate
      })
      .eq('id', tenantId)
      .select(`
        *,
        units (
          id,
          unit_number,
          properties (
            id,
            name
          )
        )
      `)
      .single()

    // Create lease history record for the move
    if (!error) {
      await supabase
        .from('lease_history')
        .insert([{
          organization_id: tenant.organization_id,
          tenant_id: tenantId,
          unit_id: newUnitId,
          lease_start_date: moveDate,
          move_in_date: moveDate,
          status: 'active'
        }])
    }

    return { data, error }
  }
}