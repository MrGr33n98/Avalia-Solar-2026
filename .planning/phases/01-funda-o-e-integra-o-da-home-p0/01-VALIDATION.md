---
phase: 1
slug: funda-o-e-integra-o-da-home-p0
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-06-16
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest / React Native Testing Library |
| **Config file** | jest.config.js |
| **Quick run command** | `npm test -- src/features/home` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- src/features/home`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 45 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 1 | MOCK-01 | — | N/A | unit | `npm test -- HomeComponents` | ❌ W0 | ⬜ pending |
| 1-01-02 | 01 | 1 | HOME-01 | — | N/A | integration | `npm test -- HomeQueries` | ❌ W0 | ⬜ pending |
| 1-02-01 | 02 | 2 | HOME-01 | — | N/A | component | `npm test -- BannerCarousel` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/features/home/__tests__/HomeQueries.test.ts` — stubs for HOME-01
- [ ] `src/features/home/__tests__/HomeMocks.test.ts` — regression test for MOCK-01 removal

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual de Skeleton | HOME-01 | Fidelidade visual | Abrir app, observar placeholders antes do carregamento. |
| Pull-to-Refresh | HOME-01 | Gesto físico | Deslizar para baixo na Home e verificar reload dos banners. |

*If none: "All phase behaviors have automated verification."*

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 45s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
