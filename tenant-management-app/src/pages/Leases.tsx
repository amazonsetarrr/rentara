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
  const { register, handleSubmit, reset } = useForm<Omit<Lease, 'id' | 'created_at'>>();

  useEffect(() => {
    fetchLeases();
    fetchProperties();
    fetchTenants();
  }, []);

  const fetchLeases = async () => {
    const { data, error } = await supabase.from('leases').select('*');
    if (error) {
      console.error('Error fetching leases:', error);
    } else {
      setLeases(data || []);
    }
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
    const { data, error } = await supabase.from('leases').insert([formData]);
    if (error) {
      console.error('Error adding lease:', error);
    } else {
      if (data) {
        setLeases([...leases, ...data]);
      }
      reset();
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold">Leases</h1>

      <form onSubmit={handleSubmit(addLease)} className="my-4">
        <div className="flex items-center">
          <select {...register('property_id', { required: true })} className="mr-2">
            <option value="">Select Property</option>
            {properties.map((prop) => (
              <option key={prop.id} value={prop.id}>{prop.name}</option>
            ))}
          </select>
          <select {...register('tenant_id', { required: true })} className="mr-2">
            <option value="">Select Tenant</option>
            {tenants.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
            ))}
          </select>
          <Input {...register('start_date', { required: true })} type="date" />
          <Input {...register('end_date', { required: true })} type="date" className="ml-2" />
          <Input {...register('rent_amount', { required: true })} type="number" placeholder="Rent Amount" className="ml-2" />
          <Button type="submit" className="ml-2">Add Lease</Button>
        </div>
      </form>

      <Table
        headers={['Property', 'Tenant', 'Start Date', 'End Date', 'Rent Amount', 'Created At']}
        data={leases.map((lease) => [
          properties.find((p) => p.id === lease.property_id)?.name || '',
          tenants.find((t) => t.id === lease.tenant_id)?.name || '',
          new Date(lease.start_date).toLocaleDateString(),
          new Date(lease.end_date).toLocaleDateString(),
          lease.rent_amount,
          new Date(lease.created_at).toLocaleDateString(),
        ])}
      />
    </div>
  );
};

export default Leases;