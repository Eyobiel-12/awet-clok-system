-- Make the user with email Eyobielgoitom10@gmail.com an admin
-- This is a one-time migration to grant admin access

UPDATE profiles
SET role = 'admin'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'Eyobielgoitom10@gmail.com'
)
AND role != 'admin';



