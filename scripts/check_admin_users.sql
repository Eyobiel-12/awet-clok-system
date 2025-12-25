-- Check all users with admin role
SELECT 
  u.email,
  u.id,
  p.name,
  p.role,
  p.created_at as profile_created,
  u.created_at as user_created
FROM auth.users u
JOIN profiles p ON u.id = p.id
WHERE p.role = 'admin'
ORDER BY u.created_at DESC;



