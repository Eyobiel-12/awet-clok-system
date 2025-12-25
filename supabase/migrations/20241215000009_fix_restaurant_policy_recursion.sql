-- Fix restaurant policy recursion by using a function-based approach
-- Create a function that safely checks if user is admin without recursion

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
$$;

-- Drop existing restaurant policies
DROP POLICY IF EXISTS "Everyone can view restaurant" ON restaurant;
DROP POLICY IF EXISTS "Only admins can modify restaurant" ON restaurant;

-- Create separate policies for SELECT and other operations
-- SELECT: Everyone can read (no recursion issue)
CREATE POLICY "Everyone can view restaurant" ON restaurant
  FOR SELECT USING (true);

-- INSERT/UPDATE/DELETE: Only admins (using function to avoid recursion)
CREATE POLICY "Only admins can modify restaurant" ON restaurant
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can update restaurant" ON restaurant
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Only admins can delete restaurant" ON restaurant
  FOR DELETE USING (public.is_admin());

-- Grant execute on the function to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;



