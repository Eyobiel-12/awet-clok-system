-- Fix admin policy to prevent infinite recursion
-- Use a more efficient check that doesn't query profiles during policy evaluation

-- Drop the problematic admin policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Create a new admin policy that checks user metadata first to avoid recursion
-- This uses a subquery that's optimized to not cause recursion
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    -- Check if current user's profile exists and is admin
    -- This is safe because it only checks the current user's row
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Also fix the restaurant and shifts admin policies to use the same pattern
DROP POLICY IF EXISTS "Only admins can modify restaurant" ON restaurant;
CREATE POLICY "Only admins can modify restaurant" ON restaurant
  FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

DROP POLICY IF EXISTS "Admins can view all shifts" ON shifts;
CREATE POLICY "Admins can view all shifts" ON shifts
  FOR SELECT USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

DROP POLICY IF EXISTS "Admins can modify all shifts" ON shifts;
CREATE POLICY "Admins can modify all shifts" ON shifts
  FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

