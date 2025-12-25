-- Ensure restaurant table has at least one entry
-- This migration ensures the default restaurant location exists

INSERT INTO restaurant (name, lat, lng, radius_m)
VALUES ('Massawa Restaurant', 52.3676, 4.9041, 100)
ON CONFLICT DO NOTHING;

-- If the table is empty, insert the default location
-- (ON CONFLICT won't work if there's no unique constraint, so we check first)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM restaurant LIMIT 1) THEN
    INSERT INTO restaurant (name, lat, lng, radius_m)
    VALUES ('Massawa Restaurant', 52.3676, 4.9041, 100);
  END IF;
END $$;



