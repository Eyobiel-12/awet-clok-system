# Setup Guide - Fix Dashboard Rendering Issue

## Problem: Dashboard keeps rendering

This usually happens when:
1. Database tables haven't been created
2. Your profile wasn't created automatically
3. Restaurant location table is missing

## Step 1: Check Your User Role in Supabase

### Option A: Via Supabase Dashboard (Easiest)

1. Go to: https://supabase.com/dashboard/project/ltqrnbehaultyndnmjcl
2. Click on **"Authentication"** in the left sidebar
3. Click on **"Users"** tab
4. Find your email address
5. Click on your user to see details
6. Check the **"User Metadata"** section - you should see:
   - `name`: Your name
   - `role`: "worker" (default) or "admin"

### Option B: Via SQL Editor

1. Go to **"SQL Editor"** in Supabase dashboard
2. Run this query to see all users:

```sql
SELECT 
  id,
  email,
  created_at,
  raw_user_meta_data->>'name' as name,
  raw_user_meta_data->>'role' as role
FROM auth.users
ORDER BY created_at DESC;
```

## Step 2: Check if Your Profile Exists

Run this in SQL Editor (replace with your email):

```sql
SELECT 
  u.email,
  p.name,
  p.role,
  p.created_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'YOUR_EMAIL_HERE';
```

**If the profile is NULL**, that's the problem! Continue to Step 3.

## Step 3: Set Up Database Tables

### Run These SQL Scripts in Order:

1. **First**: Run `scripts/001_create_tables.sql`
   - Creates all tables (profiles, restaurant, shifts)
   - Sets up Row Level Security policies

2. **Second**: Run `scripts/002_profile_trigger.sql`
   - Creates the trigger that auto-creates profiles for new users

3. **Third**: If you already registered before running the scripts, run `scripts/fix_missing_profile.sql`
   - This creates profiles for existing users who don't have one

## Step 4: Make Yourself Admin (Optional)

If you want to be an admin, run this in SQL Editor (replace with your email):

```sql
UPDATE profiles
SET role = 'admin'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL_HERE'
);
```

## Step 5: Verify Restaurant Location Exists

Run this to check:

```sql
SELECT * FROM restaurant;
```

If it's empty, the default location should have been created by `001_create_tables.sql`. If not, run:

```sql
INSERT INTO restaurant (name, lat, lng, radius_m)
VALUES ('Massawa Restaurant', 52.3676, 4.9041, 100)
ON CONFLICT DO NOTHING;
```

## Your User Role

- **Default**: When you register, you become a **"worker"** by default
- **Admin**: Can access `/admin` page, manage all users and shifts
- **Worker**: Can only access `/dashboard`, clock in/out, view own shifts

## After Fixing

1. Clear your browser cache or use incognito mode
2. Log out and log back in
3. The dashboard should load properly

## Still Having Issues?

Check the browser console (F12) and terminal for error messages. Common issues:
- Missing environment variables (check `.env.local`)
- Database connection issues
- RLS policies blocking access

