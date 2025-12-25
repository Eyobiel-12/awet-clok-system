-- Update all admin policies to use the is_admin() function to prevent recursion
-- This ensures consistent behavior across all tables

-- Update profiles admin policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (public.is_admin());

-- Update shifts admin policies
DROP POLICY IF EXISTS "Admins can view all shifts" ON shifts;
CREATE POLICY "Admins can view all shifts" ON shifts
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can modify all shifts" ON shifts;
CREATE POLICY "Admins can modify all shifts" ON shifts
  FOR ALL USING (public.is_admin());



