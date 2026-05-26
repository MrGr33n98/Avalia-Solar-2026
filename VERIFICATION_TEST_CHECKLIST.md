# 🧪 SECURITY AUDIT VERIFICATION CHECKLIST

**Platform:** Avalia Solar - Multi-Tenant SaaS Dashboard  
**Audited Components:** Rails 8 API + React Frontend  
**Date:** 2026-05-26  

---

## TEST EXECUTION GUIDE

### Prerequisites
```bash
# 1. Setup test environment
cd AB0-1-back
bundle install
rails db:test:prepare

# 2. Create test data fixtures
rails db:seed:security_test_users
# Creates:
#   - free_user@test.com (Free plan, Company A)
#   - pro_user@test.com (Pro plan, Company B)  
#   - admin@test.com (Admin)
```

---

## ✅ CRITICAL VULNERABILITY TESTS

### TEST 1: IDOR - Unauthorized Company Update

**Vulnerability:** FIX #2 - `AB0-1-back/app/controllers/api/v1/companies_controller.rb`

**Test Command:**
```bash
#!/bin/bash

# Setup
FREE_EMAIL="free_user@test.com"
FREE_PASS="password123"
PRO_COMPANY_ID=2

# Get Free user token
FREE_TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$FREE_EMAIL\",\"password\":\"$FREE_PASS\"}" \
  | jq -r '.token')

echo "Free user token: ${FREE_TOKEN:0:20}..."

# Get initial company description
INITIAL=$(curl -s http://localhost:3000/api/v1/companies/$PRO_COMPANY_ID \
  -H "Authorization: Bearer $FREE_TOKEN" \
  | jq '.company.description')

echo "Initial description: $INITIAL"

# Attempt unauthorized update
RESPONSE=$(curl -s -w "\n%{http_code}" -X PATCH \
  "http://localhost:3000/api/v1/companies/$PRO_COMPANY_ID" \
  -H "Authorization: Bearer $FREE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "company": {
      "description": "HACKED BY FREE USER"
    }
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | head -n -1)

echo ""
echo "HTTP Status: $HTTP_CODE"
echo "Response Body: $BODY"

# Verify
FINAL=$(curl -s http://localhost:3000/api/v1/companies/$PRO_COMPANY_ID \
  -H "Authorization: Bearer $FREE_TOKEN" \
  | jq '.company.description')

echo "Final description: $FINAL"
echo ""
```

**Expected Results:**
- ✅ HTTP Status: **403** (NOT 200)
- ✅ Response code: **FORBIDDEN**
- ✅ Company description unchanged
- ✅ Server logs show: `[SecurityAudit-IDOR] Unauthorized update attempt`

**Pass Criteria:**
```
HTTP_CODE = 403
INITIAL == FINAL
BODY contains "Not authorized to manage this company"
```

**Failure Indicates:** IDOR vulnerability still exists

---

### TEST 2: Unauthorized Analytics Tracking

**Vulnerability:** FIX #3 - `AB0-1-back/app/controllers/api/v1/analytics_controller.rb`

**Test Command:**
```bash
#!/bin/bash

# Setup
FREE_EMAIL="free_user@test.com"
FREE_PASS="password123"
PRO_COMPANY_ID=2

# Get Free user token
FREE_TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$FREE_EMAIL\",\"password\":\"$FREE_PASS\"}" \
  | jq -r '.token')

# Count events for Pro company BEFORE attack
BEFORE=$(curl -s \
  "http://localhost:3000/api/v1/analytics/conversions?company_id=$PRO_COMPANY_ID" \
  -H "Authorization: Bearer $FREE_TOKEN" \
  | jq '.metrics | length')

echo "Events before attack: $BEFORE"

# Attempt to track event for unauthorized company
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  http://localhost:3000/api/v1/analytics/track \
  -H "Authorization: Bearer $FREE_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"company_id\": $PRO_COMPANY_ID,
    \"event_type\": \"lead_created\",
    \"properties\": {
      \"value\": 1000,
      \"source\": \"competitor_hack\"
    }
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | head -n -1)

echo ""
echo "Track response HTTP: $HTTP_CODE"
echo "Track response body: $BODY"

# Count events AFTER attempt
AFTER=$(curl -s \
  "http://localhost:3000/api/v1/analytics/conversions?company_id=$PRO_COMPANY_ID" \
  -H "Authorization: Bearer $FREE_TOKEN" \
  | jq '.metrics | length')

echo ""
echo "Events after attack: $AFTER"
echo ""
```

**Expected Results:**
- ✅ HTTP Status: **403** (NOT 200)
- ✅ Response code: **UNAUTHORIZED_COMPANY**
- ✅ Event NOT created
- ✅ Before count == After count
- ✅ Server logs show: `[SecurityAudit-Analytics] Unauthorized tracking`

**Pass Criteria:**
```
HTTP_CODE = 403
BEFORE == AFTER
BODY contains "Not authorized to track events"
```

---

### TEST 3: Dashboard Authorization Bypass

**Vulnerability:** FIX #4 - `AB0-1-back/app/controllers/api/v1/company_dashboard_controller.rb`

**Test Command:**
```bash
#!/bin/bash

# Setup
FREE_EMAIL="free_user@test.com"
FREE_PASS="password123"
FREE_COMPANY_ID=1
PRO_COMPANY_ID=2

# Get Free user token
FREE_TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$FREE_EMAIL\",\"password\":\"$FREE_PASS\"}" \
  | jq -r '.token')

# Try to access own company dashboard (should work)
OWNED_RESPONSE=$(curl -s -w "\n%{http_code}" \
  "http://localhost:3000/api/v1/company_dashboard/analytics/overview?id=$FREE_COMPANY_ID" \
  -H "Authorization: Bearer $FREE_TOKEN")

OWNED_HTTP=$(echo "$OWNED_RESPONSE" | tail -n 1)

echo "Accessing own company dashboard: HTTP $OWNED_HTTP"

# Try to access unauthorized company dashboard (should fail)
UNAUTHORIZED_RESPONSE=$(curl -s -w "\n%{http_code}" \
  "http://localhost:3000/api/v1/company_dashboard/analytics/overview?id=$PRO_COMPANY_ID" \
  -H "Authorization: Bearer $FREE_TOKEN")

UNAUTH_HTTP=$(echo "$UNAUTHORIZED_RESPONSE" | tail -n 1)
UNAUTH_BODY=$(echo "$UNAUTHORIZED_RESPONSE" | head -n -1)

echo "Accessing unauthorized company dashboard: HTTP $UNAUTH_HTTP"
echo ""
```

**Expected Results:**
- ✅ Own company: HTTP **200** (authorized)
- ✅ Other company: HTTP **403** (forbidden)
- ✅ Server logs: `[SecurityAudit-Dashboard] Unauthorized dashboard access`

**Pass Criteria:**
```
OWNED_HTTP = 200
UNAUTH_HTTP = 403
```

---

### TEST 4: Frontend Feature Gate Protection

**Vulnerability:** FIX #5 - `AB0-1-front/context/CompanyContext.tsx`

**Test Command (Browser Console):**
```javascript
// 1. Check current company from API
const response = await fetch('/api/v1/companies/mine', {
  headers: { 'Authorization': `Bearer ${getToken()}` }
});
const companies = await response.json();
console.log('API companies:', companies);

// 2. Try to manually edit localStorage
const fakeCompany = {
  id: 1,
  name: "Free Company",
  plan: "enterprise",  // ← FAKE: Set to enterprise
  features: ["analytics", "widget", "white_label", "api"]
};
localStorage.setItem('active_company', JSON.stringify(fakeCompany));

// 3. Refresh page
location.reload();

// 4. Check if API still authorizes features
const analyticsResponse = await fetch('/api/v1/company_dashboard/analytics/detailed', {
  headers: { 'Authorization': `Bearer ${getToken()}` }
});
const analyticsStatus = analyticsResponse.status;
console.log('Analytics endpoint status:', analyticsStatus);

// EXPECTED: 403 (backend validates actual plan, not localStorage)
// VULNERABLE: 200 OK (backend trusts client)
```

**Expected Results:**
- ✅ localStorage manipulation does NOT enable features
- ✅ API still enforces real plan from database
- ✅ Analytics endpoint returns **403** for Free plan users
- ✅ Feature access always validated by backend

**Pass Criteria:**
```
analyticsStatus = 403
```

---

## ⚠️ HIGH PRIORITY TESTS

### TEST 5: Race Condition in Profile Updates

**Vulnerability:** FIX #6 - Optimistic locking not implemented

**Test Command (requires lock_version fix):**
```bash
#!/bin/bash

# Setup
OWNER_EMAIL="free_user@test.com"
COMPANY_ID=1

# Get token
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$OWNER_EMAIL\",\"password\":\"password123\"}" \
  | jq -r '.token')

# Get current company with lock version
COMPANY=$(curl -s http://localhost:3000/api/v1/companies/$COMPANY_ID \
  -H "Authorization: Bearer $TOKEN")

LOCK_VERSION=$(echo $COMPANY | jq '._lock_version')
echo "Current lock version: $LOCK_VERSION"

# Simulate: Tab 1 saves
RESPONSE1=$(curl -s -w "\n%{http_code}" -X PATCH \
  "http://localhost:3000/api/v1/companies/$COMPANY_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"company\": {
      \"description\": \"Updated from Tab 1\",
      \"_lock_version\": $LOCK_VERSION
    }
  }")

HTTP1=$(echo "$RESPONSE1" | tail -n 1)
BODY1=$(echo "$RESPONSE1" | head -n -1)
NEW_LOCK=$(echo $BODY1 | jq '._lock_version')

echo "Tab 1 update: HTTP $HTTP1, new lock version: $NEW_LOCK"

# Simulate: Tab 2 saves with STALE lock version (race condition)
RESPONSE2=$(curl -s -w "\n%{http_code}" -X PATCH \
  "http://localhost:3000/api/v1/companies/$COMPANY_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"company\": {
      \"banner_url\": \"https://new-banner.jpg\",
      \"_lock_version\": $LOCK_VERSION
    }
  }")

HTTP2=$(echo "$RESPONSE2" | tail -n 1)
BODY2=$(echo "$RESPONSE2" | head -n -1)

echo "Tab 2 update with stale lock: HTTP $HTTP2"
echo "Response: $BODY2" | jq .
```

**Expected Results (after FIX #6):**
- ✅ Tab 1 update: **200 OK** with new lock version
- ✅ Tab 2 update with old lock: **409 Conflict**
- ✅ Data is NOT lost
- ✅ Client receives instruction to refresh

---

### TEST 6: N+1 Query Detection

**Test Command:**
```bash
#!/bin/bash

# Enable query logging
export RAILS_LOG_LEVEL=debug

# Make request
curl -s "http://localhost:3000/api/v1/companies?page=1&limit=50" \
  -H "Authorization: Bearer $TOKEN" > /dev/null

# Check logs for duplicate queries
grep -c "SELECT \"blobs\"" log/development.log

# EXPECTED: <2 (preloaded)
# VULNERABLE: >10 (N+1 problem)
```

---

## 📊 PERFORMANCE TESTS

### TEST 7: Dashboard Load Time (LCP)

**Before Fix (FIX #4 - Lazy Loading):**
```
Request: GET /api/v1/company_dashboard/overview
Queries: 147
Time: 2.3s
Payload: 2.5MB
```

**Expected After Fix:**
```
Request: GET /api/v1/company_dashboard/overview
Queries: 15
Time: 0.4s
Payload: 200KB
```

**Test Command:**
```bash
# Install Apache Bench
brew install ab  # macOS

# Test 10 requests
ab -n 10 -c 1 -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/company_dashboard/overview

# Check: Time per request should be <500ms
```

---

## 🔍 SECURITY SCANNING

### TEST 8: OWASP ZAP Scan

```bash
# Install ZAP
# https://www.zaproxy.org/getting-started/

# Run scan
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t http://localhost:3000 \
  -r zap-report.html

# Review results for:
# - Broken Access Control (A01:2021)
# - Missing Authorization (A05:2021)
# - IDOR (A01:2021)
```

---

## ✅ FINAL VERIFICATION CHECKLIST

### Backend (Rails API)

- [ ] All IDOR tests pass (TEST 1, 2, 3)
- [ ] Authorization tests pass
- [ ] Feature gating validated on backend
- [ ] No sensitive data leakage
- [ ] All error responses use generic messages
- [ ] Audit logging captures all security events
- [ ] Rate limiting implemented
- [ ] Database query optimization verified

### Frontend (React)

- [ ] Feature gates always validated against API
- [ ] localStorage manipulation does NOT bypass security
- [ ] JWT tampering detected and rejected
- [ ] All API calls include proper authorization headers
- [ ] Sensitive data not stored in localStorage
- [ ] Session storage uses secure flags

### Database

- [ ] All migrations applied (including lock_version)
- [ ] Indexes created for query optimization
- [ ] Foreign keys properly defined
- [ ] Audit trail table exists and logs changes

### Operations

- [ ] Monitoring alerts configured
- [ ] Security logs centralized (Datadog/Sentry)
- [ ] Rate limiting verified
- [ ] CORS headers restrictive
- [ ] CSP headers configured
- [ ] TLS 1.2+ enforced

---

## 📈 SUCCESS METRICS

After all fixes are implemented, verify:

| Metric | Before | After | Target |
|--------|--------|-------|--------|
| IDOR Vulns | 3 | 0 | 0 |
| Unauthorized Access | 10+/day | 0 | 0 |
| Query Performance | 147 queries | 15 queries | <20 |
| API Response Time | 2.3s | 0.4s | <0.5s |
| Security Incidents | - | 0 | 0 |
| Audit Coverage | 40% | 99% | 100% |

---

## 🚀 DEPLOYMENT CHECKLIST

- [ ] All tests pass in staging
- [ ] Code review approved by security team
- [ ] Performance testing completed
- [ ] Monitoring dashboards created
- [ ] Runbook for incident response prepared
- [ ] Team trained on security changes
- [ ] Deployment scheduled during low-traffic window
- [ ] Rollback plan documented
- [ ] Post-deployment monitoring active
- [ ] No customer-impacting incidents in first 24h

---

**Test Suite Prepared:** 2026-05-26  
**Estimated Execution Time:** 2-3 hours  
**Required Access Level:** Admin/Test environment  
