# Get Your Environment Variables

Based on your project, here are the steps to get your Supabase environment variables:

## 🔍 Your Supabase Project

**Project Reference**: `ltqrnbehaultyndnmjcl`

## 📋 Step-by-Step Instructions

### Step 1: Go to Supabase Dashboard

1. Open: https://supabase.com/dashboard/project/ltqrnbehaultyndnmjcl/settings/api
2. Or navigate: Dashboard → Your Project → Settings → API

### Step 2: Copy Your Variables

You'll see a section called **"Project API keys"** with:

#### Required Variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://ltqrnbehaultyndnmjcl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0cXJuYmVoYXVsdHluZG5tamNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3NzYxNzIsImV4cCI6MjA4MTM1MjE3Mn0.lZ7rTN8bhbPA4UZNiT8BnP3KFYJ_NsnfnQ1g5R-rJvE
```

#### Optional (for admin features):

```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0cXJuYmVoYXVsdHluZG5tamNsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTc3NjE3MiwiZXhwIjoyMDgxMzUyMTcyfQ.yrJrrroVQEW5mjJwyBNvKzSque3FWHlA3uS2MC9NnIQ
```

## 📝 Create Your .env.local File

Create a file named `.env.local` in the root directory:

```bash
cd /Users/eyobielgoitom/Downloads/time-tracking-system
nano .env.local
```

Then paste:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://ltqrnbehaultyndnmjcl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0cXJuYmVoYXVsdHluZG5tamNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3NzYxNzIsImV4cCI6MjA4MTM1MjE3Mn0.lZ7rTN8bhbPA4UZNiT8BnP3KFYJ_NsnfnQ1g5R-rJvE

# Optional: Service Role Key (for admin operations)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0cXJuYmVoYXVsdHluZG5tamNsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTc3NjE3MiwiZXhwIjoyMDgxMzUyMTcyfQ.yrJrrroVQEW5mjJwyBNvKzSque3FWHlA3uS2MC9NnIQ
```

## 🚀 For Deployment (Vercel/Netlify/etc.)

When deploying, add these same variables in your platform's environment variables settings:

1. **Vercel**: Project Settings → Environment Variables
2. **Netlify**: Site Settings → Environment Variables
3. **Railway**: Variables tab

## ⚠️ Important Notes

- ✅ `NEXT_PUBLIC_*` variables are safe to expose (they're public)
- ❌ `SUPABASE_SERVICE_ROLE_KEY` should NEVER be in `NEXT_PUBLIC_*` variables
- 🔒 Never commit `.env.local` to git (it's in `.gitignore`)

## 🔗 Quick Links

- **API Settings**: https://supabase.com/dashboard/project/ltqrnbehaultyndnmjcl/settings/api
- **Project Dashboard**: https://supabase.com/dashboard/project/ltqrnbehaultyndnmjcl
- **Database**: https://supabase.com/dashboard/project/ltqrnbehaultyndnmjcl/editor

