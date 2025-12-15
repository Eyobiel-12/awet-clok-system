-- Script to check your user and profile in Supabase
-- Run this in Supabase SQL Editor to see your user information

-- Check all users in auth.users
SELECT 
  id,
  email,
  created_at,
  raw_user_meta_data->>'name' as name,
  raw_user_meta_data->>'role' as role
FROM auth.users
ORDER BY created_at DESC;

-- Check all profiles
SELECT 
  id,
  name,
  role,
  created_at
FROM profiles
ORDER BY created_at DESC;

-- Check if your profile exists (replace 'your-email@example.com' with your actual email)
SELECT 
  u.id as user_id,
  u.email,
  u.raw_user_meta_data->>'name' as name_from_auth,
  u.raw_user_meta_data->>'role' as role_from_auth,
  p.id as profile_id,
  p.name as profile_name,
  p.role as profile_role
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'your-email@example.com';

-- If profile is missing, create it manually (replace the values)
-- INSERT INTO profiles (id, name, role)
-- SELECT 
--   id,
--   COALESCE(raw_user_meta_data->>'name', email),
--   COALESCE(raw_user_meta_data->>'role', 'worker')
-- FROM auth.users
-- WHERE email = 'your-email@example.com'
-- ON CONFLICT (id) DO NOTHING;

