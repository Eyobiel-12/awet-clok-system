-- Verify storage bucket and policies are set up correctly
-- Run this in Supabase SQL Editor

-- Check if bucket exists
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets
WHERE id = 'avatars';

-- Check storage policies
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%avatar%'
ORDER BY policyname;

-- If bucket doesn't exist, create it:
-- Go to Supabase Dashboard > Storage > New Bucket
-- Name: avatars
-- Public: true
-- File size limit: 5MB
-- Allowed MIME types: image/jpeg, image/png, image/gif, image/webp



