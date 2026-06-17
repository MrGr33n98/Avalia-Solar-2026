---
phase: 2
slug: autentica-o-e-seguran-a-p0
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-06-16
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest / React Native Testing Library |
| **Config file** | jest.config.js |
| **Quick run command** | `npm test -- src/stores src/lib` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test` (filtered by the affected area)
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 2-01-01 | 01 | 1 | AUTH-01 | T-2-01 | Secure token storage | unit | `npm test -- authStorage` | ❌ W0 | ⬜ pending |
| 2-01-02 | 01 | 1 | AUTH-01 | — | N/A | unit | `npm test -- authStore` | ❌ W0 | ⬜ pending |
| 2-02-01 | 02 | 2 | AUTH-01 | T-2-02 | JWT logout on 401 | integration| `npm test -- apolloClient` | ❌ W0 | ⬜ pending |
| 2-03-01 | 03 | 3 | AUTH-01 | — | N/A | component | `npm test -- LoginGate` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/__tests__/authStorage.test.ts` — stubs for token persistence
- [ ] `src/stores/__tests__/authStore.test.ts` — stubs for state management
- [ ] `src/lib/__tests__/apolloClientAuth.test.ts` — stubs for 401 interception

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Login Gate UI | AUTH-01 | Fluxo de navegação | Tentar favoritar uma empresa sem estar logado; o modal de login deve aparecer. Após login bem sucedido, a ação deve ser completada ou o usuário retornado à tela. |

*If none: "All phase behaviors have automated verification."*

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
