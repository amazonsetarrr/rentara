import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '../utils/supabaseClient';
import { Payment, Lease } from '../types';
import Button from '../components/Button';
import Input from '../components/Input';
import Table from '../components/Table';

const Payments = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [leases, setLeases] = useState<Lease[]>([]);
  const { register, handleSubmit, reset } = useForm<Omit<Payment, 'id' | 'created_at'>>();

  useEffect(() => {
    fetchPayments();
    fetchLeases();
  }, []);

  const fetchPayments = async () => {
    const { data, error } = await supabase.from('payments').select('*');
    if (error) {
      console.error('Error fetching payments:', error);
    } else {
      setPayments(data || []);
    }
  };

  const fetchLeases = async () => {
    const { data, error } = await supabase.from('leases').select('*');
    if (error) {
      console.error('Error fetching leases:', error);
    } else {
      setLeases(data || []);
    }
  };

  const addPayment = async (formData: Omit<Payment, 'id' | 'created_at'>) => {
    const { data, error } = await supabase.from('payments').insert([formData]);
    if (error) {
      console.error('Error adding payment:', error);
    } else {
      if (data) {
        setPayments([...payments, ...data]);
      }
      reset();
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold">Payments</h1>

      <form onSubmit={handleSubmit(addPayment)} className="my-4">
        <div className="flex items-center">
          <select {...register('lease_id', { required: true })} className="mr-2">
            <option value="">Select Lease</option>
            {leases.map((lease) => (
              <option key={lease.id} value={lease.id}>{`Lease #${lease.id}`}</option>
            ))}
          </select>
          <Input {...register('payment_date', { required: true })} type="date" />
          <Input {...register('amount', { required: true })} type="number" placeholder="Amount" className="ml-2" />
          <Button type="submit" className="ml-2">Add Payment</Button>
        </div>
      </form>

      <Table
        headers={['Lease ID', 'Payment Date', 'Amount', 'Created At']}
        data={payments.map((payment) => [
          payment.lease_id,
          new Date(payment.payment_date).toLocaleDateString(),
          payment.amount,
          new Date(payment.created_at).toLocaleDateString(),
        ])}
      />
    </div>
  );
};

export default Payments;