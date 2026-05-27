# Revenue Remediation Roadmap Summary
## Avalia Solar - 4-Week Plan to Fix Billing & Revenue Visibility

**Status:** Ready for Execution  
**Start Date:** Week of 2026-05-27  
**End Date:** Week of 2026-06-17 (Phase 1-3 complete, Phase 4 queued)

---

## The Problem (From Audit)

| Issue | Impact | Severity |
|-------|--------|----------|
| Feature gates computed by backend but NOT exposed to frontend API | Users hardcode checks; frontend can't enforce rules | 🔴 CRITICAL |
| Frontend uses hardcoded plan checks | Inconsistent, unmaintainable, not based on backend truth | 🔴 CRITICAL |
| Zero revenue events tracked | Cannot measure conversion, LTV, churn, or revenue impact | 🔴 CRITICAL |
| Users can bypass feature gates via direct API calls | Security hole; free users could access Pro features | 🔴 CRITICAL |
| Checkout errors shown as browser `alert()` | Poor UX; users think something is broken | 🟡 HIGH |
| No audit trail for billing actions | Cannot troubleshoot issues; compliance gap | 🟡 HIGH |
| No idempotency on checkout sessions | Duplicate sessions possible if user clicks twice | 🟡 HIGH |
| SubscriptionSyncService fails hard on edge cases | Silent revenue loss if company lookup fails | 🟡 HIGH |

**Financial Impact:** 12-30% potential revenue lift + risk mitigation

---

## The Solution (In 4 Phases)

### Phase 1: Feature Access & Revenue Tracking (Day 1-2, 7 hours)
**Goal:** Enable backend-driven feature enforcement + start measuring revenue  
**Owner:** Backend Dev + Frontend Dev + QA

**What Gets Done:**
1. ✅ Add `GET /api/v1/companies/:id/feature_access` endpoint
2. ✅ Add backend feature gate enforcement (401 if locked)
3. ✅ Frontend consumes feature access API (not hardcoded)
4. ✅ All 7+ critical revenue events tracked:
   - pricing_viewed
   - checkout_started
   - checkout_completed
   - checkout_failed
   - subscription_activated
   - enterprise_lead_created
   - portal_opened

**Files Changed:** ~15 files (10 new/modified backend, 5 new/modified frontend)  
**Tests:** New backend tests, integration tests  
**Deploy:** Hotfix - low risk, high value  
**Can Proceed to Phase 2:** YES (immediate)

---

### Phase 2: Checkout UX & Reliability (Day 2-3, 8 hours)
**Goal:** Better error handling, prevent duplication, add audit trail  
**Owner:** Backend Dev + Frontend Dev + QA

**What Gets Done:**
1. ✅ Replace `alert()` with friendly error UI + retry button
2. ✅ Add idempotency to checkout session creation (cache)
3. ✅ Add audit logging for all billing actions (user, IP, timestamp)
4. ✅ Add email notifications when plan changes

**Files Changed:** ~10 files (4 backend, 3 frontend, 3 migrations)  
**Tests:** Test error handling, audit logging, email sends  
**Deploy:** After Phase 1 verified stable  
**Can Proceed to Phase 3:** YES (2-day wait)

---

### Phase 3: Edge Cases & Observability (Day 4, 6 hours)
**Goal:** Handle failures gracefully, improve reliability, add dashboard  
**Owner:** Backend Dev + Frontend Dev + QA

**What Gets Done:**
1. ✅ Fix SubscriptionSyncService edge case (company not found)
2. ✅ Add webhook failure alerting (Slack notifications)
3. ✅ Add subscription status dashboard (clear health indicator)

**Files Changed:** ~5 files (2 backend, 2 frontend, 1 update)  
**Tests:** Edge case tests, webhook failure simulation  
**Deploy:** After Phase 2 verified stable  
**Can Proceed to Phase 4:** YES

---

### Phase 4: Backlog (Week 3-4, Lower Priority)
**Goal:** Nice-to-have improvements  
**Owner:** Backend Dev + QA (future sprint)

**What Could Get Done:** (Pick based on priority)
1. 🔳 Self-serve subscription cancellation endpoint
2. 🔳 Invoice history endpoint
3. 🔳 Payment retry endpoint
4. 🔳 Analytics dashboard for revenue metrics
5. 🔳 Checkout abandonment recovery (email reminder)

**Effort:** 3-6 hours each, ~15 hours total  
**Priority:** Lower than Phases 1-3  
**Deploy:** Later (after Phase 3 stable and in production)

---

## Week-by-Week Breakdown

### Week 1: May 27 - May 31
**Monday (May 27):**
- 09:00-09:30: Architect reviews plan with team
- 09:30-10:00: Phase 0 validation (confirm audit findings)
- 10:00-13:00: Backend Dev implements Phase 1 tasks (feature access, tests)
- 13:00-15:00: Frontend Dev creates hook, updates dashboard
- 15:00-17:00: Frontend Dev adds revenue events

**Tuesday (May 28):**
- 09:00-10:00: QA tests Phase 1 (feature gates, events)
- 10:00-11:00: Dev makes fixes based on QA feedback
- 11:00-12:00: DevOps deploys Phase 1 to staging
- 12:00-13:00: QA smoke tests in staging
- 13:00-14:00: DevOps deploys Phase 1 to production
- 14:00-17:00: Monitor for errors, prepare Phase 2

**Wednesday (May 29) - Phase 2 In Progress**
- 09:00-11:00: Frontend Dev replaces alerts with error UI
- 11:00-13:00: Backend Dev adds idempotency + audit logging
- 13:00-17:00: QA tests Phase 2, prepare for staging deploy

**Thursday (May 30) - Phase 2 Deployment**
- 09:00-10:00: QA final testing
- 10:00-11:00: DevOps deploys to staging
- 11:00-12:00: QA smoke tests
- 12:00-13:00: DevOps deploys to production
- 13:00-17:00: Monitor, prepare Phase 3

**Friday (May 31) - Phase 3**
- 09:00-10:30: Backend Dev fixes edge cases + webhook alerting
- 10:30-12:00: Frontend Dev builds subscription status dashboard
- 12:00-13:00: QA tests Phase 3
- 13:00-14:00: DevOps deploys Phase 3 to staging
- 14:00-15:00: QA smoke tests
- 15:00-16:00: DevOps deploys Phase 3 to production
- 16:00-17:00: All hands: celebration + Phase 4 planning

### Week 2: June 3-7
- Daily monitoring (24/7 during critical hours)
- Phase 4 backlog refinement & prioritization
- Analytics dashboard setup (if doing Phase 4 early)
- Retrospective on lessons learned

### Weeks 3-4: June 10-24
- Execute Phase 4 items (as scheduled)
- Optimize based on post-live metrics
- Plan next revenue features

---

## Effort Estimate

| Phase | Backend | Frontend | QA | DevOps | Architect | Total |
|-------|---------|----------|----|---------| --------| -------|
| 1 | 3h | 2.5h | 2h | 1h | 0.5h | **9h** |
| 2 | 2h | 1h | 2h | 1h | - | **6h** |
| 3 | 1.5h | 1h | 1.5h | 1h | - | **5h** |
| 4 | 6-10h | 2-4h | 2h | 0.5h | - | **10-16h** |
| **Total** | **12.5-16.5h** | **6.5-8.5h** | **7.5h** | **3.5h** | **0.5h** | **~30-36h** |

**Solo Dev Estimate:** ~40 hours (if one person doing all)  
**Team Estimate:** ~20-30 hours distributed effort  
**Wall-Clock Time:** 4-5 business days (Phases 1-3), +2 weeks (Phase 4 optional)

---

## Success Metrics

### Immediate (Day 1-4)
- ✅ Feature access API operational
- ✅ Revenue events flowing to analytics
- ✅ Zero revenue data loss
- ✅ No checkout failures due to missing error handling
- ✅ All team alerts on webhook failures

### Week 1
- ✅ Feature gates enforced at backend
- ✅ 95%+ feature accuracy (backend vs frontend)
- ✅ Pricing funnel visible (pricing_viewed → checkout_completed)
- ✅ Audit log complete for all billing actions

### Week 2
- ✅ Zero users seeing browser alerts (all replaced)
- ✅ Zero duplicate checkout sessions (idempotency working)
- ✅ All subscription status changes communicated to owner
- ✅ Team notified of all webhook failures within 5 minutes

### Week 4 (Post-Phase 3, Ready for Phase 4)
- ✅ Business can answer:
  - How many users visit /pricing daily?
  - What's the Pro conversion rate?
  - How many Enterprise leads this month?
  - When are users churning?
  - What's LTV of a Pro customer?

---

## Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|-----------|
| Phase 1 breaks checkout | Low | HIGH | Staging tests first, zero-downtime deploy |
| Feature access too strict | Medium | MEDIUM | Architecture review by Architect |
| Analytics events missing | Low | HIGH | Console logging during dev + backend verification |
| Webhook failure alerting too noisy | Medium | LOW | Tuned thresholds, Slack filtering |
| Deploy during peak usage | Low | MEDIUM | Deploy during low-traffic hours (2-4 AM) |

---

## Files to Create/Modify (Summary)

**Phase 1:**
- Backend: 6 files (3 new, 3 modified)
- Frontend: 4 files (2 new, 2 modified)
- Tests: 2 files (new)

**Phase 2:**
- Backend: 5 files (2 new, 3 modified)
- Frontend: 2 files (1 new, 1 modified)
- Migrations: 1 file (new)

**Phase 3:**
- Backend: 2 files (modified)
- Frontend: 2 files (1 new, 1 modified)

**Total:** ~24 files across 3 phases

---

## Handoff Checklist

**Before Phase 1 Starts:**
- [ ] All team members read this roadmap
- [ ] Architect reviews plan (30 min)
- [ ] Phase 0 validation done (30 min)
- [ ] Dev environment confirmed working:
  - [ ] `ruby -v` ≥ 3.2
  - [ ] `node -v` ≥ 18
  - [ ] Redis/Memcached running
  - [ ] Stripe test credentials configured
  - [ ] Analytics provider test account ready
- [ ] CI/CD pipeline working
- [ ] Staging environment ready for testing

**During Phases 1-3:**
- [ ] Daily standup (10 min)
- [ ] Phase sign-off before deploy (Architect/QA)
- [ ] Post-deploy monitoring (1 hour each)

**After Phase 3:**
- [ ] Celebration 🎉
- [ ] Team retrospective (1 hour)
- [ ] Phase 4 backlog grooming (1 hour)

---

## One-Pager for Leadership

**Current State:** Billing system 80% wired but 3 critical gaps preventing revenue visibility and feature enforcement.

**What We're Doing:**
1. Exposing backend feature gates to frontend (enable enforcement)
2. Adding revenue event tracking (enable metrics)
3. Improving checkout UX & reliability (reduce friction)

**When:** 4 business days (Phases 1-3), 4 weeks total (with Phase 4)

**Cost:** ~30 hours engineering effort

**Benefit:**
- Full revenue visibility (can measure conversion, LTV, churn)
- Secure feature enforcement (no bypass vulnerability)
- Better user experience (friendly errors, reliable checkout)
- 12-30% potential revenue lift
- Compliance-ready audit trail

**Next Step:** Approve plan, schedule Phase 1 kickoff.

---

## Questions & Answers

**Q: Can we do Phase 1 first?**  
A: Yes, and you should. It's the hotfix that enables revenue visibility. Takes 7 hours, super valuable.

**Q: Do we need to do all 4 phases?**  
A: Phases 1-3 are mandatory (revenue + reliability). Phase 4 is optional backlog (nice-to-have).

**Q: Can we deploy Phase 1 without Phase 2?**  
A: Yes! Phase 1 is independent. Phase 2 improves UX but isn't blocking revenue.

**Q: What if we find bugs during Phase 1?**  
A: Fix them before moving to Phase 2. Quality first. Phase 1 should be rock solid.

**Q: Should we deploy to production or staging first?**  
A: Staging first (smoke tests), then production. Standard deployment process.

**Q: What about backwards compatibility?**  
A: No breaking changes. Phase 1 adds new endpoint + new enforcement. Existing code still works.

**Q: Can one person do this alone?**  
A: Yes, but ~40 hours. Better with team (20-30 hours distributed). Coordinator needed.

---

## Contacts & Escalation

- **Technical Lead (Architect):** Approval on design before Phase 1
- **Backend Lead (Dev):** Implements backend tasks
- **Frontend Lead (Dev):** Implements frontend tasks
- **QA Lead:** Tests each phase before deploy
- **DevOps Lead:** Deploys to staging/production
- **PM/Product:** Prioritizes Phase 4 backlog

---

## Reading List (In Order)

1. **This document** (you are here) - 10 min
2. **QUICK_REFERENCE.md** - Code snippets for dev - 15 min
3. **REVENUE_REMEDIATION_EXECUTION_PLAN.md** - Detailed plan - 30 min
4. **PHASE_2_REVENUE_AUDIT_REPORT.md** - Full audit findings - 45 min
5. **INTEGRATION_CHECK_REVENUE_FLOWS.md** - Wiring status - 30 min

**Total:** ~2 hours to fully understand. Recommended before kicking off.

---

**Ready to Execute**

Phases 1-3 can ship in 4 days. Get team aligned. Start Phase 1 Monday.

Questions? Review the full execution plan or audit reports.

