-- Multi-Tenant Property Management SaaS Database Schema
-- Execute this SQL in your Supabase SQL Editor

-- 1. Organizations Table (Tenant Isolation)
CREATE TABLE organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL,
  slug VARCHAR UNIQUE NOT NULL,
  subscription_status VARCHAR DEFAULT 'trial', -- 'trial', 'active', 'canceled', 'past_due'
  subscription_plan VARCHAR DEFAULT 'starter', -- 'starter', 'professional', 'enterprise'
  trial_ends_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. User Profiles Table
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email VARCHAR NOT NULL,
  full_name VARCHAR,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  role VARCHAR DEFAULT 'member', -- 'owner', 'admin', 'member'
  avatar_url VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Properties Table
CREATE TABLE properties (
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

-- 4. Enhanced Units Table
CREATE TABLE units (
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

-- 5. Enhanced Tenants Table
CREATE TABLE tenants (
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

-- 6. Lease History Table (Track tenant movements)
CREATE TABLE lease_history (
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

-- 7. Enable Row Level Security (RLS) on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE lease_history ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies for Multi-Tenant Data Isolation

-- User Profiles: Users can only see profiles in their organization
CREATE POLICY "Users can view own organization profiles" ON user_profiles
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (id = auth.uid());

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

-- 9. Indexes for better performance
CREATE INDEX idx_user_profiles_organization_id ON user_profiles(organization_id);
CREATE INDEX idx_properties_organization_id ON properties(organization_id);
CREATE INDEX idx_units_organization_id ON units(organization_id);
CREATE INDEX idx_units_property_id ON units(property_id);
CREATE INDEX idx_tenants_organization_id ON tenants(organization_id);
CREATE INDEX idx_tenants_unit_id ON tenants(unit_id);
CREATE INDEX idx_lease_history_organization_id ON lease_history(organization_id);

-- 10. Functions and Triggers for automatic updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_units_updated_at BEFORE UPDATE ON units FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();