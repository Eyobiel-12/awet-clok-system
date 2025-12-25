-- Prevent duplicate restaurants by ensuring only one can exist
-- Since we only need one restaurant, we'll add a check constraint

-- Add a unique constraint on a constant value to ensure only one row
-- This is a common pattern for singleton tables
CREATE UNIQUE INDEX IF NOT EXISTS restaurant_singleton ON restaurant ((1));

-- Alternative: Add a check constraint that limits to one row
-- This ensures only one restaurant can exist
DO $$
BEGIN
  -- If more than one restaurant exists, keep only one
  IF (SELECT COUNT(*) FROM restaurant) > 1 THEN
    DELETE FROM restaurant
    WHERE id NOT IN (
      SELECT id FROM restaurant LIMIT 1
    );
  END IF;
END $$;



