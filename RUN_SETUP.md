# Database Setup - Quick Guide

## ✅ You're Now Connected!

You've successfully:
- ✅ Logged in to Supabase CLI via GitHub
- ✅ Linked to your project (ltqrnbehaultyndnmjcl)

## Next Steps: Run Database Setup Scripts

Since you're connected via CLI, you have two options:

### Option 1: Use Supabase Dashboard SQL Editor (Recommended)

1. Go to: https://supabase.com/dashboard/project/ltqrnbehaultyndnmjcl/sql/new
2. Run these scripts **in order**:

   **Step 1:** Copy and paste `scripts/001_create_tables.sql` → Click "Run"
   
   **Step 2:** Copy and paste `scripts/002_profile_trigger.sql` → Click "Run"
   
   **Step 3:** Copy and paste `scripts/fix_missing_profile.sql` → Click "Run"

### Option 2: Use psql (if you have direct database access)

```bash
# Set your database password
export PGPASSWORD="dyMRRsHHKOpLfaMG"

# Run the scripts
psql -h db.ltqrnbehaultyndnmjcl.supabase.co -U postgres -d postgres -f scripts/001_create_tables.sql
psql -h db.ltqrnbehaultyndnmjcl.supabase.co -U postgres -d postgres -f scripts/002_profile_trigger.sql
psql -h db.ltqrnbehaultyndnmjcl.supabase.co -U postgres -d postgres -f scripts/fix_missing_profile.sql
```

## Verify Setup

After running the scripts, check if tables exist:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'restaurant', 'shifts');
```

You should see:
- profiles
- restaurant  
- shifts

## Check Your User

Run this to see your user and role:

```sql
SELECT 
  u.email,
  p.name,
  p.role,
  p.created_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
ORDER BY u.created_at DESC;
```

## Make Yourself Admin (Optional)

If you want admin access:

```sql
UPDATE profiles
SET role = 'admin'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'Eyobielgoitom10@gmail.com'
);
```

## After Setup

1. Refresh your app at http://localhost:3000
2. Log out and log back in
3. The dashboard should work properly!



