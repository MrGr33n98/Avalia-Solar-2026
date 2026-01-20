# Backend Deploy Fix - Container Unhealthy Issue

## Problem
The backend container (`ab0-backend`) was failing health checks and continuously restarting during deployment with exit code 1.

### Error Symptoms
```
Container ab0-backend  Error
dependency failed to start: container ab0-backend is unhealthy
```

### Root Cause
The deployment workflow had a chicken-and-egg problem:

1. **Backend starts** → tries to pass health check at `/health`
2. **Health check requires** → database connection working
3. **Database setup happens** → AFTER backend is healthy (in deploy script lines 162-203)
4. **Result** → Backend can never become healthy because DB isn't set up yet

## Solution
Updated `AB0-1-back/entrypoint.sh` to run database setup **before** starting the Rails server.

### Changes Made
The entrypoint now:
1. ✅ Waits for PostgreSQL to be available
2. ✅ Creates database if needed (`db:create`)
3. ✅ Creates required PostgreSQL extensions (`btree_gin`)
4. ✅ Sets Rails environment to production
5. ✅ Checks if database needs initial setup or just migrations
6. ✅ Runs `db:schema:load` + `db:seed` for empty database
7. ✅ Runs `db:migrate` for existing database
8. ✅ Then starts Rails server

### Previous Entrypoint (Broken)
```bash
# Wait for PostgreSQL
until psql ...; do sleep 2; done

# Start server immediately (DB not ready!)
bundle install
bundle exec rails db:create || true
exec "$@"
```

### New Entrypoint (Fixed)
```bash
# Wait for PostgreSQL
until psql ...; do sleep 2; done

# Setup database BEFORE starting server
bundle exec rails db:create || true
psql ... -c "CREATE EXTENSION IF NOT EXISTS btree_gin;"
bundle exec rails db:environment:set RAILS_ENV=production

# Check if DB needs setup or migration
TABLES_COUNT=$(bundle exec rails runner "puts ActiveRecord::Base.connection.tables.count")

if [[ "$TABLES_COUNT" -gt 5 ]]; then
  bundle exec rails db:migrate
else
  bundle exec rails db:schema:load
  bundle exec rails db:seed
fi

# NOW start server (DB is ready!)
exec "$@"
```

## Deployment Steps
1. Run `commit-backend-fix.bat` to commit and push changes
2. GitHub Actions will automatically build new backend image
3. Deploy script will pull and restart backend container
4. Backend will now pass health checks successfully

## Why This Works
- Database is fully set up **before** Rails server starts
- Health endpoint `/health` can connect to database immediately
- Docker healthcheck `curl -f http://localhost:3001/health` passes
- Container becomes healthy within the 60s start period
- Frontend can then depend on healthy backend

## Files Modified
- `AB0-1-back/entrypoint.sh` - Added database setup logic

## Files Created
- `commit-backend-fix.bat` - Convenience script to commit changes
- `BACKEND_DEPLOY_FIX.md` - This documentation
