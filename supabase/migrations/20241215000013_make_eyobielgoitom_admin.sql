-- Make Eyobielgoitom10@gmail.com an admin user
UPDATE profiles
SET role = 'admin'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'Eyobielgoitom10@gmail.com'
);

-- Verify the update
SELECT 
  u.email,
  p.name,
  p.role,
  p.created_at
FROM auth.users u
JOIN profiles p ON u.id = p.id
WHERE u.email = 'Eyobielgoitom10@gmail.com';

