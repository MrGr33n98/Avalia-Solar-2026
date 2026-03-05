# ✅ DEPLOY CHECKLIST P0 - DASHBOARD FIXES

## Pre-Deployment Verification

### Code Quality ✅
- [x] TypeScript compilation successful (no errors)
- [x] ESLint passing (warnings only, no new errors)
- [x] Frontend tests: 8/8 passing
  - [x] QuotesPanel: 4/4 tests
  - [x] ReviewsList: 4/4 tests
- [x] Backend tests: Webhook validation coverage ready
- [x] Git commits atomic and well-documented (3 commits)

### Technical Validation ✅
- [x] Lead interface updated: `company?: string | {id, name, logo_url}`
- [x] Review interface updated: same union type
- [x] ReviewsList.tsx: defensive rendering implemented
- [x] Webhook allowlist active: `['stripe', 'mercadopago', 'pagarme', 'mock']`
- [x] Observability: structured logs implemented
- [x] Performance monitoring: duration_ms tracking added

### Backward Compatibility ✅
- [x] Legacy string company format supported
- [x] Legacy object company format supported
- [x] Mock provider maintained for testing
- [x] No breaking changes to API contracts

---

## Deployment Steps

### 1. Backend Deployment
```bash
# Review changes
git diff origin/main AB0-1-back/

# Deploy
cd AB0-1-back
bundle install
rails db:migrate  # If any migrations (none in this release)
systemctl restart rails  # or your deployment method

# Verify
curl -X POST https://api.avaliasolar.com.br/api/v1/payments/webhooks/invalid_provider \
  -H "Content-Type: application/json" \
  -d '{"status":"paid","checkout_session_id":"test"}'
# Expected: HTTP 422
```

### 2. Frontend Deployment
```bash
# Build
cd AB0-1-front
npm run build

# Deploy
# (your deployment method - Vercel/Netlify/etc)

# Verify build
npm run lint
```

### 3. Smoke Tests
- [ ] Load `/review-dashboard` logged in
- [ ] Verify no console errors
- [ ] Check quotes render with company names
- [ ] Test webhook with invalid provider returns 422

---

## Go/No-Go Criteria

### GO Criteria ✅
1. All tests passing locally
2. No TypeScript compilation errors
3. Backward compatibility verified
4. Observability logs confirmed
5. Rollback plan documented

### NO-GO Criteria ❌
1. Test failures
2. TypeScript errors
3. Breaking API changes detected
4. Missing rollback documentation

---

## Post-Deployment Validation

### Immediate (0-5 min)
```bash
# Check application health
curl https://api.avaliasolar.com.br/health
# Expected: HTTP 200

# Check logs for errors
tail -f production.log | grep -i error

# Test webhook validation
curl -X POST https://api.avaliasolar.com.br/api/v1/payments/webhooks/unknown \
  -H "Content-Type: application/json"
# Expected: HTTP 422, logged as webhook_provider_rejected
```

### Short-term (5-30 min)
- [ ] Monitor error rate (should be < 1%)
- [ ] Check performance logs for P95
- [ ] Verify review dashboard loads for 5 test users
- [ ] Confirm no substring TypeError in Sentry

### Medium-term (1-24 hours)
- [ ] Extract P95 metrics using observability queries
- [ ] Verify webhook rejection logs present
- [ ] Monitor user complaints/support tickets
- [ ] Check JavaScript error rate in production

---

## Rollback Plan

### Immediate Rollback (< 5 min)
```bash
# Option 1: Git revert (preferred)
cd /path/to/AB0-1-main
git revert 8636c3c  # Test commit
git revert 6dd8855  # Webhook commit
git revert 2a5fec2  # Interface fix commit
git push origin main

# Option 2: Hard reset (emergency only)
git reset --hard HEAD~3
git push origin main --force

# Redeploy previous version
cd AB0-1-back && systemctl restart rails
cd AB0-1-front && npm run build && deploy
```

### Verification Post-Rollback
- [ ] Application loads without errors
- [ ] Previous functionality restored
- [ ] Error rate returns to baseline
- [ ] Document rollback reason for postmortem

---

## Monitoring Queries (First 24h)

```bash
# Error rate
grep -c "ERROR" production.log | awk '{print $1/NR*100"%"}'

# Webhook rejections
grep '"event":"webhook_provider_rejected"' production.log | wc -l

# API Performance P95
grep '"endpoint":"review_dashboard#summary"' production.log \
  | jq -r '.duration_ms' \
  | sort -n \
  | awk '{a[NR]=$1} END {print "P95:", a[int(NR*0.95)]}'
```

---

## Sign-Off

**Deployed by:** _________________  
**Date/Time:** _________________  
**Verified by QA:** _________________  
**Rollback tested:** [ ] Yes [ ] No  
**Monitoring confirmed:** [ ] Yes [ ] No

---

## Emergency Contacts

**DevOps Lead:** [contact]  
**Backend Lead:** [contact]  
**Frontend Lead:** [contact]  
**On-Call Engineer:** [contact]