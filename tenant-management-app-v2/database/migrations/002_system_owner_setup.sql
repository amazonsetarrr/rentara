-- System Owner Extensions for Multi-Tenant Property Management
-- Execute this SQL after the main schema setup

-- 1. Add system_owner role to user_profiles
ALTER TABLE user_profiles 
ADD COLUMN is_system_owner BOOLEAN DEFAULT FALSE;

-- 2. Create system owners table for additional metadata
CREATE TABLE system_owners (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name VARCHAR NOT NULL,
  email VARCHAR NOT NULL,
  permissions JSONB DEFAULT '{"manage_organizations": true, "view_analytics": true, "manage_billing": true}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Organization analytics and metrics table
CREATE TABLE organization_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  total_properties INTEGER DEFAULT 0,
  total_units INTEGER DEFAULT 0,
  total_tenants INTEGER DEFAULT 0,
  occupied_units INTEGER DEFAULT 0,
  vacancy_rate DECIMAL(5,2) DEFAULT 0,
  total_revenue DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(organization_id, metric_date)
);

-- 4. System-wide audit log
CREATE TABLE system_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  system_owner_id UUID REFERENCES system_owners(id),
  organization_id UUID REFERENCES organizations(id),
  action VARCHAR NOT NULL, -- 'create_org', 'suspend_org', 'update_billing', etc.
  details JSONB,
  ip_address INET,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Enable RLS on new tables
ALTER TABLE system_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_audit_log ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for System Owners
-- System owners can view and manage all data
CREATE POLICY "System owners can manage everything" ON organizations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND is_system_owner = TRUE
    )
  );

CREATE POLICY "System owners can view all user profiles" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND is_system_owner = TRUE
    )
  );

CREATE POLICY "System owners can view all properties" ON properties
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND is_system_owner = TRUE
    )
  );

CREATE POLICY "System owners can view all units" ON units
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND is_system_owner = TRUE
    )
  );

CREATE POLICY "System owners can view all tenants" ON tenants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND is_system_owner = TRUE
    )
  );

-- System owners table policies
CREATE POLICY "System owners can manage their own record" ON system_owners
  FOR ALL USING (id = auth.uid());

-- Metrics policies
CREATE POLICY "System owners can view all metrics" ON organization_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND is_system_owner = TRUE
    )
  );

-- Audit log policies
CREATE POLICY "System owners can view audit logs" ON system_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND is_system_owner = TRUE
    )
  );

CREATE POLICY "System owners can insert audit logs" ON system_audit_log
  FOR INSERT WITH CHECK (system_owner_id = auth.uid());

-- 7. Create indexes
CREATE INDEX idx_user_profiles_is_system_owner ON user_profiles(is_system_owner);
CREATE INDEX idx_organization_metrics_date ON organization_metrics(metric_date);
CREATE INDEX idx_organization_metrics_org_id ON organization_metrics(organization_id);
CREATE INDEX idx_system_audit_log_system_owner_id ON system_audit_log(system_owner_id);
CREATE INDEX idx_system_audit_log_created_at ON system_audit_log(created_at);

-- 8. Apply updated_at triggers
CREATE TRIGGER update_system_owners_updated_at 
  BEFORE UPDATE ON system_owners 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 9. Function to calculate organization metrics
CREATE OR REPLACE FUNCTION calculate_organization_metrics(org_id UUID)
RETURNS organization_metrics AS $$
DECLARE
  result organization_metrics;
BEGIN
  SELECT 
    gen_random_uuid(),
    org_id,
    CURRENT_DATE,
    (SELECT COUNT(*) FROM properties WHERE organization_id = org_id),
    (SELECT COUNT(*) FROM units WHERE organization_id = org_id),
    (SELECT COUNT(*) FROM tenants WHERE organization_id = org_id AND status = 'active'),
    (SELECT COUNT(*) FROM units WHERE organization_id = org_id AND status = 'occupied'),
    CASE 
      WHEN (SELECT COUNT(*) FROM units WHERE organization_id = org_id) > 0 
      THEN (SELECT COUNT(*) FROM units WHERE organization_id = org_id AND status = 'vacant')::DECIMAL / 
           (SELECT COUNT(*) FROM units WHERE organization_id = org_id)::DECIMAL * 100
      ELSE 0
    END,
    (SELECT COALESCE(SUM(rent_amount), 0) FROM tenants WHERE organization_id = org_id AND status = 'active'),
    NOW()
  INTO result;
  
  return result;
END;
$$ LANGUAGE plpgsql;