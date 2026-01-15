# ✅ CI/CD Fix Checklist

## Quick Action Items

### 1️⃣ Add GitHub Secrets (CRITICAL)

#### Required for Backend Build:
```
Repository Settings → Secrets and variables → Actions → New repository secret
```

**RAILS_MASTER_KEY**
- Value: Content of `AB0-1-back/config/master.key`
- Get it: `cat AB0-1-back/config/master.key`
- ⚠️ CRITICAL: Without this, app won't access encrypted credentials at runtime

#### Optional for Frontend Monitoring:
- `SENTRY_AUTH_TOKEN` - Source map uploads
- `SENTRY_ORG` - Your Sentry organization
- `SENTRY_PROJECT` - Your Sentry project

---

### 2️⃣ Commit & Push Changes

```bash
git status
git add .
git commit -m "fix: Resolve CI/CD build failures for frontend and backend

- Make Sentry configuration optional in frontend
- Fix Rails asset precompilation with conditional RAILS_MASTER_KEY
- Update GitHub Actions workflow to handle missing secrets
- Improve postbuild script error handling"

git push origin main
```

---

### 3️⃣ Monitor Build

1. Go to GitHub → **Actions** tab
2. Find "Enterprise Deploy - Avalia Solar" workflow
3. Watch for:
   - ✅ `build-and-push (frontend)` - Should complete in ~5-10 mins
   - ✅ `build-and-push (backend)` - Should complete in ~3-5 mins
   - ✅ `deploy` - Should complete in ~2-3 mins

---

### 4️⃣ Verify Deployment

After successful pipeline:

```bash
# SSH to your VM
ssh user@your-vm

# Check containers are running
docker ps

# Check logs
docker compose logs -f backend
docker compose logs -f frontend

# Test endpoints
curl http://localhost:3001/health
curl http://localhost:3000
```

---

## 🔍 Expected Build Output

### Frontend Build (should see):
```
✅ Using provided SENTRY credentials for source maps
  OR
⚠️  Building without Sentry credentials - skipping source maps
```

```
✅ Copied static assets to .next/standalone/.next/static
```

### Backend Build (should see):
```
✅ Using provided RAILS_MASTER_KEY for asset compilation
  OR
⚠️  No RAILS_MASTER_KEY provided - using dummy SECRET_KEY_BASE
```

```
✅ Asset precompilation complete
```

---

## ❌ If Builds Still Fail

### Frontend Issues:
1. Clear GitHub Actions cache:
   ```
   Actions → Caches → Delete frontend cache
   ```

2. Check for TypeScript errors:
   ```bash
   cd AB0-1-front
   npm run build
   ```

### Backend Issues:
1. Verify `RAILS_MASTER_KEY` secret:
   - Must be exactly 32 hex characters
   - No newlines or spaces
   - Matches your local `config/master.key`

2. Test locally:
   ```bash
   cd AB0-1-back
   RAILS_ENV=production SECRET_KEY_BASE=$(openssl rand -hex 64) bundle exec rake assets:precompile
   ```

---

## 📞 Quick Reference

| Issue | File | Fix |
|-------|------|-----|
| Sentry build error | `next.config.js` | Made Sentry optional |
| Postbuild script fails | `postbuild-copy-static.js` | Graceful error handling |
| Backend secret_key_base | `Dockerfile.backend` | Conditional RAILS_MASTER_KEY |
| Workflow secrets | `deploy-v1.yml` | Added conditional checks |

---

## 🎯 Success Criteria

✅ Frontend builds without errors  
✅ Backend builds without errors  
✅ Both images pushed to GHCR  
✅ Deploy job completes  
✅ Containers start on VM  
✅ Health checks pass  
✅ Application is accessible  

---

## 🚀 Ready to Deploy!

After completing steps 1-2 above, the pipeline should automatically:
1. Build frontend and backend in parallel
2. Push images to GitHub Container Registry
3. SSH to your VM
4. Pull and deploy new images
5. Run database migrations
6. Complete successfully

**Time estimate**: 10-15 minutes total

---

## 📚 Full Documentation

- `CI_CD_BUILD_FIXES.md` - Complete overview
- `FRONTEND_BUILD_FIX.md` - Frontend details
- `BACKEND_BUILD_FIX.md` - Backend details
