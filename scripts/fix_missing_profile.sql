-- Fix missing profiles for existing users
-- This will create profiles for any users that don't have one yet
-- Run this in Supabase SQL Editor

INSERT INTO profiles (id, name, role)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'name', u.email),
  COALESCE(u.raw_user_meta_data->>'role', 'worker')
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;

-- Verify the fix
SELECT 
  u.email,
  p.name,
  p.role,
  p.created_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
ORDER BY u.created_at DESC;

