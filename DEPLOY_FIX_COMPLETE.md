# Deploy Workflow Fix Summary

## Issues Fixed

### 1. Migration Timestamp Error
**Problem:** Migration file `202512280001_add_effect_to_companies.rb` had an incorrect timestamp that sorted it BEFORE the `create_companies` migration, causing Rails to try adding a column to a non-existent table.

**Solution:** Created new migration with correct timestamp: `20260115220000_add_effect_to_companies.rb`

**Action Required:** Delete the old migration file by running:
```bash
del "C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-back\db\migrate\202512280001_add_effect_to_companies.rb"
```

### 2. Docker Build Workflow Error
**Problem:** The `build-args` in the GitHub Actions workflow were malformed, causing the Docker build to fail or images not to be pushed to the registry properly.

**Root Causes:**
- Conditional build-args were creating empty strings
- Using a single conditional expression for all build-args instead of separating them by component
- The `docker/build-push-action` requires multi-line format for build-args

**Solution:** 
- Split the build step into two separate steps: one for backend, one for frontend
- Each step has its own conditional (`if: matrix.component == 'backend'` or `'frontend'`)
- Build-args are now properly formatted as multi-line YAML

## Files Modified

1. **`.github/workflows/deploy-v1.yml`** - Fixed Docker build configuration
2. **`db/migrate/20260115220000_add_effect_to_companies.rb`** - Created with correct timestamp

## Next Steps

1. Delete the old migration file (see command above)
2. Commit and push these changes
3. The deployment should now work correctly:
   - Build job will build and push images to GitHub Container Registry
   - Deploy job will pull the images and deploy them

## How It Works Now

```
GitHub Actions Workflow:
1. build-and-push job (runs in parallel for backend and frontend)
   - Checks out code
   - Logs into GitHub Container Registry
   - Builds Docker image for backend with RAILS_MASTER_KEY
   - Builds Docker image for frontend with Next.js environment variables
   - Pushes images to ghcr.io/mrgr33n98/avalia-solar-2026-{component}:latest

2. deploy job (runs after build-and-push completes)
   - SSHs to server
   - Pulls new images from registry
   - Starts/restarts services with docker-compose
   - Runs database migrations
```

## Verification

After pushing, check:
1. GitHub Actions tab - both matrix jobs (backend, frontend) should complete successfully
2. GitHub Packages - images should appear at ghcr.io/mrgr33n98/avalia-solar-2026-backend:latest and frontend:latest
3. Deployment should complete without "manifest unknown" errors
