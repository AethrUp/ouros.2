# Vercel Deployment Guide

## Environment Variables

Before deploying, you need to set up the following environment variables in your Vercel project settings:

### Required Variables:

1. **NEXT_PUBLIC_SUPABASE_URL**
   - Your Supabase project URL
   - Format: `https://xxxxx.supabase.co`

2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   - Your Supabase anonymous/public key
   - Found in: Supabase Dashboard → Settings → API

3. **NEXT_PUBLIC_ANTHROPIC_API_KEY**
   - Your Anthropic API key for Claude
   - Get it from: https://console.anthropic.com/

### Optional Variables:

4. **NEXT_PUBLIC_GOOGLE_MAPS_API_KEY** (if using location features)
   - Google Maps API key
   - Get it from: https://console.cloud.google.com/

## Deployment Steps

### 1. Via Vercel Dashboard (Recommended)

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New..." → "Project"
3. Import `AethrUp/ouros.2` repository
4. Configure the project:
   - **Git Branch**: `web-migration`
   - **Root Directory**: `web`
   - **Framework Preset**: Next.js
5. Add environment variables (see above)
6. Click "Deploy"

### 2. Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to the web directory
cd web

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

## Important Notes

- The `web-migration` branch will be automatically deployed on every push
- Preview deployments are created for pull requests
- You can view deployment logs in the Vercel dashboard
- Make sure all environment variables are set before the first deployment

## Troubleshooting

If deployment fails:
1. Check that all required environment variables are set
2. Verify the root directory is set to `web`
3. Check the build logs in Vercel dashboard
4. Ensure `package.json` has correct scripts

## Post-Deployment

After successful deployment:
1. Test all API routes
2. Verify Supabase connection
3. Test authentication flows
4. Check that environment variables are working correctly
