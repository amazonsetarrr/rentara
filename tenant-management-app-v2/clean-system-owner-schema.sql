-- CLEAN System Owner Schema - Handle Existing Policies
-- This safely handles existing policies and creates the separate system

-- 1. Create system_auth schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS system_auth;

-- 2. Drop existing conflicting policies if they exist
DO $$ 
BEGIN
    -- Drop existing system owner policies if they exist
    DROP POLICY IF EXISTS "System owners can view all user profiles" ON user_profiles;
    DROP POLICY IF EXISTS "System owners can view all organizations" ON organizations;
    DROP POLICY IF EXISTS "System owners can manage all organizations" ON organizations;
    DROP POLICY IF EXISTS "System owners can view all properties" ON properties;
    DROP POLICY IF EXISTS "System owners can view all units" ON units;
    DROP POLICY IF EXISTS "System owners can view all tenants" ON tenants;
    DROP POLICY IF EXISTS "System owners can view all metrics" ON organization_metrics;
    DROP POLICY IF EXISTS "System owners can view audit logs" ON system_audit_log;
    DROP POLICY IF EXISTS "System owners can insert audit logs" ON system_audit_log;
    
    -- Also drop any old system owner related tables/columns
    DROP TABLE IF EXISTS system_owners CASCADE;
    DROP TABLE IF EXISTS organization_metrics CASCADE;
    DROP TABLE IF EXISTS system_audit_log CASCADE;
    
    -- Remove system owner columns from user_profiles if they exist
    BEGIN
        ALTER TABLE user_profiles DROP COLUMN IF EXISTS is_system_owner;
    EXCEPTION WHEN OTHERS THEN
        NULL; -- Ignore if column doesn't exist
    END;
    
EXCEPTION WHEN OTHERS THEN
    NULL; -- Continue if any drops fail
END $$;

-- 3. Create separate system owners table
CREATE TABLE system_auth.system_owners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  encrypted_password VARCHAR NOT NULL,
  full_name VARCHAR NOT NULL,
  permissions JSONB DEFAULT '{"manage_organizations": true, "view_analytics": true, "manage_billing": true}',
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. System owner sessions
CREATE TABLE system_auth.system_owner_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  system_owner_id UUID REFERENCES system_auth.system_owners(id) ON DELETE CASCADE,
  token VARCHAR UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Organization metrics
CREATE TABLE system_auth.organization_metrics (
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

-- 6. System audit log
CREATE TABLE system_auth.system_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  system_owner_id UUID REFERENCES system_auth.system_owners(id),
  organization_id UUID REFERENCES organizations(id),
  action VARCHAR NOT NULL,
  details JSONB,
  ip_address INET,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 7. Enable RLS
ALTER TABLE system_auth.system_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_auth.system_owner_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_auth.organization_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_auth.system_audit_log ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies for system auth tables
CREATE POLICY "system_owners_own_record" ON system_auth.system_owners
  FOR ALL USING (email = current_setting('app.current_system_owner_email', true));

CREATE POLICY "system_owners_own_sessions" ON system_auth.system_owner_sessions
  FOR ALL USING (
    system_owner_id IN (
      SELECT id FROM system_auth.system_owners 
      WHERE email = current_setting('app.current_system_owner_email', true)
    )
  );

CREATE POLICY "system_owners_view_metrics" ON system_auth.organization_metrics
  FOR SELECT USING (
    current_setting('app.current_system_owner_email', true) IS NOT NULL
  );

CREATE POLICY "system_owners_view_audit" ON system_auth.system_audit_log
  FOR SELECT USING (
    current_setting('app.current_system_owner_email', true) IS NOT NULL
  );

CREATE POLICY "system_owners_insert_audit" ON system_auth.system_audit_log
  FOR INSERT WITH CHECK (
    system_owner_id IN (
      SELECT id FROM system_auth.system_owners 
      WHERE email = current_setting('app.current_system_owner_email', true)
    )
  );

-- 9. Indexes
CREATE INDEX idx_system_owners_email ON system_auth.system_owners(email);
CREATE INDEX idx_system_owner_sessions_token ON system_auth.system_owner_sessions(token);
CREATE INDEX idx_system_owner_sessions_expires ON system_auth.system_owner_sessions(expires_at);

-- 10. Password hashing functions
CREATE OR REPLACE FUNCTION system_auth.hash_password(password TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(digest(password || 'system_salt_2024', 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION system_auth.verify_password(password TEXT, hash TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN hash = system_auth.hash_password(password);
END;
$$ LANGUAGE plpgsql;

-- 11. Session management functions
CREATE OR REPLACE FUNCTION system_auth.create_session(owner_email TEXT, password TEXT)
RETURNS JSON AS $$
DECLARE
  owner_record system_auth.system_owners;
  session_token TEXT;
  session_expires TIMESTAMP;
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

CREATE OR REPLACE FUNCTION system_auth.verify_session(session_token TEXT)
RETURNS JSON AS $$
DECLARE
  session_record system_auth.system_owner_sessions;
  owner_record system_auth.system_owners;
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

-- 12. Grant permissions
GRANT USAGE ON SCHEMA system_auth TO postgres, anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA system_auth TO postgres;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA system_auth TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA system_auth TO anon, authenticated;

-- 13. Create your first system owner (update the email and password)
INSERT INTO system_auth.system_owners (email, encrypted_password, full_name, permissions)
VALUES (
  'zainiemel@gmail.com',  -- Replace with your email
  system_auth.hash_password('admin123'),  -- Replace with your secure password
  'System Administrator',
  '{"manage_organizations": true, "view_analytics": true, "manage_billing": true, "manage_system_owners": true}'
) ON CONFLICT (email) DO UPDATE SET
  encrypted_password = EXCLUDED.encrypted_password,
  full_name = EXCLUDED.full_name,
  permissions = EXCLUDED.permissions,
  updated_at = NOW();

-- 14. Clean up old system owner related data from user_profiles
-- This removes any confusion between the old and new system
UPDATE user_profiles SET role = 'owner' WHERE role = 'system_owner';