import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '../utils/supabaseClient';
import { Tenant } from '../types';
import Button from '../components/Button';
import Input from '../components/Input';
import Table from '../components/Table';
import SearchInput from '../components/SearchInput';

const Tenants = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [filteredTenants, setFilteredTenants] = useState<Tenant[]>([]);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { register, handleSubmit, reset, setValue } = useForm<Omit<Tenant, 'id' | 'created_at'>>();

  useEffect(() => {
    fetchTenants();
  }, []);

  useEffect(() => {
    // Filter tenants based on search term
    if (searchTerm.trim() === '') {
      setFilteredTenants(tenants);
    } else {
      const filtered = tenants.filter(tenant =>
        tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tenant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tenant.phone_number && tenant.phone_number.includes(searchTerm))
      );
      setFilteredTenants(filtered);
    }
  }, [searchTerm, tenants]);

  const fetchTenants = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('tenants').select('*').order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching tenants:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
        // Show more specific error messages
        if (error.code === '42P01') {
          alert('Database table "tenants" does not exist. Please set up the database first.');
        } else if (error.message.includes('relation') && error.message.includes('does not exist')) {
          alert('Database tables not found. Please run the database setup first.');
        } else {
          alert(`Error fetching tenants: ${error.message}`);
        }
        setTenants([]);
      } else {
        console.log('Tenants fetched successfully:', data);
        setTenants(data || []);
      }
    } catch (err) {
      console.error('Unexpected error fetching tenants:', err);
      alert('An unexpected error occurred while fetching tenants. Check console for details.');
      setTenants([]);
    }
    setIsLoading(false);
  };

  const addTenant = async (formData: Omit<Tenant, 'id' | 'created_at'>) => {
    setIsLoading(true);
    console.log('Attempting to add tenant:', formData);
    
    try {
      const { data, error } = await supabase.from('tenants').insert([formData]).select();
      
      if (error) {
        console.error('Error adding tenant:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
        // Show more specific error messages
        if (error.code === '42P01') {
          alert('Database table "tenants" does not exist. Please set up the database first.');
        } else if (error.message.includes('relation') && error.message.includes('does not exist')) {
          alert('Database tables not found. Please run the database setup first.');
        } else {
          alert(`Error adding tenant: ${error.message}`);
        }
      } else {
        console.log('Tenant added successfully:', data);
        if (data && data.length > 0) {
          setTenants([data[0], ...tenants]);
          reset();
          alert('Tenant added successfully!');
        }
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      alert('An unexpected error occurred. Check console for details.');
    }
    
    setIsLoading(false);
  };

  const updateTenant = async (formData: Omit<Tenant, 'id' | 'created_at'>) => {
    if (!editingTenant) return;

    setIsLoading(true);
    const { data, error } = await supabase
      .from('tenants')
      .update(formData)
      .eq('id', editingTenant.id)
      .select();

    if (error) {
      console.error('Error updating tenant:', error);
      alert(`Error updating tenant: ${error.message}`);
    } else {
      if (data && data.length > 0) {
        setTenants(tenants.map(t => (t.id === data[0].id ? data[0] : t)));
        alert('Tenant updated successfully!');
      }
      setEditingTenant(null);
      reset();
    }
    setIsLoading(false);
  };

  const deleteTenant = async (tenantId: number) => {
    if (!confirm('Are you sure you want to delete this tenant?')) return;
    
    setIsLoading(true);
    const { error } = await supabase.from('tenants').delete().eq('id', tenantId);
    if (error) {
      console.error('Error deleting tenant:', error);
      alert('Error deleting tenant');
    } else {
      setTenants(tenants.filter(t => t.id !== tenantId));
    }
    setIsLoading(false);
  };

  const startEdit = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setValue('name', tenant.name);
    setValue('email', tenant.email);
    setValue('phone_number', tenant.phone_number);
  };

  const cancelEdit = () => {
    setEditingTenant(null);
    reset();
  };

  const onSubmit = editingTenant ? updateTenant : addTenant;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Tenants</h1>
        <div className="text-sm text-gray-600">
          Total: {filteredTenants.length} tenant{filteredTenants.length !== 1 ? 's' : ''}
          {searchTerm && filteredTenants.length !== tenants.length && (
            <span className="ml-2 text-blue-600">
              (filtered from {tenants.length})
            </span>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">
          {editingTenant ? 'Edit Tenant' : 'Add New Tenant'}
        </h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input 
              {...register('name', { required: 'Name is required' })} 
              placeholder="Tenant Name" 
              className="w-full"
            />
            <Input 
              {...register('email', { 
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })} 
              placeholder="Email" 
              className="w-full"
            />
            <Input 
              {...register('phone_number')} 
              placeholder="Phone Number" 
              className="w-full"
            />
          </div>
          <div className="flex space-x-3">
            <Button 
              type="submit" 
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : (editingTenant ? 'Update Tenant' : 'Add Tenant')}
            </Button>
            {editingTenant && (
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

      {/* Search Bar */}
      <div className="mb-4">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search tenants by name, email, or phone..."
          className="max-w-md"
        />
      </div>

      {isLoading && tenants.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-500">Loading tenants...</div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <Table
            headers={['Name', 'Email', 'Phone Number', 'Created At']}
            data={filteredTenants.map((tenant) => [
              tenant.name,
              tenant.email,
              tenant.phone_number || '-',
              new Date(tenant.created_at).toLocaleDateString()
            ])}
            actions={[
              {
                label: 'Edit',
                onClick: (rowIndex) => startEdit(filteredTenants[rowIndex]),
                className: 'bg-yellow-500 hover:bg-yellow-600 text-white'
              },
              {
                label: 'Delete',
                onClick: (rowIndex) => deleteTenant(filteredTenants[rowIndex].id),
                className: 'bg-red-500 hover:bg-red-600 text-white'
              }
            ]}
          />
        </div>
      )}
    </div>
  );
};

export default Tenants;