# Dashboard Error - Troubleshooting Guide

## Problem
When accessing `https://www.avaliasolar.com.br/dashboard?tab=trust-widget`, the error "Erro no Dashboard" appears.

## Root Cause
The error boundary in `/app/dashboard/error.tsx` is being triggered because API requests are failing.

## Quick Fix

### For Development (Local)

1. **Start the backend server:**
   ```bash
   cd AB0-1-back
   bundle exec rails server -p 3001
   ```

2. **Start the frontend server:**
   ```bash
   cd AB0-1-front
   npm run dev
   ```

3. **Or use the automated script:**
   ```bash
   start-dev.bat
   ```

### For Production (www.avaliasolar.com.br)

The production environment should have:

1. **Backend running** on `https://api.avaliasolar.com.br`
2. **Frontend running** on Vercel/similar platform
3. **Environment variables** properly configured

## Environment Variables Checklist

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
NEXT_PUBLIC_BROWSER_API_BASE_URL=/api/v1
API_PROXY_TARGET=http://localhost:3001
NODE_ENV=development
```

### Production Frontend (Vercel)
```env
NEXT_PUBLIC_API_BASE_URL=https://api.avaliasolar.com.br
NEXT_PUBLIC_BROWSER_API_BASE_URL=/api/v1
NODE_ENV=production
```

### Backend (.env.development)
```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/avaliasolar_dev

# Redis
REDIS_URL=redis://localhost:6379/1

# JWT Secret
JWT_SECRET_KEY=your-secret-key-here

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://www.avaliasolar.com.br
```

## Common Issues & Solutions

### 1. Backend Not Starting
**Symptoms:** Port 3001 not responding
**Solution:**
```bash
cd AB0-1-back
bundle install
rails db:migrate
rails server -p 3001
```

### 2. Frontend Not Starting
**Symptoms:** Port 3000 not responding, Next.js errors
**Solution:**
```bash
cd AB0-1-front
npm install
npm run dev
```

### 3. API Connection Errors
**Symptoms:** Network errors in browser console
**Solution:**
- Check `.env.local` has correct `NEXT_PUBLIC_API_BASE_URL`
- Verify backend is running on port 3001
- Check CORS settings in backend

### 4. Authentication Errors
**Symptoms:** 401 Unauthorized, redirect to login
**Solution:**
- Clear browser cookies
- Login again
- Check JWT token validity

### 5. Database Connection Errors
**Symptoms:** Backend fails to start, database errors
**Solution:**
```bash
# Check PostgreSQL is running
# Windows: Check Services
# Or run:
pg_ctl status

# Run migrations
cd AB0-1-back
rails db:create
rails db:migrate
```

## Diagnostic Commands

### Check if ports are in use
```bash
# Windows
netstat -ano | findstr :3000
netstat -ano | findstr :3001

# Check what process is using the port
netstat -ano | findstr :3001
# Then check task manager for the PID
```

### Test API endpoints directly
```bash
# Test backend health
curl http://localhost:3001/api/v1/health

# Test trust_health endpoint (requires auth)
curl http://localhost:3001/api/v1/company_dashboard/trust_health
```

### Check environment variables
```bash
# Frontend
cd AB0-1-front
node -e "console.log(process.env.NEXT_PUBLIC_API_BASE_URL)"

# Backend
cd AB0-1-back
rails runner "puts ENV['DATABASE_URL']"
```

## Browser Console Debugging

1. Open DevTools (F12)
2. Go to Console tab
3. Look for errors like:
   - `Failed to fetch`
   - `Network Error`
   - `401 Unauthorized`
   - `CORS policy`

4. Go to Network tab
5. Refresh page
6. Check failed requests to `/api/v1/*`

## Error Boundary Recovery

The dashboard has an error boundary that provides:
- **Recarregar Dashboard** - Retries loading
- **Ir para Home** - Goes to homepage
- Error details in development mode

## Trust Widget Tab Specific Issues

The `?tab=trust-widget` parameter loads the TrustWidgetDashboard component which:
- Displays widget configuration
- Shows live preview
- Generates embed code

If this tab specifically fails:
1. Check if `WidgetBadge` component loads
2. Verify `process.env.NEXT_PUBLIC_API_URL` is set
3. Check browser console for component errors

## Contact

If issues persist, check:
- Sentry dashboard for error logs
- Backend logs: `AB0-1-back/log/development.log`
- Frontend logs: Browser console + Next.js terminal
