import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '../utils/supabaseClient';
import { Tenant } from '../types';
import Button from '../components/Button';
import Input from '../components/Input';
import Table from '../components/Table';

const Tenants = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const { register, handleSubmit, reset } = useForm<Omit<Tenant, 'id' | 'created_at'>>();

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    const { data, error } = await supabase.from('tenants').select('*');
    if (error) {
      console.error('Error fetching tenants:', error);
    } else {
      setTenants(data || []);
    }
  };

  const addTenant = async (formData: Omit<Tenant, 'id' | 'created_at'>) => {
    const { data, error } = await supabase.from('tenants').insert([formData]);
    if (error) {
      console.error('Error adding tenant:', error);
    } else {
      if (data) {
        setTenants([...tenants, ...data]);
      }
      reset();
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold">Tenants</h1>

      <form onSubmit={handleSubmit(addTenant)} className="my-4">
        <div className="flex items-center">
          <Input {...register('name', { required: true })} placeholder="Tenant Name" />
          <Input {...register('email', { required: true })} placeholder="Email" className="ml-2" />
          <Input {...register('phone_number')} placeholder="Phone Number" className="ml-2" />
          <Button type="submit" className="ml-2">Add Tenant</Button>
        </div>
      </form>

      <Table
        headers={['Name', 'Email', 'Phone Number', 'Created At']}
        data={tenants.map((tenant) => [tenant.name, tenant.email, tenant.phone_number, new Date(tenant.created_at).toLocaleDateString()])}
      />
    </div>
  );
};

export default Tenants;