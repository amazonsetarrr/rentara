-- Migration: Rename system owner terminology to super admin
-- This migration updates the database schema to use 'super_admin' instead of 'system_owner'

-- 1. Rename the column in user_profiles
ALTER TABLE user_profiles 
RENAME COLUMN is_system_owner TO is_super_admin;

-- 2. Update the index name
DROP INDEX IF EXISTS idx_user_profiles_is_system_owner;
CREATE INDEX idx_user_profiles_is_super_admin ON user_profiles(is_super_admin);

-- 3. Rename system_owners table to super_admins (if it exists)
ALTER TABLE IF EXISTS system_owners RENAME TO super_admins;

-- 4. Rename system_audit_log table to super_admin_audit_log (if it exists)
ALTER TABLE IF EXISTS system_audit_log RENAME TO super_admin_audit_log;

-- 5. Update any column references in super_admin_audit_log
ALTER TABLE IF EXISTS super_admin_audit_log 
RENAME COLUMN system_owner_id TO super_admin_id;

-- 6. Update any RLS policies that reference the old column name
-- Note: These policies may not exist depending on your setup
-- Drop old policies if they exist
DROP POLICY IF EXISTS "System owners can view all user profiles" ON user_profiles;
DROP POLICY IF EXISTS "System owners can view all organizations" ON organizations;
DROP POLICY IF EXISTS "System owners can manage all organizations" ON organizations;
DROP POLICY IF EXISTS "System owners can view all properties" ON properties;
DROP POLICY IF EXISTS "System owners can view all units" ON units;
DROP POLICY IF EXISTS "System owners can view all tenants" ON tenants;

-- Create new policies with updated names
CREATE POLICY "Super admins can view all user profiles" ON user_profiles
  FOR SELECT 
  USING (
    (SELECT is_super_admin FROM user_profiles WHERE id = auth.uid()) = true
  );

CREATE POLICY "Super admins can view all organizations" ON organizations
  FOR SELECT 
  USING (
    -- Regular tenant check OR super admin check
    (SELECT organization_id FROM user_profiles WHERE id = auth.uid()) = id
    OR 
    (SELECT is_super_admin FROM user_profiles WHERE id = auth.uid()) = true
  );

CREATE POLICY "Super admins can manage all organizations" ON organizations
  FOR ALL 
  USING (
    -- Regular tenant check OR super admin check
    (SELECT organization_id FROM user_profiles WHERE id = auth.uid()) = id
    OR 
    (SELECT is_super_admin FROM user_profiles WHERE id = auth.uid()) = true
  );

-- Add policies for other tables as needed
CREATE POLICY "Super admins can view all properties" ON properties
  FOR SELECT 
  USING (
    (SELECT organization_id FROM user_profiles WHERE id = auth.uid()) = organization_id
    OR 
    (SELECT is_super_admin FROM user_profiles WHERE id = auth.uid()) = true
  );

CREATE POLICY "Super admins can view all units" ON units
  FOR SELECT 
  USING (
    (SELECT organization_id FROM user_profiles WHERE id = auth.uid()) = (SELECT organization_id FROM properties WHERE properties.id = property_id)
    OR 
    (SELECT is_super_admin FROM user_profiles WHERE id = auth.uid()) = true
  );

CREATE POLICY "Super admins can view all tenants" ON tenants
  FOR SELECT 
  USING (
    (SELECT organization_id FROM user_profiles WHERE id = auth.uid()) = organization_id
    OR 
    (SELECT is_super_admin FROM user_profiles WHERE id = auth.uid()) = true
  );

-- 7. Update any existing super admin users (replace the email with your actual super admin email)
-- Note: You'll need to update this with your actual super admin email
-- UPDATE user_profiles 
-- SET is_super_admin = true, role = 'super_admin' 
-- WHERE email = 'your-super-admin@example.com';