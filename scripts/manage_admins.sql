-- Admin Management Scripts
-- Run these in Supabase SQL Editor

-- 1. View all users and their roles
SELECT 
  u.email,
  p.name,
  p.role,
  p.created_at,
  CASE 
    WHEN p.role = 'admin' THEN '🛡️ Admin'
    ELSE '👤 Worker'
  END as role_display
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
ORDER BY 
  CASE WHEN p.role = 'admin' THEN 0 ELSE 1 END,
  p.name;

-- 2. Count admins and workers
SELECT 
  role,
  COUNT(*) as count
FROM profiles
GROUP BY role;

-- 3. Make a specific user an admin (replace email)
UPDATE profiles
SET role = 'admin'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL_HERE'
);

-- 4. Make yourself admin (if you know your email)
-- Replace 'your-email@example.com' with your actual email
UPDATE profiles
SET role = 'admin'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'your-email@example.com'
);

-- 5. List all current admins
SELECT 
  u.email,
  p.name,
  p.created_at
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.role = 'admin'
ORDER BY p.created_at;

-- 6. Remove admin role from a user (use carefully!)
-- UPDATE profiles
-- SET role = 'worker'
-- WHERE id = (
--   SELECT id FROM auth.users WHERE email = 'email-to-remove-admin@example.com'
-- );

