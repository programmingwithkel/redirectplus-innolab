-- ============================================
-- Fix: Re-insert admin profile
-- The admin user exists in auth.users but 
-- has no matching row in profiles table.
-- ============================================

INSERT INTO profiles (id, email, full_name, role, facility_id, is_active)
SELECT 
  id, 
  email, 
  'Admin CareRoute', 
  'super_admin', 
  NULL, 
  true
FROM auth.users 
WHERE email = 'admin@careroute.ph'
ON CONFLICT (id) DO UPDATE SET
  role = 'super_admin',
  is_active = true;

-- Verify it worked
SELECT id, email, full_name, role, facility_id 
FROM profiles 
WHERE email = 'admin@careroute.ph';
