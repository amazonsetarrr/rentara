Multi-Tenant Property Management SaaS - Development Guide
Project Overview
Build a true multi-tenant SaaS Property Management System with user authentication, organization-based data separation, and subscription-ready architecture.
Tech Stack

Frontend: React + Tailwind CSS
Backend: Supabase (PostgreSQL + Auth + RLS + Real-time)
Deployment: Vercel
State Management: Zustand
Authentication: Supabase Auth

Project Structure
property-management-saas/
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Spinner.jsx
│   │   │   └── Toast.jsx
│   │   ├── auth/
│   │   │   ├── LoginForm.jsx
│   │   │   ├── SignupForm.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── AuthLayout.jsx
│   │   ├── layout/
│   │   │   ├── Header.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Layout.jsx
│   │   │   └── UserMenu.jsx
│   │   ├── forms/
│   │   │   ├── AddUnitForm.jsx
│   │   │   ├── AddTenantForm.jsx
│   │   │   ├── AddPropertyForm.jsx
│   │   │   └── OrganizationForm.jsx
│   │   ├── dashboard/
│   │   │   ├── DashboardStats.jsx
│   │   │   ├── UnitsTable.jsx
│   │   │   ├── TenantsTable.jsx
│   │   │   ├── PropertiesTable.jsx
│   │   │   ├── ExpiringLeases.jsx
│   │   │   └── ActivityFeed.jsx
│   │   └── reports/
│   │       ├── OccupancyReport.jsx
│   │       ├── RentRollReport.jsx
│   │       └── ExportButton.jsx
│   ├── pages/
│   │   ├── LandingPage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── SignupPage.jsx
│   │   ├── Dashboard.jsx
│   │   ├── PropertiesPage.jsx
│   │   ├── UnitsPage.jsx
│   │   ├── TenantsPage.jsx
│   │   ├── ReportsPage.jsx
│   │   ├── SettingsPage.jsx
│   │   └── NotFound.jsx
│   ├── services/
│   │   ├── supabase.js
│   │   ├── auth.js
│   │   ├── organizations.js
│   │   ├── properties.js
│   │   ├── units.js
│   │   ├── tenants.js
│   │   └── reports.js
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useOrganization.js
│   │   ├── useProperties.js
│   │   ├── useUnits.js
│   │   └── useTenants.js
│   ├── stores/
│   │   ├── authStore.js
│   │   ├── organizationStore.js
│   │   └── dataStore.js
│   ├── utils/
│   │   ├── constants.js
│   │   ├── helpers.js
│   │   ├── validators.js
│   │   └── formatters.js
│   ├── App.jsx
│   └── main.jsx
├── public/
├── package.json
├── tailwind.config.js
├── vite.config.js
└── README.md
Phase 1: Multi-Tenant Database Architecture
1.1 Core Tables
Organizations Table (Tenant Isolation)
sqlCREATE TABLE organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL,
  slug VARCHAR UNIQUE NOT NULL,
  subscription_status VARCHAR DEFAULT 'trial', -- 'trial', 'active', 'canceled', 'past_due'
  subscription_plan VARCHAR DEFAULT 'starter', -- 'starter', 'professional', 'enterprise'
  trial_ends_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
User Profiles Table
sqlCREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email VARCHAR NOT NULL,
  full_name VARCHAR,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  role VARCHAR DEFAULT 'member', -- 'owner', 'admin', 'member'
  avatar_url VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
Properties Table
sqlCREATE TABLE properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  address TEXT,
  city VARCHAR,
  state VARCHAR,
  zip_code VARCHAR,
  property_type VARCHAR, -- 'apartment', 'house', 'commercial'
  total_units INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
Enhanced Units Table
sqlCREATE TABLE units (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  unit_number VARCHAR NOT NULL,
  unit_type VARCHAR NOT NULL, -- 'studio', '1br', '2br', '3br', etc.
  rent_amount DECIMAL(10,2),
  deposit_amount DECIMAL(10,2),
  square_footage INTEGER,
  bedrooms INTEGER DEFAULT 0,
  bathrooms DECIMAL(2,1) DEFAULT 0,
  status VARCHAR DEFAULT 'vacant', -- 'occupied', 'vacant', 'maintenance', 'unavailable'
  description TEXT,
  amenities TEXT[], -- Array of amenities
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(organization_id, property_id, unit_number)
);
Enhanced Tenants Table
sqlCREATE TABLE tenants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
  first_name VARCHAR NOT NULL,
  last_name VARCHAR NOT NULL,
  email VARCHAR,
  phone VARCHAR,
  emergency_contact_name VARCHAR,
  emergency_contact_phone VARCHAR,
  lease_start_date DATE,
  lease_end_date DATE,
  rent_amount DECIMAL(10,2),
  deposit_paid DECIMAL(10,2),
  security_deposit DECIMAL(10,2),
  status VARCHAR DEFAULT 'active', -- 'active', 'inactive', 'pending', 'moved_out'
  move_in_date DATE,
  move_out_date DATE,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
Lease History Table (Track tenant movements)
sqlCREATE TABLE lease_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  lease_start_date DATE NOT NULL,
  lease_end_date DATE,
  rent_amount DECIMAL(10,2),
  deposit_amount DECIMAL(10,2),
  move_in_date DATE,
  move_out_date DATE,
  status VARCHAR DEFAULT 'active', -- 'active', 'completed', 'terminated'
  termination_reason VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);
1.2 Row Level Security (RLS) Policies
sql-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE lease_history ENABLE ROW LEVEL SECURITY;

-- User Profiles: Users can only see profiles in their organization
CREATE POLICY "Users can view own organization profiles" ON user_profiles
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- Properties: Users can only access their organization's properties
CREATE POLICY "Users can manage own organization properties" ON properties
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- Units: Users can only access units in their organization
CREATE POLICY "Users can manage own organization units" ON units
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- Tenants: Users can only access tenants in their organization
CREATE POLICY "Users can manage own organization tenants" ON tenants
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- Lease History: Users can only access lease history in their organization
CREATE POLICY "Users can view own organization lease history" ON lease_history
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- Organizations: Users can only view their own organization
CREATE POLICY "Users can view own organization" ON organizations
  FOR SELECT USING (
    id IN (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  );
Phase 2: Authentication & User Management
2.1 Authentication Service (src/services/auth.js)
javascriptimport { supabase } from './supabase'

export const authService = {
  // Sign up with organization creation
  async signUpWithOrganization(email, password, fullName, organizationName) {
    try {
      // 1. Sign up user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })
      
      if (authError) throw authError

      // 2. Create organization
      const orgSlug = organizationName.toLowerCase().replace(/\s+/g, '-')
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert([{
          name: organizationName,
          slug: orgSlug,
          subscription_status: 'trial',
          trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days
        }])
        .select()
        .single()

      if (orgError) throw orgError

      // 3. Create user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert([{
          id: authData.user.id,
          email,
          full_name: fullName,
          organization_id: orgData.id,
          role: 'owner'
        }])

      if (profileError) throw profileError

      return { data: { user: authData.user, organization: orgData }, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Sign in
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // Get current session
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession()
    return { session, error }
  },

  // Get user profile with organization
  async getUserProfile(userId) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select(`
        *,
        organizations (
          id,
          name,
          subscription_status,
          subscription_plan,
          trial_ends_at
        )
      `)
      .eq('id', userId)
      .single()
    
    return { data, error }
  }
}
2.2 Protected Route Component
javascript// src/components/auth/ProtectedRoute.jsx
import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import Spinner from '../ui/Spinner'

export default function ProtectedRoute({ children }) {
  const { user, loading, checkAuth } = useAuthStore()
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    checkAuth().finally(() => setInitializing(false))
  }, [])

  if (initializing || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="large" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}
Phase 3: Enhanced Services Layer
3.1 Properties Service
javascript// src/services/properties.js
import { supabase } from './supabase'

export const propertiesService = {
  async getProperties() {
    const { data, error } = await supabase
      .from('properties')
      .select(`
        *,
        units (
          id,
          status
        )
      `)
      .order('created_at', { ascending: false })
    
    // Calculate occupancy stats
    const propertiesWithStats = data?.map(property => ({
      ...property,
      total_units: property.units?.length || 0,
      occupied_units: property.units?.filter(unit => unit.status === 'occupied').length || 0,
      vacant_units: property.units?.filter(unit => unit.status === 'vacant').length || 0,
    })) || []

    return { data: propertiesWithStats, error }
  },

  async createProperty(property) {
    const { data, error } = await supabase
      .from('properties')
      .insert([property])
      .select()
    return { data, error }
  },

  async updateProperty(id, updates) {
    const { data, error } = await supabase
      .from('properties')
      .update(updates)
      .eq('id', id)
      .select()
    return { data, error }
  },

  async deleteProperty(id) {
    const { data, error } = await supabase
      .from('properties')
      .delete()
      .eq('id', id)
    return { data, error }
  }
}
3.2 Enhanced Units Service
javascript// src/services/units.js
import { supabase } from './supabase'

export const unitsService = {
  async getUnits(propertyId = null) {
    let query = supabase
      .from('units')
      .select(`
        *,
        properties (
          id,
          name,
          address
        ),
        tenants!inner (
          id,
          first_name,
          last_name,
          email,
          lease_end_date,
          status
        )
      `)
      .order('created_at', { ascending: false })

    if (propertyId) {
      query = query.eq('property_id', propertyId)
    }

    const { data, error } = await query
    return { data, error }
  },

  async getVacantUnits() {
    const { data, error } = await supabase
      .from('units')
      .select(`
        *,
        properties (
          id,
          name
        )
      `)
      .eq('status', 'vacant')
      .order('properties.name', { ascending: true })
    
    return { data, error }
  },

  async createUnit(unit) {
    const { data, error } = await supabase
      .from('units')
      .insert([unit])
      .select(`
        *,
        properties (
          id,
          name
        )
      `)
    return { data, error }
  },

  async updateUnitStatus(id, status) {
    const { data, error } = await supabase
      .from('units')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
    return { data, error }
  }
}
Phase 4: Dashboard & Reports
4.1 Enhanced Dashboard Stats
javascript// Key metrics to display:
- Total Properties
- Total Units
- Occupied Units (with percentage)
- Vacant Units (with percentage)
- Units in Maintenance
- Total Active Tenants
- Leases Expiring (next 30/60/90 days)
- Monthly Revenue (current/projected)
- Occupancy Rate Trend
4.2 Reports System
javascript// src/services/reports.js
export const reportsService = {
  async getOccupancyReport(startDate, endDate) {
    // Query for occupancy trends over time
  },

  async getRentRollReport() {
    // Current rent roll with all active leases
  },

  async getExpiringLeases(days = 30) {
    // Leases expiring in next X days
  },

  async getVacancyReport() {
    // Vacant units and days vacant
  },

  async exportToCSV(reportType, data) {
    // Export functionality for reports
  }
}
Phase 5: Mobile-First UI/UX
5.1 Responsive Design Requirements

Mobile-first approach (property managers use phones frequently)
Touch-friendly buttons and forms
Optimized table views for mobile
Quick action buttons for common tasks
Swipe gestures for mobile interactions

5.2 Key UI Components
javascript// Essential mobile-optimized components:
- Responsive data tables with horizontal scroll
- Mobile-friendly forms with proper input types
- Touch-friendly dropdown menus
- Sticky headers for navigation
- Pull-to-refresh functionality
- Infinite scroll for large datasets
Phase 6: Essential Features
6.1 User Management

Organization-based user invitations
Role-based permissions (Owner, Admin, Member)
User profile management
Organization settings

6.2 Data Export/Import

Export tenant/unit data to CSV/Excel
Import bulk data from spreadsheets
Backup and restore functionality

6.3 Notifications & Alerts

Lease expiration alerts
Maintenance request notifications
Payment due reminders
System activity feed

6.4 Search & Filtering

Global search across tenants/units/properties
Advanced filtering options
Saved search queries
Quick filters for common views

Phase 7: Subscription & Billing Foundation
7.1 Subscription Limits
javascriptconst SUBSCRIPTION_LIMITS = {
  trial: { properties: 1, units: 5, users: 1 },
  starter: { properties: 3, units: 25, users: 2 },
  professional: { properties: 10, units: 100, users: 5 },
  enterprise: { properties: -1, units: -1, users: -1 } // unlimited
}
7.2 Usage Tracking

Track property/unit/tenant counts
Monitor API usage
Implement soft limits with upgrade prompts
Trial expiration handling

Development Phases
Phase 1: Foundation (Week 1)

Set up multi-tenant database schema
Implement authentication with organization creation
Create basic RLS policies
Set up project structure

Phase 2: Core Features (Week 2)

Build property/unit/tenant CRUD operations
Implement mobile-responsive UI
Add basic dashboard with stats
Create forms with validation

Phase 3: Enhanced Features (Week 3)

Add reports and export functionality
Implement search and filtering
Create lease expiration alerts
Add user management features

Phase 4: Polish & Deploy (Week 4)

Add error handling and loading states
Implement subscription limits
Optimize performance
Deploy to Vercel with proper environment setup

Success Criteria
MVP Completion Checklist:

 Multi-tenant authentication working
 Organization-based data separation
 Properties, units, and tenants CRUD
 Mobile-responsive design
 Dashboard with key metrics
 Basic reporting (occupancy, rent roll)
 Data export functionality
 Lease expiration alerts
 User invitation system
 Trial period management
 Production deployment
 Basic error handling and validation