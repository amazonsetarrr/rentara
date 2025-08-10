import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '../utils/supabaseClient';
import { Property } from '../types';
import Button from '../components/Button';
import Input from '../components/Input';
import Table from '../components/Table';
import SearchInput from '../components/SearchInput';

const Properties = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { register, handleSubmit, reset, setValue } = useForm<Omit<Property, 'id' | 'created_at'>>();

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    // Filter properties based on search term
    if (searchTerm.trim() === '') {
      setFilteredProperties(properties);
    } else {
      const filtered = properties.filter(property =>
        property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProperties(filtered);
    }
  }, [searchTerm, properties]);

  const fetchProperties = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('properties').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching properties:', error);
      alert('Error fetching properties');
    } else {
      setProperties(data || []);
    }
    setIsLoading(false);
  };

  const addProperty = async (formData: Omit<Property, 'id' | 'created_at'>) => {
    setIsLoading(true);
    const { data, error } = await supabase.from('properties').insert([formData]).select();
    if (error) {
      console.error('Error adding property:', error);
      alert('Error adding property');
    } else {
      if (data) {
        setProperties([data[0], ...properties]);
        reset();
      }
    }
    setIsLoading(false);
  };

  const updateProperty = async (formData: Omit<Property, 'id' | 'created_at'>) => {
    if (!editingProperty) return;
    
    setIsLoading(true);
    const { error } = await supabase
      .from('properties')
      .update(formData)
      .eq('id', editingProperty.id);
    
    if (error) {
      console.error('Error updating property:', error);
      alert('Error updating property');
    } else {
      setProperties(properties.map(p => 
        p.id === editingProperty.id 
          ? { ...p, ...formData }
          : p
      ));
      setEditingProperty(null);
      reset();
    }
    setIsLoading(false);
  };

  const deleteProperty = async (propertyId: number) => {
    if (!confirm('Are you sure you want to delete this property?')) return;
    
    setIsLoading(true);
    const { error } = await supabase.from('properties').delete().eq('id', propertyId);
    if (error) {
      console.error('Error deleting property:', error);
      alert('Error deleting property');
    } else {
      setProperties(properties.filter(p => p.id !== propertyId));
    }
    setIsLoading(false);
  };

  const startEdit = (property: Property) => {
    setEditingProperty(property);
    setValue('name', property.name);
    setValue('address', property.address);
  };

  const cancelEdit = () => {
    setEditingProperty(null);
    reset();
  };

  const onSubmit = editingProperty ? updateProperty : addProperty;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Properties</h1>
        <div className="text-sm text-gray-600">
          Total: {filteredProperties.length} propert{filteredProperties.length !== 1 ? 'ies' : 'y'}
          {searchTerm && filteredProperties.length !== properties.length && (
            <span className="ml-2 text-blue-600">
              (filtered from {properties.length})
            </span>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">
          {editingProperty ? 'Edit Property' : 'Add New Property'}
        </h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              {...register('name', { required: 'Property name is required' })} 
              placeholder="Property Name" 
              className="w-full"
            />
            <Input 
              {...register('address', { required: 'Address is required' })} 
              placeholder="Address" 
              className="w-full"
            />
          </div>
          <div className="flex space-x-3">
            <Button 
              type="submit" 
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : (editingProperty ? 'Update Property' : 'Add Property')}
            </Button>
            {editingProperty && (
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
          placeholder="Search properties by name or address..."
          className="max-w-md"
        />
      </div>

      {isLoading && properties.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-500">Loading properties...</div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <Table
            headers={['Name', 'Address', 'Created At']}
            data={filteredProperties.map((prop) => [
              prop.name,
              prop.address,
              new Date(prop.created_at).toLocaleDateString()
            ])}
            actions={[
              {
                label: 'Edit',
                onClick: (rowIndex) => startEdit(filteredProperties[rowIndex]),
                className: 'bg-yellow-500 hover:bg-yellow-600 text-white'
              },
              {
                label: 'Delete',
                onClick: (rowIndex) => deleteProperty(filteredProperties[rowIndex].id),
                className: 'bg-red-500 hover:bg-red-600 text-white'
              }
            ]}
          />
        </div>
      )}
    </div>
  );
};

export default Properties;