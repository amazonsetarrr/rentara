import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '../utils/supabaseClient';
import { Payment, Lease, Property, Tenant } from '../types';
import Button from '../components/Button';
import Input from '../components/Input';
import Table from '../components/Table';

const Payments = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, reset, setValue } = useForm<Omit<Payment, 'id' | 'created_at'>>();

  useEffect(() => {
    fetchPayments();
    fetchLeases();
    fetchProperties();
    fetchTenants();
  }, []);

  const fetchPayments = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching payments:', error);
      alert('Error fetching payments');
    } else {
      setPayments(data || []);
    }
    setIsLoading(false);
  };

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

  const addPayment = async (formData: Omit<Payment, 'id' | 'created_at'>) => {
    setIsLoading(true);
    const { data, error } = await supabase.from('payments').insert([formData]).select();
    if (error) {
      console.error('Error adding payment:', error);
      alert('Error adding payment');
    } else {
      if (data) {
        setPayments([data[0], ...payments]);
        reset();
      }
    }
    setIsLoading(false);
  };

  const updatePayment = async (formData: Omit<Payment, 'id' | 'created_at'>) => {
    if (!editingPayment) return;
    
    setIsLoading(true);
    const { error } = await supabase
      .from('payments')
      .update(formData)
      .eq('id', editingPayment.id);
    
    if (error) {
      console.error('Error updating payment:', error);
      alert('Error updating payment');
    } else {
      setPayments(payments.map(p => 
        p.id === editingPayment.id 
          ? { ...p, ...formData }
          : p
      ));
      setEditingPayment(null);
      reset();
    }
    setIsLoading(false);
  };

  const deletePayment = async (paymentId: number) => {
    if (!confirm('Are you sure you want to delete this payment?')) return;
    
    setIsLoading(true);
    const { error } = await supabase.from('payments').delete().eq('id', paymentId);
    if (error) {
      console.error('Error deleting payment:', error);
      alert('Error deleting payment');
    } else {
      setPayments(payments.filter(p => p.id !== paymentId));
    }
    setIsLoading(false);
  };

  const startEdit = (payment: Payment) => {
    setEditingPayment(payment);
    setValue('lease_id', payment.lease_id);
    setValue('payment_date', payment.payment_date);
    setValue('amount', payment.amount);
  };

  const cancelEdit = () => {
    setEditingPayment(null);
    reset();
  };

  const onSubmit = editingPayment ? updatePayment : addPayment;

  const getLeaseInfo = (leaseId: number) => {
    const lease = leases.find(l => l.id === leaseId);
    if (!lease) return 'Unknown Lease';
    
    const property = properties.find(p => p.id === lease.property_id);
    const tenant = tenants.find(t => t.id === lease.tenant_id);
    
    return `${property?.name || 'Unknown Property'} - ${tenant?.name || 'Unknown Tenant'}`;
  };

  const getTotalAmount = () => {
    return payments.reduce((sum, payment) => sum + payment.amount, 0);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
        <div className="text-sm text-gray-600">
          Total: {payments.length} payment{payments.length !== 1 ? 's' : ''} | 
          Amount: ${getTotalAmount().toFixed(2)}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">
          {editingPayment ? 'Edit Payment' : 'Add New Payment'}
        </h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lease</label>
              <select 
                {...register('lease_id', { required: 'Lease is required' })} 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Lease</option>
                {leases.map((lease) => {
                  const property = properties.find(p => p.id === lease.property_id);
                  const tenant = tenants.find(t => t.id === lease.tenant_id);
                  return (
                    <option key={lease.id} value={lease.id}>
                      {property?.name || 'Unknown Property'} - {tenant?.name || 'Unknown Tenant'}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
              <Input 
                {...register('payment_date', { required: 'Payment date is required' })} 
                type="date" 
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
              <Input 
                {...register('amount', { 
                  required: 'Amount is required',
                  min: { value: 0.01, message: 'Amount must be greater than 0' }
                })} 
                type="number" 
                step="0.01"
                placeholder="0.00" 
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
              {isLoading ? 'Saving...' : (editingPayment ? 'Update Payment' : 'Add Payment')}
            </Button>
            {editingPayment && (
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

      {isLoading && payments.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-500">Loading payments...</div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <Table
            headers={['Lease', 'Payment Date', 'Amount', 'Created At']}
            data={payments.map((payment) => [
              getLeaseInfo(payment.lease_id),
              new Date(payment.payment_date).toLocaleDateString(),
              `$${payment.amount.toFixed(2)}`,
              new Date(payment.created_at).toLocaleDateString(),
            ])}
            actions={[
              {
                label: 'Edit',
                onClick: (rowIndex) => startEdit(payments[rowIndex]),
                className: 'bg-yellow-500 hover:bg-yellow-600 text-white'
              },
              {
                label: 'Delete',
                onClick: (rowIndex) => deletePayment(payments[rowIndex].id),
                className: 'bg-red-500 hover:bg-red-600 text-white'
              }
            ]}
          />
        </div>
      )}
    </div>
  );
};

export default Payments;