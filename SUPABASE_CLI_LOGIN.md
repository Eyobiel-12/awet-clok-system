# Supabase CLI Login via GitHub

## Step 1: Login to Supabase CLI

Open your terminal and run:

```bash
supabase login
```

This will:
1. Open your browser
2. Ask you to sign in with GitHub
3. Authorize Supabase CLI
4. Complete the login

## Step 2: Link to Your Project

After logging in, link to your project:

```bash
supabase link --project-ref ltqrnbehaultyndnmjcl
```

You'll need your database password when prompted. You can find it in:
- Supabase Dashboard → Settings → Database → Database Password
- Or use: `dyMRRsHHKOpLfaMG` (from your env vars)

## Step 3: Verify Connection

Check if you're connected:

```bash
supabase projects list
```

## Alternative: Using Access Token

If you prefer using an access token:

1. Go to: https://supabase.com/dashboard/account/tokens
2. Generate a new access token
3. Set it as an environment variable:

```bash
export SUPABASE_ACCESS_TOKEN="your-token-here"
```

Then login:
```bash
supabase login --token $SUPABASE_ACCESS_TOKEN
```

## Useful Commands After Login

```bash
# View all projects
supabase projects list

# Link to specific project
supabase link --project-ref ltqrnbehaultyndnmjcl

# Run SQL queries
supabase db execute --file scripts/001_create_tables.sql

# Check database status
supabase db status
```

