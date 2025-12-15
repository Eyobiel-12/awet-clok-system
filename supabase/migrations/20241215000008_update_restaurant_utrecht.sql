-- Update restaurant location to Massawa Restaurant in Utrecht
-- Address: Amsterdamsestraatweg 54, 3513 AG Utrecht, Netherlands
-- Coordinates for Utrecht (approximate - can be fine-tuned in admin panel)

UPDATE restaurant
SET 
  name = 'Massawa Restaurant',
  lat = 52.0907,
  lng = 5.1214,
  radius_m = 100
WHERE id = (SELECT id FROM restaurant LIMIT 1);

-- If no restaurant exists, insert it
INSERT INTO restaurant (name, lat, lng, radius_m)
VALUES ('Massawa Restaurant', 52.0907, 5.1214, 100)
ON CONFLICT DO NOTHING;

