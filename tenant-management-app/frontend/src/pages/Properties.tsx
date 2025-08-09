import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '../utils/supabaseClient';
import { Property } from '../types';
import Button from '../components/Button';
import Input from '../components/Input';
import Table from '../components/Table';

const Properties = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const { register, handleSubmit, reset } = useForm<Omit<Property, 'id' | 'created_at'>>();

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    const { data, error } = await supabase.from('properties').select('*');
    if (error) {
      console.error('Error fetching properties:', error);
    } else {
      setProperties(data || []);
    }
  };

  const addProperty = async (formData: Omit<Property, 'id' | 'created_at'>) => {
    const { data, error } = await supabase.from('properties').insert([formData]);
    if (error) {
      console.error('Error adding property:', error);
    } else {
      if (data) {
        setProperties([...properties, ...data]);
      }
      reset();
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold">Properties</h1>

      <form onSubmit={handleSubmit(addProperty)} className="my-4">
        <div className="flex items-center">
          <Input {...register('name', { required: true })} placeholder="Property Name" />
          <Input {...register('address', { required: true })} placeholder="Address" className="ml-2" />
          <Button type="submit" className="ml-2">Add Property</Button>
        </div>
      </form>

      <Table
        headers={['Name', 'Address', 'Created At']}
        data={properties.map((prop) => [prop.name, prop.address, new Date(prop.created_at).toLocaleDateString()])}
      />
    </div>
  );
};

export default Properties;