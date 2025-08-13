-- IMPROVED System Owner Schema - Complete Separation
-- This approach completely separates system owners from tenant users

-- 1. Create a separate auth schema for system owners
CREATE SCHEMA IF NOT EXISTS system_auth;

-- 2. System owners table (completely separate from user_profiles)
CREATE TABLE system_auth.system_owners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  encrypted_password VARCHAR NOT NULL, -- We'll handle our own password hashing
  full_name VARCHAR NOT NULL,
  permissions JSONB DEFAULT '{"manage_organizations": true, "view_analytics": true, "manage_billing": true}',
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. System owner sessions (separate from Supabase auth)
CREATE TABLE system_auth.system_owner_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  system_owner_id UUID REFERENCES system_auth.system_owners(id) ON DELETE CASCADE,
  token VARCHAR UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Remove system owner fields from user_profiles (clean separation)
-- Note: Only run this if you want to completely separate the systems
-- ALTER TABLE user_profiles DROP COLUMN IF EXISTS is_system_owner;
-- DROP TABLE IF EXISTS system_owners; -- Remove the old system_owners table

-- 5. Organization metrics and audit tables remain the same
CREATE TABLE IF NOT EXISTS system_auth.organization_metrics (
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

CREATE TABLE IF NOT EXISTS system_auth.system_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  system_owner_id UUID REFERENCES system_auth.system_owners(id),
  organization_id UUID REFERENCES organizations(id),
  action VARCHAR NOT NULL,
  details JSONB,
  ip_address INET,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 6. RLS Policies for system owner tables
ALTER TABLE system_auth.system_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_auth.system_owner_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_auth.organization_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_auth.system_audit_log ENABLE ROW LEVEL SECURITY;

-- System owners can only see their own records
CREATE POLICY "System owners can manage their own record" ON system_auth.system_owners
  FOR ALL USING (email = current_setting('app.current_system_owner_email', true));

CREATE POLICY "System owners can manage their own sessions" ON system_auth.system_owner_sessions
  FOR ALL USING (
    system_owner_id IN (
      SELECT id FROM system_auth.system_owners 
      WHERE email = current_setting('app.current_system_owner_email', true)
    )
  );

-- System owners can view all metrics and audit logs (but not modify)
CREATE POLICY "System owners can view all metrics" ON system_auth.organization_metrics
  FOR SELECT USING (
    current_setting('app.current_system_owner_email', true) IS NOT NULL
  );

CREATE POLICY "System owners can view audit logs" ON system_auth.system_audit_log
  FOR SELECT USING (
    current_setting('app.current_system_owner_email', true) IS NOT NULL
  );

CREATE POLICY "System owners can insert audit logs" ON system_auth.system_audit_log
  FOR INSERT WITH CHECK (
    system_owner_id IN (
      SELECT id FROM system_auth.system_owners 
      WHERE email = current_setting('app.current_system_owner_email', true)
    )
  );

-- 7. Special RLS policies to allow system owners to view all tenant data
-- (Override the existing tenant isolation policies when system owner is authenticated)

CREATE POLICY "System owners can view all organizations" ON organizations
  FOR SELECT USING (
    -- Regular tenant check OR system owner check
    id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid())
    OR 
    current_setting('app.current_system_owner_email', true) IS NOT NULL
  );

CREATE POLICY "System owners can manage all organizations" ON organizations
  FOR ALL USING (
    -- Regular tenant check OR system owner check
    id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid())
    OR 
    current_setting('app.current_system_owner_email', true) IS NOT NULL
  );

-- Similar policies for other tables
CREATE POLICY "System owners can view all user profiles" ON user_profiles
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid())
    OR 
    current_setting('app.current_system_owner_email', true) IS NOT NULL
  );

CREATE POLICY "System owners can view all properties" ON properties
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid())
    OR 
    current_setting('app.current_system_owner_email', true) IS NOT NULL
  );

CREATE POLICY "System owners can view all units" ON units
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid())
    OR 
    current_setting('app.current_system_owner_email', true) IS NOT NULL
  );

CREATE POLICY "System owners can view all tenants" ON tenants
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM user_profiles WHERE id = auth.uid())
    OR 
    current_setting('app.current_system_owner_email', true) IS NOT NULL
  );

-- 8. Indexes for performance
CREATE INDEX idx_system_owners_email ON system_auth.system_owners(email);
CREATE INDEX idx_system_owner_sessions_token ON system_auth.system_owner_sessions(token);
CREATE INDEX idx_system_owner_sessions_expires ON system_auth.system_owner_sessions(expires_at);

-- 9. Functions for password hashing and verification
-- Note: In a real application, you'd want to use a proper password hashing library
-- This is a simplified example

CREATE OR REPLACE FUNCTION system_auth.hash_password(password TEXT)
RETURNS TEXT AS $$
BEGIN
  -- In production, use proper password hashing like bcrypt
  -- This is just for demonstration
  RETURN encode(digest(password || 'salt', 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION system_auth.verify_password(password TEXT, hash TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN hash = system_auth.hash_password(password);
END;
$$ LANGUAGE plpgsql;

-- 10. Function to create system owner session
CREATE OR REPLACE FUNCTION system_auth.create_session(owner_email TEXT, password TEXT)
RETURNS JSON AS $$
DECLARE
  owner_record system_auth.system_owners;
  session_token TEXT;
  session_expires TIMESTAMP;
  result JSON;
BEGIN
  -- Verify credentials
  SELECT * INTO owner_record
  FROM system_auth.system_owners
  WHERE email = owner_email;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invalid credentials');
  END IF;

  IF NOT system_auth.verify_password(password, owner_record.encrypted_password) THEN
    RETURN json_build_object('success', false, 'error', 'Invalid credentials');
  END IF;

  -- Create session
  session_token := encode(gen_random_bytes(32), 'hex');
  session_expires := NOW() + INTERVAL '24 hours';

  INSERT INTO system_auth.system_owner_sessions (system_owner_id, token, expires_at)
  VALUES (owner_record.id, session_token, session_expires);

  -- Update last login
  UPDATE system_auth.system_owners 
  SET last_login_at = NOW() 
  WHERE id = owner_record.id;

  -- Set session context
  PERFORM set_config('app.current_system_owner_email', owner_email, true);

  RETURN json_build_object(
    'success', true,
    'token', session_token,
    'expires_at', session_expires,
    'owner', json_build_object(
      'id', owner_record.id,
      'email', owner_record.email,
      'full_name', owner_record.full_name,
      'permissions', owner_record.permissions
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Function to verify session
CREATE OR REPLACE FUNCTION system_auth.verify_session(session_token TEXT)
RETURNS JSON AS $$
DECLARE
  session_record system_auth.system_owner_sessions;
  owner_record system_auth.system_owners;
  result JSON;
BEGIN
  -- Get session
  SELECT * INTO session_record
  FROM system_auth.system_owner_sessions
  WHERE token = session_token AND expires_at > NOW();

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invalid or expired session');
  END IF;

  -- Get owner
  SELECT * INTO owner_record
  FROM system_auth.system_owners
  WHERE id = session_record.system_owner_id;

  -- Set session context
  PERFORM set_config('app.current_system_owner_email', owner_record.email, true);

  RETURN json_build_object(
    'success', true,
    'owner', json_build_object(
      'id', owner_record.id,
      'email', owner_record.email,
      'full_name', owner_record.full_name,
      'permissions', owner_record.permissions
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Create your first system owner (replace with your details)
INSERT INTO system_auth.system_owners (email, encrypted_password, full_name, permissions)
VALUES (
  'admin@yourcompany.com',
  system_auth.hash_password('your_secure_password_here'),
  'System Administrator',
  '{"manage_organizations": true, "view_analytics": true, "manage_billing": true, "manage_system_owners": true}'
);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA system_auth TO postgres, anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA system_auth TO postgres;
GRANT SELECT ON ALL TABLES IN SCHEMA system_auth TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA system_auth TO anon, authenticated;