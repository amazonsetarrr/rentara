import React from 'react';
import PaymentAnalytics from '../components/reports/PaymentAnalytics';

const ReportsPage = () => {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Reports</h1>
      <PaymentAnalytics />
    </div>
  );
};

export default ReportsPage;
