import React from 'react';
import Button from '../components/Button';
import Table from '../components/Table';

const Dashboard = () => {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button>Add New Tenant</Button>
      </div>
      <p className="mb-4">Welcome to the tenant management dashboard.</p>

      <div className="bg-white shadow rounded-lg p-4">
        <h2 className="text-xl font-bold mb-4">Recent Payments</h2>
        <Table
          headers={['Tenant', 'Property', 'Amount', 'Date']}
          data={[
            ['John Doe', '123 Main St', '$1,200', '2024-07-01'],
            ['Jane Smith', '456 Oak Ave', '$1,500', '2024-07-01'],
          ]}
        />
      </div>
    </div>
  );
};

export default Dashboard;
