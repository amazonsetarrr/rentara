-- Fix missing user profile for zainiemel2@gmail.com
-- Run this in your Supabase SQL Editor

-- First, verify your organization exists
SELECT id, name, slug FROM organizations WHERE id = 'dbd2d996-e771-4c7b-8811-edc1c6763780';

-- Check if the user exists in auth.users
SELECT id, email, created_at FROM auth.users WHERE email = 'zainiemel2@gmail.com';

-- Insert user profile with your specific organization ID
INSERT INTO user_profiles (
  id, 
  email, 
  full_name, 
  organization_id, 
  role, 
  created_at, 
  updated_at
) VALUES (
  '950a4d5b-63d2-48de-8fd6-fb14681ace0a'::uuid,
  'zainiemel2@gmail.com',
  'Zaini Emel',
  'dbd2d996-e771-4c7b-8811-edc1c6763780'::uuid,
  'owner',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  organization_id = EXCLUDED.organization_id,
  role = EXCLUDED.role,
  updated_at = NOW();

-- Verify the insert worked
SELECT 
  up.id,
  up.email,
  up.full_name,
  up.role,
  org.name as organization_name,
  org.id as organization_id
FROM user_profiles up
JOIN organizations org ON up.organization_id = org.id
WHERE up.email = 'zainiemel2@gmail.com';

-- Show success message
SELECT 'User profile created successfully!' as status;