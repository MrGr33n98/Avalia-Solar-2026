# Test plan
| ID | Camada | Casos | Prova |
|---|---|---|---|
| TP01 | baseline | 5 superfícies, manifest e Rails specs | stdout/codes/SHA |
| TP02 | unit tokens | host overrides/dark, variants, contrast | Vitest + browser |
| TP03 | unit component | empty/loading/error/offline; long name; no price; null rating; invalid media | Testing Library |
| TP04 | unit state | selection ID reorder, 4ª bloqueada, clear filter, stale response, cursor | Vitest |
| TP05 | contract | payload/schema output, envelope exact, _meta separado, text fallback | RSpec/Zod |
| TP06 | E2E | search→profile→reputation→compare→back; categories→search; catalog | Playwright harness compiled HTML |
| TP07 | layout/a11y | 8 larguras × 2 temas, keyboard, focus, reduced motion, 200% zoom | axe + manual + screenshots |
| TP08 | security | cross-tenant (se privado), invalid URL, unauthorized call, CSP, fixture exclusion | RSpec/E2E/build |
| TP09 | registry | schema, deps, path traversal, build deterministic within declared timestamp policy, 3 installs sandbox | scripts + clean project |
| TP10 | perf | gzip ≤122880, manifest/hash, CLS, timing baseline | build + browser |
| TP11 | host | real ChatGPT and Claude if accessible, fallback no UI | smoke and evidence |
| TP12 | rollout | flag OFF/ON staging, previous artifacts, rollback drill | staging logs |

TDD: RED test precise expected behavior, GREEN minimally implement, REFACTOR preserve. Compare visual baselines after reviewing deliberate differences; do not blindly update snapshots. No mocks masking real bridge in host smoke. Use fixture synthetic deterministic. Record skipped tests and reason. Mandatory before PR: typecheck, test, build, E2E, relevant Rails specs and registry validation. Real-host and staging required before declaring production-ready, not necessarily to open draft PR.
