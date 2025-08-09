import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Tenants from './pages/Tenants';
import Properties from './pages/Properties';
import Leases from './pages/Leases';
import Payments from './pages/Payments';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/tenants" element={<Tenants />} />
        <Route path="/properties" element={<Properties />} />
        <Route path="/leases" element={<Leases />} />
        <Route path="/payments" element={<Payments />} />
      </Routes>
    </Router>
  );
};

export default App;
