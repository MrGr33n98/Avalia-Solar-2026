# Server Action Error Fix Guide

## Problem
```
Error: Failed to find Server Action "sugoi". This request might be from an older or newer deployment.
Error: Failed to find Server Action "x". This request might be from an older or newer deployment.
```

## Root Cause
This error occurs when:
1. **Build cache mismatch** - The client bundle references Server Actions from an old build
2. **Deployment inconsistency** - Client and server are running different build versions
3. **Stale manifests** - Next.js Server Actions manifest is outdated

## Solution

### Quick Fix (Recommended)
Run the automated fix script:

**Windows:**
```bash
fix-server-actions.bat
```

**Linux/Mac:**
```bash
chmod +x fix-server-actions.sh
./fix-server-actions.sh
```

### Manual Fix

1. **Stop all containers:**
```bash
cd AB0-1-front
docker-compose down
```

2. **Clean all Next.js caches:**
```bash
# Remove build artifacts
rm -rf .next
rm -rf .swc
rm -rf node_modules/.cache
rm -rf .cache

# Optional: Clean Docker build cache
docker builder prune -f
```

3. **Rebuild without cache:**
```bash
docker-compose build --no-cache ab0-frontend
```

4. **Restart services:**
```bash
docker-compose up -d
```

5. **Monitor logs:**
```bash
docker-compose logs -f ab0-frontend
```

### Production Deployment Fix

For production at api.avaliasolar.com.br:

1. **SSH into server:**
```bash
ssh root@your-server-ip
cd ~/Avalia-Solar-2026
```

2. **Pull latest changes:**
```bash
git pull origin main
```

3. **Clean rebuild:**
```bash
cd AB0-1-front
docker-compose down
rm -rf .next .swc .cache node_modules/.cache
docker-compose build --no-cache ab0-frontend
docker-compose up -d
```

4. **Verify fix:**
```bash
# Check logs for errors
docker-compose logs -f ab0-frontend | grep -i "server action"

# Should see no more errors
```

## Prevention

### 1. Consistent Build IDs
The `next.config.js` has been updated to use stable build IDs:
```javascript
const stableBuildId = process.env.GIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || process.env.SOURCE_VERSION;
```

Set this in your deployment:
```bash
export GIT_SHA=$(git rev-parse HEAD)
```

### 2. Server Actions Configuration
Added in `next.config.js`:
```javascript
experimental: {
  serverActions: {
    bodySizeLimit: '2mb',
  },
}
```

### 3. Clear Browser Cache
After deployment, users should:
- Hard reload: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Or clear browser cache

### 4. Docker Build Best Practices

Always build with environment variables:
```dockerfile
# In Dockerfile
ARG GIT_SHA
ENV GIT_SHA=$GIT_SHA
```

Build command:
```bash
docker build --build-arg GIT_SHA=$(git rev-parse HEAD) -t ab0-frontend .
```

## Verification

After applying the fix, verify:

1. **No errors in logs:**
```bash
docker-compose logs ab0-frontend | grep -i "error\|failed"
```

2. **Page loads correctly:**
```bash
curl -I https://api.avaliasolar.com.br/admin/saas_leads
```

3. **Browser console clean:**
   - Open https://api.avaliasolar.com.br/admin/saas_leads
   - Check browser console (F12) - should have no Server Action errors

## Additional Notes

- **Server Actions** are only used when you have `'use server'` directives
- This project currently has **no server actions**, so errors are from stale cache
- The fix ensures fresh builds going forward
- Consider adding `X-Release` header to track deployments (already added in config)

## Related Issues

- Next.js Issue: https://github.com/vercel/next.js/issues/58158
- Server Actions Docs: https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations

---
**Last Updated:** 2026-03-13  
**Status:** ✅ Fixed with clean rebuild
