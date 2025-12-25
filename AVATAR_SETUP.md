# Avatar Storage Setup Guide

## Probleem: Avatar verdwijnt na refresh

Als je avatar verdwijnt na een refresh, betekent dit meestal dat de storage bucket niet correct is ingesteld.

## Stap 1: Maak Storage Bucket aan in Supabase Dashboard

1. Ga naar: https://supabase.com/dashboard/project/ltqrnbehaultyndnmjcl/storage/buckets
2. Klik op **"New bucket"**
3. Vul in:
   - **Name**: `avatars`
   - **Public bucket**: ✅ (aanzetten)
   - **File size limit**: `5242880` (5MB)
   - **Allowed MIME types**: `image/jpeg,image/png,image/gif,image/webp`
4. Klik **"Create bucket"**

## Stap 2: Verifieer Storage Policies

De policies zijn al aangemaakt via de migratie. Je kunt ze verifiëren door:

1. Ga naar: https://supabase.com/dashboard/project/ltqrnbehaultyndnmjcl/storage/policies
2. Zoek naar policies met "avatar" in de naam
3. Zorg dat deze policies bestaan:
   - "Authenticated users can upload avatars"
   - "Authenticated users can update avatars"
   - "Authenticated users can delete avatars"
   - "Public can view avatars"

## Stap 3: Test Avatar Upload

1. Ga naar `/dashboard/profile`
2. Upload een foto
3. Controleer of de foto verschijnt
4. Refresh de pagina
5. De foto zou moeten blijven staan

## Stap 4: Verifieer Database

Run dit in Supabase SQL Editor om te controleren of avatar_url wordt opgeslagen:

```sql
SELECT id, name, avatar_url, created_at
FROM profiles
WHERE id = auth.uid();
```

De `avatar_url` kolom zou een URL moeten bevatten zoals:
`https://ltqrnbehaultyndnmjcl.supabase.co/storage/v1/object/public/avatars/[user-id]-[timestamp].jpg`

## Troubleshooting

### Avatar verdwijnt na refresh
- **Oorzaak**: Storage bucket bestaat niet of is niet public
- **Oplossing**: Maak bucket aan via Supabase Dashboard (zie Stap 1)

### Upload mislukt
- **Oorzaak**: Storage policies zijn niet correct
- **Oplossing**: Run de migratie opnieuw of maak policies handmatig aan

### Avatar URL is NULL in database
- **Oorzaak**: Upload is mislukt maar geen error getoond
- **Oplossing**: Check browser console voor errors, verify bucket exists

### Avatar laadt niet
- **Oorzaak**: Bucket is niet public of URL is incorrect
- **Oplossing**: Zorg dat bucket "Public" is, check URL format

## Handmatig Bucket Aanmaken via SQL

Als de bucket niet via de dashboard kan worden aangemaakt, run dit in SQL Editor:

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET 
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
```



