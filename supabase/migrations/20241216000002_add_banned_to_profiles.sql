-- Add banned column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS banned BOOLEAN DEFAULT FALSE;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_banned ON profiles(banned) WHERE banned = true;

