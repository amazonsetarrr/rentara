import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { Tenant, Property, Lease, Payment } from '../types';
import Button from '../components/Button';
import Table from '../components/Table';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalTenants: 0,
    totalProperties: 0,
    totalLeases: 0,
    totalPayments: 0,
    totalRevenue: 0
  });
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [recentLeases, setRecentLeases] = useState<Lease[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    
    try {
      // Fetch all data in parallel
      const [tenantsData, propertiesData, leasesData, paymentsData] = await Promise.all([
        supabase.from('tenants').select('*'),
        supabase.from('properties').select('*'),
        supabase.from('leases').select('*'),
        supabase.from('payments').select('*').order('created_at', { ascending: false }).limit(5)
      ]);

      const tenants = tenantsData.data || [];
      const properties = propertiesData.data || [];
      const leases = leasesData.data || [];
      const payments = paymentsData.data || [];

      // Get recent leases
      const recentLeasesData = await supabase
        .from('leases')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      setTenants(tenants);
      setProperties(properties);
      setRecentLeases(recentLeasesData.data || []);
      setRecentPayments(payments);

      // Calculate stats
      const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
      
      setStats({
        totalTenants: tenants.length,
        totalProperties: properties.length,
        totalLeases: leases.length,
        totalPayments: payments.length,
        totalRevenue
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPropertyName = (propertyId: number) => {
    return properties.find(p => p.id === propertyId)?.name || 'Unknown Property';
  };

  const getTenantName = (tenantId: number) => {
    return tenants.find(t => t.id === tenantId)?.name || 'Unknown Tenant';
  };

  const StatCard = ({ title, value, subtitle, color = 'blue' }: {
    title: string;
    value: string | number;
    subtitle?: string;
    color?: string;
  }) => (
    <div className={`bg-white rounded-lg shadow p-6 border-l-4 border-${color}-500`}>
      <div className="flex items-center">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex gap-3">
          <Button onClick={() => navigate('/properties')} className="bg-green-600 hover:bg-green-700">
            Add New Unit
          </Button>
          <Button onClick={() => navigate('/tenants')} className="bg-blue-600 hover:bg-blue-700">
            Add New Tenant
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Total Tenants" 
          value={stats.totalTenants} 
          subtitle="Active tenants"
          color="blue"
        />
        <StatCard 
          title="Total Properties" 
          value={stats.totalProperties} 
          subtitle="Available units"
          color="green"
        />
        <StatCard 
          title="Active Leases" 
          value={stats.totalLeases} 
          subtitle="Current agreements"
          color="yellow"
        />
        <StatCard 
          title="Total Revenue" 
          value={`$${stats.totalRevenue.toFixed(2)}`} 
          subtitle="All time"
          color="purple"
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Payments */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Recent Payments</h2>
          {recentPayments.length > 0 ? (
            <Table
              headers={['Tenant', 'Property', 'Amount', 'Date']}
              data={recentPayments.map((payment) => {
                const lease = recentLeases.find(l => l.id === payment.lease_id);
                const propertyName = lease ? getPropertyName(lease.property_id) : 'Unknown';
                const tenantName = lease ? getTenantName(lease.tenant_id) : 'Unknown';
                return [
                  tenantName,
                  propertyName,
                  `$${payment.amount.toFixed(2)}`,
                  new Date(payment.payment_date).toLocaleDateString()
                ];
              })}
            />
          ) : (
            <p className="text-gray-500 text-center py-4">No recent payments</p>
          )}
        </div>

        {/* Recent Leases */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Recent Leases</h2>
          {recentLeases.length > 0 ? (
            <Table
              headers={['Property', 'Tenant', 'Rent', 'Start Date']}
              data={recentLeases.map((lease) => [
                getPropertyName(lease.property_id),
                getTenantName(lease.tenant_id),
                `$${lease.rent_amount.toFixed(2)}`,
                new Date(lease.start_date).toLocaleDateString()
              ])}
            />
          ) : (
            <p className="text-gray-500 text-center py-4">No recent leases</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Button 
            onClick={() => navigate('/tenants')}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Manage Tenants
          </Button>
          <Button 
            onClick={() => navigate('/properties')}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            Manage Properties
          </Button>
          <Button 
            onClick={() => navigate('/leases')}
            className="w-full bg-yellow-600 hover:bg-yellow-700"
          >
            Manage Leases
          </Button>
          <Button 
            onClick={() => navigate('/payments')}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            Manage Payments
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;