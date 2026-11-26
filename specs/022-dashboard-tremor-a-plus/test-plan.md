# TDD / suíte de testes
## Camadas
- Jest + RTL (já instalados): token variants, primitives, controlled inputs, null/zero, status, aliases, query keys, role/plan guard, cancellation, deferred tenant switch, reducer/filter URL roundtrip, chart formatter, CSV escaping, upload constraints, disabled actions, reduced motion.
- Contratos/integration: mock server ou fixture HTTP controlada apenas teste; comparar request/response por endpoint observado; 401/403/404/409/422/429/5xx, partial, stale, retries; Rails RSpec para policy e mutations se afetadas. Não mockar autorização em teste IDOR real de staging.
- Playwright E2E: Chromium + Firefox + WebKit (se CI suporta; registrar exceções), desktop e mobile; role/plan matrix, deep links, reload/back, switch race, CRUD, offline/reconnect, upload, visual. Usar test IDs semântico como fallback; getByRole primário. Screenshots baseline mascarando dados dinâmicos; fontes e fixtures estáveis; revisar diffs manualmente, não atualizar snapshots em massa.
- Axe em páginas e drawers, light/dark; 0 serious/critical, verificar WCAG AA restante manualmente, teclado, focus trap/restore, labels, chart table, contraste, 200% zoom. Motion reduzido.
- Performance: 5 runs cold/warm, trace, bundles, network, RUM; report metrics raw. Security: cross-tenant, cache, role/plan, export, websocket, upload, PII, CSRF, XSS, CSV.

## Comandos reais do frontend
`npm run typecheck`, `npm run lint`, `npm run test:ci`, `npm run build`, `npx playwright test --list`, `npx playwright test <specs-confirmados>`, `npm run perf:bundle`, `npm run perf:lhci` (validar configuração auth). Para tests focados, `npm test -- --runInBand <test-path>`. Não inventar scripts/paths; descobrir config primeiro. Backend: usar bundle exec rspec com paths efetivamente identificados. CI sem credenciais de produção. Tests já identificados: dashboard.test, dashboard-company, company-selection-multitenant, dashboard-charts-clean, navigation-review-forms, DashboardNavigationFlyout, RankingPerformanceTab, review collection, PlanAndSubscription, reviewer-dashboard-viewport, dashboard.spec, review-dashboard-domain. Verificar atualidade e paths no checkout.

## Matriz mínima
| ID | Cenário | Aceite |
| --- | --- | --- |
| QA01 | Tenant A/B URL + stale localStorage | nenhum flash B ou request não autorizado |
| QA02 | Role admin/review/member/pending | policy e redirects corretos |
| QA03 | Tabs/aliases e 121 route patterns | cada rota smoke com role autorizado; blocked/N/A justificado |
| QA04 | Período, filters, sort, cursor, CSV | URL/estado e dados consistentes |
| QA05 | Null/zero/empty/partial | distintos e sem mock |
| QA06 | 401/403/404/409/422/429/5xx | mensagem, retry e no leakage |
| QA07 | CRUD produto/projeto/material | validação, status e moderação |
| QA08 | Reviews e coleta | resposta e preview sem dispatch real |
| QA09 | Lead→proposta→PDF | seleção, wizard, confirmação |
| QA10 | Inbox realtime | reconnect, cleanup, sem duplicação |
| QA11 | Buyer intent/ranking/tracking | gates, metodologia, source |
| QA12 | Billing/equipe/integrações | confirmação, limites e auth |
| QA13 | CRM pipeline/campanhas/AI | sandbox, approval, keyboard |
| QA14 | Reviewer jornada | isolamento e membership |
| QA15 | 320/360/390/430/768/1024/1180/1280/1440/1920 | no document overflow, actions reachable |
| QA16 | Zoom 200%, keyboard, reduced motion | focus e legibilidade |
| QA17 | Light/dark/presets | contraste e consistência |
| QA18 | Offline/slow network | feedback e retry |
| QA19 | Security cross-tenant | zero leaks e policy server |
| QA20 | Visual regression | diferenças revisadas e aprovadas |
| QA21 | Perf baseline vs candidate | budgets e sem regressão injustificada |
| QA22 | Flag rollback | legacy funcional e dados intactos |
