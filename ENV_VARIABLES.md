w# Your Environment Variables for Deployment

## ✅ Required Variables (Copy these to your deployment platform)

```env
NEXT_PUBLIC_SUPABASE_URL=https://ltqrnbehaultyndnmjcl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0cXJuYmVoYXVsdHluZG5tamNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3NzYxNzIsImV4cCI6MjA4MTM1MjE3Mn0.lZ7rTN8bhgPA4UZNiT8BnP3KFYJ_NsnfnQ1g5R-rJvE
```

## 🔐 Optional: Service Role Key (for admin features)

```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0cXJuYmVoYXVsdHluZG5tamNsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTc3NjE3MiwiZXhwIjoyMDgxMzUyMTcyfQ.yrJrrroVQEW5mjJwyBNvKzSque3FWHlA3uS2MC9NnIQ
```

## 🚀 How to Add to Vercel

1. Go to your Vercel project: https://vercel.com/dashboard
2. Click on your project
3. Go to **Settings** → **Environment Variables**
4. Add each variable:
   - **Name**: `NEXT_PUBLIC_SUPABASE_URL`
   - **Value**: `https://ltqrnbehaultyndnmjcl.supabase.co`
   - **Environment**: Production, Preview, Development (select all)
5. Repeat for `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. (Optional) Add `SUPABASE_SERVICE_ROLE_KEY` if needed

## 📋 Quick Copy-Paste for Vercel

### Variable 1:
- **Name**: `NEXT_PUBLIC_SUPABASE_URL`
- **Value**: `https://ltqrnbehaultyndnmjcl.supabase.co`

### Variable 2:
- **Name**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0cXJuYmVoYXVsdHluZG5tamNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3NzYxNzIsImV4cCI6MjA4MTM1MjE3Mn0.lZ7rTN8bhgPA4UZNiT8BnP3KFYJ_NsnfnQ1g5R-rJvE`

### Variable 3 (Optional):
- **Name**: `SUPABASE_SERVICE_ROLE_KEY`
- **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0cXJuYmVoYXVsdHluZG5tamNsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTc3NjE3MiwiZXhwIjoyMDgxMzUyMTcyfQ.yrJrrroVQEW5mjJwyBNvKzSque3FWHlA3uS2MC9NnIQ`

## 🔗 Your Supabase Project

- **Project URL**: https://supabase.com/dashboard/project/ltqrnbehaultyndnmjcl
- **API Settings**: https://supabase.com/dashboard/project/ltqrnbehaultyndnmjcl/settings/api

## ⚠️ Important Notes

- ✅ These variables are already in your `.env.local` file
- ✅ `NEXT_PUBLIC_*` variables are safe to expose (public keys)
- ❌ Never commit `.env.local` to git (it's in `.gitignore`)
- 🔒 Service Role Key should be kept secret (only use server-side)



