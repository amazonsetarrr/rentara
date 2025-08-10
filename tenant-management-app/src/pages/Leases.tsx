import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '../utils/supabaseClient';
import { Lease, Property, Tenant } from '../types';
import Button from '../components/Button';
import Input from '../components/Input';
import Table from '../components/Table';

const Leases = () => {
  const [leases, setLeases] = useState<Lease[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [editingLease, setEditingLease] = useState<Lease | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, reset, setValue, watch } = useForm<Omit<Lease, 'id' | 'created_at'>>();

  const watchStartDate = watch('start_date');

  useEffect(() => {
    fetchLeases();
    fetchProperties();
    fetchTenants();
  }, []);

  const fetchLeases = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('leases')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching leases:', error);
      alert('Error fetching leases');
    } else {
      setLeases(data || []);
    }
    setIsLoading(false);
  };

  const fetchProperties = async () => {
    const { data, error } = await supabase.from('properties').select('*');
    if (error) {
      console.error('Error fetching properties:', error);
    } else {
      setProperties(data || []);
    }
  };

  const fetchTenants = async () => {
    const { data, error } = await supabase.from('tenants').select('*');
    if (error) {
      console.error('Error fetching tenants:', error);
    } else {
      setTenants(data || []);
    }
  };

  const addLease = async (formData: Omit<Lease, 'id' | 'created_at'>) => {
    setIsLoading(true);
    const { data, error } = await supabase.from('leases').insert([formData]).select();
    if (error) {
      console.error('Error adding lease:', error);
      alert('Error adding lease');
    } else {
      if (data) {
        setLeases([data[0], ...leases]);
        reset();
      }
    }
    setIsLoading(false);
  };

  const updateLease = async (formData: Omit<Lease, 'id' | 'created_at'>) => {
    if (!editingLease) return;
    
    setIsLoading(true);
    const { error } = await supabase
      .from('leases')
      .update(formData)
      .eq('id', editingLease.id);
    
    if (error) {
      console.error('Error updating lease:', error);
      alert('Error updating lease');
    } else {
      setLeases(leases.map(l => 
        l.id === editingLease.id 
          ? { ...l, ...formData }
          : l
      ));
      setEditingLease(null);
      reset();
    }
    setIsLoading(false);
  };

  const deleteLease = async (leaseId: number) => {
    if (!confirm('Are you sure you want to delete this lease?')) return;
    
    setIsLoading(true);
    const { error } = await supabase.from('leases').delete().eq('id', leaseId);
    if (error) {
      console.error('Error deleting lease:', error);
      alert('Error deleting lease');
    } else {
      setLeases(leases.filter(l => l.id !== leaseId));
    }
    setIsLoading(false);
  };

  const startEdit = (lease: Lease) => {
    setEditingLease(lease);
    setValue('property_id', lease.property_id);
    setValue('tenant_id', lease.tenant_id);
    setValue('start_date', lease.start_date);
    setValue('end_date', lease.end_date);
    setValue('rent_amount', lease.rent_amount);
  };

  const cancelEdit = () => {
    setEditingLease(null);
    reset();
  };

  const onSubmit = editingLease ? updateLease : addLease;

  const getPropertyName = (propertyId: number) => {
    return properties.find(p => p.id === propertyId)?.name || 'Unknown Property';
  };

  const getTenantName = (tenantId: number) => {
    return tenants.find(t => t.id === tenantId)?.name || 'Unknown Tenant';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Leases</h1>
        <div className="text-sm text-gray-600">
          Total: {leases.length} lease{leases.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">
          {editingLease ? 'Edit Lease' : 'Add New Lease'}
        </h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Property</label>
              <select 
                {...register('property_id', { required: 'Property is required' })} 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Property</option>
                {properties.map((prop) => (
                  <option key={prop.id} value={prop.id}>{prop.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tenant</label>
              <select 
                {...register('tenant_id', { required: 'Tenant is required' })} 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Tenant</option>
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rent Amount</label>
              <Input 
                {...register('rent_amount', { 
                  required: 'Rent amount is required',
                  min: { value: 0, message: 'Rent amount must be positive' }
                })} 
                type="number" 
                placeholder="0.00" 
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <Input 
                {...register('start_date', { required: 'Start date is required' })} 
                type="date" 
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <Input 
                {...register('end_date', { 
                  required: 'End date is required',
                  validate: value => {
                    if (watchStartDate && value <= watchStartDate) {
                      return 'End date must be after start date';
                    }
                    return true;
                  }
                })} 
                type="date" 
                className="w-full"
              />
            </div>
          </div>
          
          <div className="flex space-x-3">
            <Button 
              type="submit" 
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : (editingLease ? 'Update Lease' : 'Add Lease')}
            </Button>
            {editingLease && (
              <Button 
                type="button" 
                onClick={cancelEdit}
                className="bg-gray-500 hover:bg-gray-600"
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </div>

      {isLoading && leases.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-500">Loading leases...</div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <Table
            headers={['Property', 'Tenant', 'Start Date', 'End Date', 'Rent Amount', 'Created At']}
            data={leases.map((lease) => [
              getPropertyName(lease.property_id),
              getTenantName(lease.tenant_id),
              new Date(lease.start_date).toLocaleDateString(),
              new Date(lease.end_date).toLocaleDateString(),
              `$${lease.rent_amount.toFixed(2)}`,
              new Date(lease.created_at).toLocaleDateString(),
            ])}
            actions={[
              {
                label: 'Edit',
                onClick: (rowIndex) => startEdit(leases[rowIndex]),
                className: 'bg-yellow-500 hover:bg-yellow-600 text-white'
              },
              {
                label: 'Delete',
                onClick: (rowIndex) => deleteLease(leases[rowIndex].id),
                className: 'bg-red-500 hover:bg-red-600 text-white'
              }
            ]}
          />
        </div>
      )}
    </div>
  );
};

export default Leases;