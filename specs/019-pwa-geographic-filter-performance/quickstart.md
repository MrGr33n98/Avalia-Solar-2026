# Quickstart | Execução e evidências

## 1. Preparação
Executar em worktree/branch isolada; verificar scripts e ferramentas reais do repo. Exemplos de comandos, adaptar aos manifests e workflows existentes:
```bash
git status --short
git rev-parse HEAD
rg -n 'useCompanyLocationData|useLocationData|useCitiesOptions|getTotalCount|NEXT_SERVER_ACTIONS_ENCRYPTION_KEY' AB0-1-front AB0-1-back .github
```
Nunca imprimir secrets, docker inspect completo com envs ou HAR bruto com tokens. Validar configuração de chave SSR pelos mecanismos seguros existentes.

## 2. TDD
Frontend: Jest/Testing Library, deferred promises, fake timers, storage corrupt/quota/blocked, same UF dedup, unmount, SSR, rapid selection, multi-UF, count races. Backend: RSpec request/model/query, cache/ETag, warmup, count, active status, search semantics. Proxy: exact allowlist and negative security cases. E2E: Playwright em Chromium real, usar outros browsers se matriz existente; offline e rede simulada, screenshot e métricas. Rodar comandos definidos no package.json/Gemfile e CI; não inventar scripts. Não usar --forceExit.

## 3. Benchmark
- Registrar SHA, imagem, ambiente, hardware, versão browser, rede, compressão, flag, data/hora UTC, volume de dados. Separar cold worker, cold browser, warm RAM, warm storage, HTTP 304, CDN MISS/HIT e SW offline.
- Coletar pelo menos 30 amostras por cenário de latência estável (100 para concorrência); reportar p50/p95/max, erros e tamanho amostral. Para primeiro hit pós-restart, repetir em staging com no mínimo 5 boots controlados, indicar limitação amostral; não reiniciar produção para benchmark. Definir perfil de rede reproduzível e não atribuir RTT externo ao código.
- Medir tempo de cache com performance.now(), commit/pintura com browser trace e marcas, TTFB com curl/browser, X-Runtime, payload gzip, número de GETs, render/DOM nodes, bundle, memória, boot/readiness. Comparar antes/depois no mesmo perfil. Não confundir 304 com edge HIT.
```bash
# Exemplos seguros em ambiente de staging, substituir URL aprovada.
BASE=https://staging.example.invalid
curl -sS --compressed -D /tmp/geo-headers.txt -o /tmp/geo-body.json \
  -w 'status=%{http_code} ttfb=%{time_starttransfer} total=%{time_total} bytes=%{size_download}\n' \
  "$BASE/api/v1/companies/cities?state=SC"
# Repetir com If-None-Match contendo o ETag retornado; validar 304 e body vazio.
```
- Carga: staging representativo, taxa e duração documentadas, compare p95 e recursos; sem carga em produção sem aprovação. EXPLAIN (ANALYZE, BUFFERS) somente em ambiente autorizado, com dados representativos.

## 4. CI/CD e evidências
CI: lint, typecheck, testes unit/integration, RSpec, build, E2E e scans existentes; executar Lighthouse/visual quando pipeline suportar; incluir paths da spec nas regras de disparo. Não criar pipeline duplicado. CD: mesma revisão nos containers, health/readiness, migrations aprovadas, smoke, rollback. Produção exige política/autorização.

Estrutura de evidência sugerida `specs/019-pwa-geographic-filter-performance/evidence/`: baseline.md, after.md, test-results.md, security-cache.md, db-explain.md, screenshots/ (sanitizados), release.md. CI pode guardar artefatos grandes fora do Git. Evidência faltante = BLOCKED ou NOT RUN, nunca PASS.
