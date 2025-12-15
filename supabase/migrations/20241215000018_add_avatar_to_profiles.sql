-- Add avatar_url column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Update RLS policy to allow users to update avatar_url
-- The existing policy already allows users to update their own profile

