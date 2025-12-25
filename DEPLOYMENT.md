# Deployment Guide

This guide will help you deploy the Time Tracking System to production.

## 🚀 Quick Deploy to Vercel (Recommended)

Vercel is the easiest way to deploy Next.js applications.

### Step 1: Prepare Your Repository

1. Make sure all code is pushed to GitHub
2. Verify `.env.example` exists in the repository

### Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click **"Add New Project"**
4. Import your repository: `Eyobiel-12/awet-clok-system`
5. Configure the project:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)

### Step 3: Add Environment Variables

In Vercel project settings, add these environment variables:

#### Required Variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

#### Optional Variables (for admin features):

```env
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### Step 4: Get Your Supabase Credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (optional)

### Step 5: Deploy

1. Click **"Deploy"**
2. Wait for the build to complete (~2-3 minutes)
3. Your app will be live at: `https://your-project.vercel.app`

## 📋 Environment Variables Reference

### Required Variables

| Variable | Description | Where to Find |
|----------|-------------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anonymous key (safe to expose) | Supabase Dashboard → Settings → API |

### Optional Variables

| Variable | Description | When Needed |
|----------|-------------|-------------|
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (keep secret!) | Only for admin operations |
| `POSTGRES_URL` | Direct database connection | Only for CLI operations |

## 🔒 Security Notes

1. **Never commit `.env.local` or `.env` files** - They're in `.gitignore`
2. **`NEXT_PUBLIC_*` variables** are exposed to the browser - only use safe keys
3. **Service Role Key** should NEVER be in `NEXT_PUBLIC_*` variables
4. **Always use environment variables** in production, never hardcode secrets

## 🌐 Other Deployment Platforms

### Netlify

1. Connect your GitHub repository
2. Build command: `npm run build`
3. Publish directory: `.next`
4. Add environment variables in Site Settings

### Railway

1. Create new project from GitHub
2. Add environment variables
3. Railway auto-detects Next.js and deploys

### AWS Amplify

1. Connect repository
2. Build settings:
   - Build command: `npm run build`
   - Output directory: `.next`
3. Add environment variables

### Self-Hosted (Docker)

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

Then:

```bash
docker build -t time-tracking-system .
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=... \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
  time-tracking-system
```

## ✅ Post-Deployment Checklist

After deploying, make sure to:

- [ ] Test authentication (login/signup)
- [ ] Verify database connection
- [ ] Test clock in/out functionality
- [ ] Check mobile responsiveness
- [ ] Verify PWA installation works
- [ ] Test admin dashboard (if applicable)
- [ ] Set up custom domain (optional)
- [ ] Enable HTTPS (automatic on Vercel/Netlify)
- [ ] Configure CORS in Supabase (if needed)

## 🔧 Supabase Configuration

### 1. Update Allowed URLs

In Supabase Dashboard → Authentication → URL Configuration:

- Add your production URL: `https://your-app.vercel.app`
- Add your domain if using custom domain

### 2. Configure Email Templates

- Go to Authentication → Email Templates
- Customize email templates if needed
- Test password reset flow

### 3. Set Up Storage Bucket

Make sure the `avatars` bucket exists:

1. Go to Storage in Supabase Dashboard
2. Create bucket named `avatars`
3. Set as public
4. Configure policies (see `AVATAR_SETUP.md`)

## 🐛 Troubleshooting

### Build Fails

- Check environment variables are set correctly
- Verify Node.js version (18+)
- Check build logs for specific errors

### Database Connection Issues

- Verify Supabase URL and keys are correct
- Check Supabase project is active
- Verify RLS policies are set up

### Authentication Not Working

- Check allowed URLs in Supabase
- Verify redirect URLs are correct
- Check browser console for errors

## 📞 Support

If you encounter issues:

1. Check the [README.md](README.md) for setup instructions
2. Review [TEST_RESULTS.md](TEST_RESULTS.md) for known issues
3. Check Supabase logs in dashboard
4. Review Vercel build logs

---

**Happy Deploying! 🚀**



