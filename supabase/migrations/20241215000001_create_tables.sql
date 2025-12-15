-- Create profiles table with role support
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'worker' CHECK (role IN ('worker', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create restaurant table (single location for geofencing)
CREATE TABLE IF NOT EXISTS restaurant (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Massawa Restaurant',
  lat NUMERIC NOT NULL,
  lng NUMERIC NOT NULL,
  radius_m INTEGER NOT NULL DEFAULT 100
);

-- Create shifts table for time tracking
CREATE TABLE IF NOT EXISTS shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clock_in TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  clock_out TIMESTAMPTZ,
  lat NUMERIC,
  lng NUMERIC,
  duration_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then recreate
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

DROP POLICY IF EXISTS "Everyone can view restaurant" ON restaurant;
DROP POLICY IF EXISTS "Only admins can modify restaurant" ON restaurant;

DROP POLICY IF EXISTS "Workers can view own shifts" ON shifts;
DROP POLICY IF EXISTS "Workers can insert own shifts" ON shifts;
DROP POLICY IF EXISTS "Workers can update own shifts" ON shifts;
DROP POLICY IF EXISTS "Admins can view all shifts" ON shifts;
DROP POLICY IF EXISTS "Admins can modify all shifts" ON shifts;

-- Profiles RLS Policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Restaurant RLS Policies (everyone can read)
CREATE POLICY "Everyone can view restaurant" ON restaurant
  FOR SELECT USING (true);

CREATE POLICY "Only admins can modify restaurant" ON restaurant
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Shifts RLS Policies
CREATE POLICY "Workers can view own shifts" ON shifts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Workers can insert own shifts" ON shifts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Workers can update own shifts" ON shifts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all shifts" ON shifts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can modify all shifts" ON shifts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Insert default restaurant location (Massawa Restaurant - placeholder coordinates)
-- Update these coordinates to the actual restaurant location
INSERT INTO restaurant (name, lat, lng, radius_m)
VALUES ('Massawa Restaurant', 52.3676, 4.9041, 100)
ON CONFLICT DO NOTHING;
