-- Fix duplicate restaurant entries
-- Keep only one restaurant and delete the rest

-- Delete all but one restaurant (keep the first one by id)
WITH ranked_restaurants AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY id) as rn
  FROM restaurant
)
DELETE FROM restaurant
WHERE id IN (
  SELECT id FROM ranked_restaurants WHERE rn > 1
);

-- Verify only one restaurant exists
DO $$
DECLARE
  restaurant_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO restaurant_count FROM restaurant;
  IF restaurant_count > 1 THEN
    -- If still multiple, delete all and insert one fresh
    DELETE FROM restaurant;
    INSERT INTO restaurant (name, lat, lng, radius_m)
    VALUES ('Massawa Restaurant', 52.0907, 5.1214, 100);
  ELSIF restaurant_count = 0 THEN
    -- If none exist, insert one
    INSERT INTO restaurant (name, lat, lng, radius_m)
    VALUES ('Massawa Restaurant', 52.0907, 5.1214, 100);
  END IF;
END $$;

