# Tasklist executável | Spec 019
Cada checkbox exige commit/PR, teste ou evidência associada. `[P]` pode ocorrer em paralelo dentro das dependências. Todos os paths abaixo são relativos à raiz; verificar existência e HEAD antes de editar. Arquivos novos são sugestões de nomes, adaptar ao padrão real.

## F-1 — Preparação e baseline (3 SP)
- [IN_PROGRESS] T001 P0 — Inspecionar `git status`, branch, HEAD, PRs concorrentes, AGENTS.md, constitution, specs 004/011/014/018 e workflows. Criar branch isolada sem descartar alterações; confirmar número da spec e SHA das imagens. Evidência: inventário de conflitos/paths.
- [IN_PROGRESS] T002 P0 — Ler skills efetivamente instaladas; mapear todos consumidores com `rg` dos hooks, endpoints, componentes e imports. Inventariar versões e flags, API direct/proxy, QueryProvider, SW, Docker/Puma, Nginx/Cloudflare. Evidência: mapa de chamadas.
- [BLOCKED] T003 P0 — Destravar SSR 500 em dev/staging: verificar mecanismo de `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` no build/runtime e workflow, configurar secret por canal aprovado sem expor valor; não trocar chave de produção inadvertidamente. Confirmar / e /companies 200 e paridade SHA. Registrar baseline screenshots, HAR sanitizado, performance e uso de memória. Se impedido, documentar blocker, não declarar E2E concluído.

## F0 — TDD RED e testes de contrato (3 SP)
- [TODO] T004 P0 — Corrigir asserções obsoletas em `AB0-1-front/__tests__/companies/LocationFilters.test.tsx` sem enfraquecer contrato; resolver handle aberto em `__tests__/components/LocationFilter.test.tsx` com teardown real, sem forceExit.
- [IN_PROGRESS] T005 P0 [P] — Criar testes de hooks para debounce, throttle, out-of-order, cache, dedup, troca rápida, unmount, multi-UF, TTL e storage falho. Usar deferred promises e fake timers somente onde adequado. Registrar RED que reproduz bugs.
- [IN_PROGRESS] T006 P0 [P] — Expandir `AB0-1-back/spec/requests/api/v1/companies_cities_spec.rb`; criar specs de warmup, ETag/304, headers, UF inválida, empresa inativa, count/filter parity e cobertura. Registrar RED.
- [BLOCKED] T007 P1 [P] — Criar harness E2E Playwright para /, /companies, categorias e busca; teste geometry/rapid switch/error/offline; registrar baseline e falhas reais. Sem screenshots falsas ou teste pulado sem justificativa.

## F1 — Núcleo frontend, UX mobile e contador (5 SP; depende F0)
- [VALIDATED] T010 P0 — Implementar contrato tipado `GeoCatalog`, normalização e key factory em `AB0-1-front/lib/geography/` (nome sugerido); fonte canônica para UFs; IDs preservados, versão e validação. Evidência: `evidence/task-status.md`, testes de catálogo.
- [VALIDATED] T011 P0 — Implementar repositório de cache persistente versionado e seguro, hidratação client-only/SSR-safe, TTL, invalidação e exceções de storage. QueryClient único existente; nenhum segundo motor concorrente. Evidência: `evidence/task-status.md`, testes de catálogo.
- [VALIDATED] T012 P0 — Implementar `hooks/useGeographyCatalog.ts` com TanStack Query, AbortSignal, guard de seleção, dedup e retry restrito. Remover espera artificial e throttle; nenhuma seleção válida descartada. Evidência: `evidence/task-status.md`, testes do hook e typecheck.
- [IN_PROGRESS] T013 P0 — Converter `hooks/useCompanyLocationData.ts`, `hooks/useLocationData.ts` e `components/filters/hooks.ts` em adaptadores compatíveis. Remover fallback `/states/:id/cities`, callbacks instáveis e fetches duplicados; preservar API de consumidores.
- [IN_PROGRESS] T014 P1 — Migrar/verificar consumidores: MobileCompanyFiltersSheet, TabletCompanyLocationFilters, FilterSidebar, CompaniesPageClient, HomeLocationBar, CategoryClientComponent, ambos LocationFilter, LocationSearch, SidebarFilter, CategoryFilterSidebar, CategoryFiltersPanel, MobileLocationGate e SearchFilters. Descobrir extras por rg. Nenhuma alteração de semântica ou imports quebrados.
- [TODO] T015 P1 — Prefetch da UF ativa após hidratação/idle ou hover/touch/pointer intent, dedup e Save-Data; não carregar 27 UFs em background. Drawer pode desmontar sem perder cache compartilhado; preservar política atual de draft.
- [IN_PROGRESS] T016 P1 — Mobile: seleção e limpeza atômicas, feedback imediato no miss, sem spinner no hit, retry acessível, empty/offline corretos, sem mudar 44px/70vw/labels/scroll. Evitar resultados stale ao trocar UF.
- [IN_PROGRESS] T017 P1 — `lib/api-client.ts`, `lib/api.ts`, `MobileCompanyFiltersSheet.tsx`: contar por filtros normalizados e cancelar resposta antiga; zero retries 404 nos endpoints do escopo, sem regressão global. Dedup e debounce apenas no draft de contagem; fallback único e `Ver empresas` em erro. Não bloquear aplicação.
- [IN_PROGRESS] T018 P0 — Executar unit/integration, lint e typecheck; comparar request counts e comprovar RED→GREEN.

## F2 — Rails: warmup, cache, presença e contagem (3 SP; depende F0, paralelo F1)
- [IN_PROGRESS] T020 P0 — `AB0-1-back/app/services/locations/br_locations.rb`, `config/initializers/locations_warmup.rb`, `config/puma.rb`: aquecer índice efetivo de todas UFs antes de readiness, sem dependência externa; digest pré-calculado. Testar workers reais/preload e memória; não mascarar falha de boot.
- [VALIDATED] T021 P0 — `app/controllers/api/v1/companies_controller.rb`: headers públicos/ETag/304 somente taxonomia anônima válida; manter shapes e aliases; testar versão, status e content negotiation. Evidência: `evidence/task-status.md`, 10 exemplos RSpec.
- [IN_PROGRESS] T022 P1 — `config/routes.rb` e controller/query: reproduzir `/companies/count` na mesma imagem que será publicada, corrigir route precedence/contrato; testar paridade com index para filtros, status, cobertura, categorias e permissões. Sem count scan desnecessário.
- [TODO] T023 P2 — `companies#locations`: inspecionar consumidores, excluir inativas, cache curto Redis com chave e invalidação pós-commit de mudanças relevantes; lidar com Redis indisponível. Não alterar universo de cidades oficiais.
- [IN_PROGRESS] T024 P0 — RSpec request/model/query, benchmark primeiro hit após readiness, startup time/RSS/PSS; comprovar zero SQL por taxonomia e zero regressão em ranking/listagem.

## F3 — Proxy, cache HTTP/CDN e offline (5 SP; depende F2)
- [IN_PROGRESS] T030 P0 — `AB0-1-front/app/api/v1/[...path]/route.ts`: whitelist exata de GET anônimo; query allowlist/UF válida; encaminhar If-None-Match e preservar ETag/Cache-Control/Vary/304. Não relaxar rotas privadas, auth, cookies, /t/, mutações ou erros. Verificar Set-Cookie e variantes.
- [IN_PROGRESS] T031 P0 — Testes de proxy positivos/negativos: paths parecidos, encoding, query inesperada, cookie/auth, métodos, resposta 4xx/5xx, origin e status 304 sem corpo. Nenhuma resposta privada cacheável.
- [VALIDATED] T032 P1 — `config/initializers/cors.rb` e clientes direct/proxy: validar exposição de ETag/revisão, headers condicionais e preflight conforme necessidade; não usar wildcard com credentials. Evidência: `evidence/task-status.md`, spec de CORS no RSpec.
- [BLOCKED] T033 P1 — Validar vhost www real, gzip/Brotli, Cloudflare cache rules específicas, key UF/variantes, MISS/HIT/304, bypass cookies, purge seletivo. Não criar regra global `/api/*`; staging primeiro, config externa documentada. Redis/edge falhos devem degradar com segurança.
- [IN_PROGRESS] T034 P2 — `public/sw.js`, `components/PwaOfflineController.tsx`, `lib/offline/config.ts`: namespace geo específico, apenas GET anônimo validado 200 JSON, revisão/TTL, offline cache miss explícito; não habilitar cache amplo nem apagar caches alheios.
- [BLOCKED] T035 P1 — Testar SW update, unregister/rollback, offline warm/cold, stale, corrupção, 404/500 e duas abas; medir rede e versionamento.

## F4 — Desktop, acessibilidade, visual (3 SP; depende F1)
- [IN_PROGRESS] T040 P1 — `components/filters/FilterSidebar.tsx`: extrair `FilterContent`, estabilizar props/key de UFs e callbacks; medir render count e preservar estado/foco.
- [IN_PROGRESS] T041 P1 — Busca local normalizada sem acentos e janela de opções (≤60 montadas) para SP/MG e multi-UF; manter seleção e identidade UF+cidade, permitir acesso a todas opções via busca/teclado.
- [BLOCKED] T042 P1 — Validar 320/375/390/430/768/1024/1280px, 44px ±1, 70vw ±1, labels/tokens/scroll, 240ms atual quando confirmado, reduced motion, acessibilidade e ausência de overflow.
- [BLOCKED] T043 P1 — Testar loading/empty/error/retry/offline e foco em todas superfícies; axe quando já disponível, screenshots comparativos, sem alterar design system.

## F5 — PostgreSQL e observabilidade (5 SP; depende F2)
- [TODO] T050 P2 — Inspecionar `app/queries/companies/company_search_query.rb`, `app/models/company.rb`, `db/schema.rb` e `company_service_areas`; staging com seed realista/anônimo, casos sede/cobertura/acentos/homônimos, cardinalidade e EXPLAIN (ANALYZE, BUFFERS). Sem executar query pesada em produção sem aprovação.
- [TODO] T051 P2 — Propor índices por predicado efetivo e plano medido; avaliar coluna normalizada/expression index e trigram legado. Não adicionar todos automaticamente. Verificar extensões no alvo e custo de manutenção/escrita.
- [TODO] T052 P2 — Se justificado, migrations em `db/migrate/` com `disable_ddl_transaction!`, `algorithm: :concurrently`, down reversível, timeout e recuperação de índice inválido; evitar lock prolongado. Não remover índices existentes sem evidência.
- [TODO] T053 P2 — Testar resultado idêntico antes/depois e desempenho representativo de sede/cobertura, plano, tamanho e writes. Se não houver benefício, registrar decisão de não criar índice; não marcar otimização como comprovada sem medição.
- [TODO] T054 P1 — Instrumentar latência cache/read/render/TTFB, hit/miss/cancel/error, request count, payload, release, OOM e count fallback; usar stack existente, consentimento e cardinalidade baixa. Sem PII, coordenadas, tokens ou duplicação de evento.
- [TODO] T055 P1 — Definir dashboards/alertas em sistema já existente, baseline e query reproduzível; não instalar nova stack de observabilidade sem necessidade.

## F6 — CI/CD, segurança, release e aceite (5 SP; depende F0–F5)
- [IN_PROGRESS] T060 P0 — Executar análise Spec Kit e checklist; revisar cobertura FR/NFR → task → teste → evidência; detectar duplicidade e alterações fora de escopo.
- [IN_PROGRESS] T061 P0 — Integrar testes novos nos workflows reais existentes (Jest/RSpec/Playwright, lint/typecheck/build, scans, Lighthouse se existente); sem bypass, sem forceExit, sem permissões elevadas ou actions não pinadas conforme padrão do repo.
- [BLOCKED] T062 P0 — Build de imagens com mesmo SHA, envs validados, secrets sem log; migrations staging e smoke API + SSR + proxy + PWA; medir boot/TTFB/carga/uso de recursos. Registrar resultados e artefatos.
- [TODO] T063 P0 — Validar contrato SEO/URLs, busca/compare/ranking/MCP consumidores afetados, autenticação e cache isolation; simular rollback de frontend/proxy/SW/DB conforme dependências.
- [BLOCKED] T064 P0 — Abrir PR(s) com resumo, diff, evidência, riscos, rollout/rollback e checklist; aguardar gates e aprovações obrigatórias. Não auto-merge/deploy sem autorização/política aplicável.
- [BLOCKED] T065 P1 — Após deploy autorizado, smoke produção não destrutivo e observabilidade; comparar SHA, métricas, cache, regressões e OOM. Se gates falharem, acionar rollback conforme runbook. Registrar status real: PASS/FAIL/BLOCKED/NOT RUN.
- [IN_PROGRESS] T066 P1 — Entregar relatório final com before/after, caminhos alterados, PR/SHA, CI/CD URLs, testes, screenshots, métricas com amostra, riscos restantes, flags e próximos passos. Sem GOAL_COMPLETE com blocker crítico.
