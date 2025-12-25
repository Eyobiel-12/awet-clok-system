-- Test script to verify admin can see all shifts
-- Run this in Supabase SQL Editor as the admin user

-- First, check if you're logged in as admin
SELECT 
  u.email,
  p.role,
  p.name
FROM auth.users u
JOIN profiles p ON u.id = p.id
WHERE u.id = auth.uid();

-- Check if is_admin() function works
SELECT public.is_admin() as is_admin;

-- Check all shifts in the database
SELECT 
  s.id,
  s.user_id,
  s.clock_in,
  s.clock_out,
  s.duration_minutes,
  p.name as employee_name,
  p.role as employee_role
FROM shifts s
LEFT JOIN profiles p ON s.user_id = p.id
ORDER BY s.clock_in DESC
LIMIT 20;

-- Check shifts for specific employee (Eyobiel Gootom)
SELECT 
  s.id,
  s.user_id,
  s.clock_in,
  s.clock_out,
  s.duration_minutes,
  p.name as employee_name
FROM shifts s
LEFT JOIN profiles p ON s.user_id = p.id
WHERE LOWER(p.name) LIKE '%eyobiel%' OR LOWER(p.name) LIKE '%gootom%'
ORDER BY s.clock_in DESC;

-- Test the RLS policy directly
-- This should return all shifts if you're admin
SELECT COUNT(*) as total_shifts FROM shifts;

-- Check active shifts
SELECT 
  s.id,
  s.user_id,
  s.clock_in,
  p.name as employee_name
FROM shifts s
LEFT JOIN profiles p ON s.user_id = p.id
WHERE s.clock_out IS NULL
ORDER BY s.clock_in DESC;



