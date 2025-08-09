import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="bg-gray-800 p-4">
      <ul className="flex space-x-4">
        <li>
          <Link to="/" className="text-white">Dashboard</Link>
        </li>
        <li>
          <Link to="/properties" className="text-white">Properties</Link>
        </li>
        <li>
          <Link to="/tenants" className="text-white">Tenants</Link>
        </li>
        <li>
          <Link to="/leases" className="text-white">Leases</Link>
        </li>
        <li>
          <Link to="/payments" className="text-white">Payments</Link>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
