-- Fix admin role for Eyobielgoitom10@gmail.com (case insensitive)
-- First, check if profile exists
SELECT 
  u.email,
  u.id,
  p.name,
  p.role,
  p.id as profile_id
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE LOWER(u.email) = LOWER('Eyobielgoitom10@gmail.com');

-- Update or create profile with admin role
-- First, get the user ID
DO $$
DECLARE
  user_uuid UUID;
  profile_exists BOOLEAN;
BEGIN
  -- Get user ID (case insensitive)
  SELECT id INTO user_uuid
  FROM auth.users
  WHERE LOWER(email) = LOWER('Eyobielgoitom10@gmail.com')
  LIMIT 1;

  IF user_uuid IS NULL THEN
    RAISE NOTICE 'User not found';
    RETURN;
  END IF;

  -- Check if profile exists
  SELECT EXISTS(SELECT 1 FROM profiles WHERE id = user_uuid) INTO profile_exists;

  IF profile_exists THEN
    -- Update existing profile
    UPDATE profiles
    SET role = 'admin'
    WHERE id = user_uuid;
    RAISE NOTICE 'Profile updated to admin for user: %', user_uuid;
  ELSE
    -- Create new profile with admin role
    INSERT INTO profiles (id, name, role)
    VALUES (
      user_uuid,
      COALESCE(
        (SELECT raw_user_meta_data->>'name' FROM auth.users WHERE id = user_uuid),
        'Admin User'
      ),
      'admin'
    );
    RAISE NOTICE 'Profile created with admin role for user: %', user_uuid;
  END IF;
END $$;

-- Verify the update
SELECT 
  u.email,
  u.id,
  p.name,
  p.role,
  p.created_at
FROM auth.users u
JOIN profiles p ON u.id = p.id
WHERE LOWER(u.email) = LOWER('Eyobielgoitom10@gmail.com');

