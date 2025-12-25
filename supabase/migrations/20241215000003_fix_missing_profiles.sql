-- Fix missing profiles for existing users
-- This will create profiles for any users that don't have one yet

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



