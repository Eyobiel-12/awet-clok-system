-- Enable realtime for shifts table so admins can see live updates
ALTER PUBLICATION supabase_realtime ADD TABLE shifts;

-- Verify realtime is enabled
SELECT 
  schemaname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime' AND tablename = 'shifts';



