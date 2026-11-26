# TDD e suíte de testes
Antes de cada refactor: teste de caracterização de comportamento atual, RED para alvo comprovado, GREEN mínimo, refactor, teste de paridade e benchmark. Frontend já usa Jest/RTL e Playwright; Rails RSpec para contrato/policy se tocar backend. Rodar comandos existentes (inspecionar package.json, configuração e ambiente): `npm run typecheck`, `npm run lint`, `npm run test:ci`, `npm run build`, `npm run perf:bundle` e Playwright conforme config; não usar `--force`/ignorar falhas. CI utiliza fixtures sintéticas, credenciais secret store e builds iguais; não commit storageState.
| Teste | Técnica | Assert |
|---|---|---|
| TP01 seleção A→B lenta/falha | RTL + deferred promises | B somente confirmado; sem conteúdo A no contexto B |
| TP02 IDOR/gates | RSpec/Playwright staging | 403 esperado e UI segura, nenhuma query bloqueada |
| TP03 resposta A tardia | mock de rede A 2s/B 50ms | sem overwrite, cache scoped |
| TP04 URL/alias/history | Playwright | canonical params, 0 loops, back/forward correto |
| TP05 shell | RTL mount counter + trace | 0 remount em tab local |
| TP06 cache warm/fresh/expired | fake timers + Playwright | request conforme política, dados frescos |
| TP07 burst ActionCable | fake subscription/timers | refresh seletivo, revogação imediata |
| TP08 reconnect/unmount/logout | mocks + browser | cleanup e sem stale private data |
| TP09 filtro rápido | 10 interações sintéticas | último resultado correto, cancelamentos sem toast falso |
| TP10 erro parcial de overview/intent | intercept em staging | conteúdo disponível permanece, retry local |
| TP11 charts/drawers lazy | network trace | chunk não requisitado antes do necessário (exceto prefetch permitido) |
| TP12 prefetch | saveData, role/plan, tenant switch | limitado e autorizado |
| TP13 grandes listas | fixture 20/200/1000 | interação responsiva e paridade de ordenação/export |
| TP14 responsive | 320/360/390/430/768/1024/1180/1280/1440/1920 | sem overflow de página, safe area |
| TP15 a11y | Axe + teclado + zoom 200% | 0 serious/critical, foco e semântica |
| TP16 reduced motion | media emulation + trace | redução real, sem layout instável |
| TP17 visual parity | snapshots light/dark | aprovar diffs intencionais Tremor only |
| TP18 cold/warm | 5–10 runs comparáveis | budgets e resultados reportados |
| TP19 memory | 30 ciclos local | sem subscriptions/retained DOM órfãos |
| TP20 telemetry | contract tests | sem PII, sem evento duplicado |
| TP21 release/rollback | staging | flag/revert, sem migração irreversível |
| TP22 route smoke matrix | inventário 121 rotas/40 tabs, por papel | carregamento e gates ou alias documentado |
| TP23 admin/reviewer | fixtures com/sem membership | papéis e redirecionamentos corretos |
| TP24 mutations | staging | sem duplicação, idempotência quando prevista, autorização |
Gate D0 é relatório, não resultado verde de teste de implementação. Testes de mutação, IDOR, bursts e carga só local/staging autorizado. No production usar navegação normal de leitura.
