import React, { useState, useEffect, useCallback } from 'react';
import { paymentsService } from '../../services/payments';
import Spinner from '../ui/Spinner';
import Card from '../ui/Card';
import Table from '../ui/Table';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { formatCurrency } from '../../utils/currency';

const AnalyticsCard = ({ title, value, format = true }) => (
  <Card>
    <div className="p-4">
      <h3 className="text-lg font-semibold text-gray-600">{title}</h3>
      <p className="text-3xl font-bold text-gray-900">
        {format ? formatCurrency(value) : value}
      </p>
    </div>
  </Card>
);

const PaymentAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    from_date: '',
    to_date: '',
  });

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await paymentsService.getPaymentAnalytics(filters);
      if (error) {
        throw error;
      }
      setAnalyticsData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchAnalytics();
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Spinner /></div>;
  }

  if (error) {
    return <div className="text-red-500 text-center">Error: {error}</div>;
  }

  if (!analyticsData) {
    return <div className="text-center">No analytics data found.</div>;
  }

  const {
    totalDue,
    totalPaid,
    totalOverdue,
    totalPending,
    totalPartial,
    paymentsByStatus,
    paymentsByType,
  } = analyticsData;

  const statusColumns = [
    { header: 'Status', accessor: 'status' },
    { header: 'Count', accessor: 'count' },
    { header: 'Amount', accessor: 'amount', isCurrency: true },
  ];

  const typeColumns = [
    { header: 'Payment Type', accessor: 'type' },
    { header: 'Count', accessor: 'count' },
    { header: 'Amount', accessor: 'amount', isCurrency: true },
  ];

  const statusData = Object.entries(paymentsByStatus).map(([status, { count, amount }]) => ({
    status,
    count,
    amount,
  }));

  const typeData = Object.entries(paymentsByType).map(([type, { count, amount }]) => ({
    type,
    count,
    amount,
  }));

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Payment Analytics</h2>

      <form onSubmit={handleFilterSubmit} className="mb-6 bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="From Date"
            type="date"
            name="from_date"
            value={filters.from_date}
            onChange={handleFilterChange}
          />
          <Input
            label="To Date"
            type="date"
            name="to_date"
            value={filters.to_date}
            onChange={handleFilterChange}
          />
          <div className="flex items-end">
            <Button type="submit" className="w-full">Filter</Button>
          </div>
        </div>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <AnalyticsCard title="Total Due" value={totalDue} />
        <AnalyticsCard title="Total Paid" value={totalPaid} />
        <AnalyticsCard title="Total Overdue" value={totalOverdue} />
        <AnalyticsCard title="Pending" value={totalPending} />
        <AnalyticsCard title="Partial" value={totalPartial} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <div className="p-4">
            <h3 className="text-xl font-bold mb-4">By Status</h3>
            <Table columns={statusColumns} data={statusData} />
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <h3 className="text-xl font-bold mb-4">By Type</h3>
            <Table columns={typeColumns} data={typeData} />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PaymentAnalytics;
