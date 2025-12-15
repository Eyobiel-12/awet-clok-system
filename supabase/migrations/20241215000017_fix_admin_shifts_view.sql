-- Fix admin shifts view policy to ensure admins can see all shifts
-- This ensures the is_admin() function works correctly and admins can view all shifts

-- First, ensure is_admin() function exists
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
$$;

-- Drop and recreate the admin shifts policies to ensure they work
DROP POLICY IF EXISTS "Admins can view all shifts" ON shifts;
DROP POLICY IF EXISTS "Admins can modify all shifts" ON shifts;

-- Create admin view policy using is_admin() function
CREATE POLICY "Admins can view all shifts" ON shifts
  FOR SELECT 
  USING (public.is_admin());

-- Create admin modify policy
CREATE POLICY "Admins can modify all shifts" ON shifts
  FOR ALL 
  USING (public.is_admin());

-- Also ensure workers can still view their own shifts
DROP POLICY IF EXISTS "Workers can view own shifts" ON shifts;
CREATE POLICY "Workers can view own shifts" ON shifts
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Verify the policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'shifts'
ORDER BY policyname;

