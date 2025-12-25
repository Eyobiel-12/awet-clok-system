-- Verify and fix admin role for Eyobielgoitom10@gmail.com
-- This ensures the user has admin role

-- First, check current role
SELECT 
  u.email,
  p.name,
  p.role,
  p.id
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'Eyobielgoitom10@gmail.com';

-- Update to admin if not already
UPDATE profiles
SET role = 'admin'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'Eyobielgoitom10@gmail.com'
)
AND role != 'admin';

-- Verify the update
SELECT 
  u.email,
  p.name,
  p.role,
  p.created_at
FROM auth.users u
JOIN profiles p ON u.id = p.id
WHERE u.email = 'Eyobielgoitom10@gmail.com';



