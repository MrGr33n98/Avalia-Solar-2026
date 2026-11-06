# Runbook de Rollout, Monitoramento e Rollback — Categorias SEO/GEO/AEO (`CDSI-116`..`CDSI-129`)

## 1. Fases de Rollout Seguro

1. **Fase 1 — Infraestrutura HTTP, Canonical, Sitemap e Paginação (`CATEGORY_INDEXATION_POLICY_MODE=shadow`):**
   - Deploy de backend + frontend mantendo `CATEGORY_INDEXATION_POLICY_MODE=shadow` (default).
   - Categorias inativas ou slugs inexistentes passam a responder HTTP `404` real antes do streaming SSR (`CDSI-009`..`CDSI-020`).
   - Slugs renomeados via `CategoryTaxonomy::RenameSlug` respondem redirect permanente `308` em 1 salto (`CDSI-042`..`CDSI-051`).
   - Sitemap dedicado `/sitemaps/categories/sitemap.xml` consome o feed cursor-paginado `/api/v1/categories/sitemap_feed` (`CDSI-031`..`CDSI-041`).
   - Categorias legadas ativas **não** são desindexadas automaticamente durante o modo `shadow`.

2. **Fase 2 — Backfill Editorial e Curadoria no ActiveAdmin:**
   - Executar task idempotente de snapshots editoriais:
     ```bash
     docker compose exec backend bundle exec rake category_editorial:backfill_baseline
     ```
   - Curar descrições longas (`>= 250` palavras), FAQs (`>= 3` publicadas) e tipos de solução no ActiveAdmin observando o painel **SEO Health Advisory & Preview SERP**.

3. **Fase 3 — Auditoria Comparativa (`shadow` vs `enforce`):**
   - Executar o script comparativo:
     ```bash
     bash scripts/seo/compare-indexability.sh tmp/category_indexability_comparison.json
     ```
   - Validar que `would_deindex_count` contém apenas categorias genuinamente vazias/rasas aprovadas pela equipe de SEO.

4. **Fase 4 — Ativação Controlada do Gate (`enforce`):**
   - Alterar variável de ambiente `CATEGORY_INDEXATION_POLICY_MODE=enforce` primeiro em **staging** e, após validação do Search Console, em **produção**.

---

## 2. Procedimento de Rollback em 3 Níveis (`CDSI-128`)

### Nível 1 — Rollback Imediato de Política de Indexação (< 1 min, sem redeploy de código)
Caso qualquer categoria legada perca indexação indevidamente após ativação do modo `enforce`:
1. Definir `CATEGORY_INDEXATION_POLICY_MODE=shadow` no ambiente do backend.
2. Reiniciar o serviço backend e disparar invalidação de cache:
   ```bash
   curl -X POST "${FRONTEND_URL}/api/revalidate" \
     -H "Authorization: Bearer ${NEXT_REVALIDATE_SECRET}" \
     -H "Content-Type: application/json" \
     -d '{"paths":["/categories","/sitemaps/categories/sitemap.xml"],"tags":["categories"]}'
   ```

### Nível 2 — Rollback de Conteúdo Editorial por Categoria (< 1 min via ActiveAdmin ou Console)
Caso uma publicação de revisão editorial degrade o conteúdo ou metadados de uma categoria:
- No ActiveAdmin (`/admin/categories/:id`), localizar o painel **Histórico de Revisões Editoriais** e clicar em **Rollback** na revisão anterior (`CategoryEditorial::RollbackRevision`).

### Nível 3 — Rollback de Código / Imagem Docker
Caso haja regressão de infraestrutura:
- Reverter para a tag de imagem GHCR anterior via workflow de deploy e executar `db:rollback` apenas das migrations aditivas se necessário (todas as migrations `20261106111500`, `20261106114500` e `20261106120000` são 100% aditivas e compatíveis com o código anterior).

---

## 3. Monitoramento Pós-Deploy (`CDSI-129`)

- **Google Search Console:** acompanhar cobertura de `/sitemaps/categories/sitemap.xml`, páginas excluídas por `noindex`, erros `Soft 404` e `Crawled - currently not indexed`.
- **Logs Estruturados Backend:** monitorar `[CategoryDiscovery::ShadowIndexability]` e `[CategoryDiscovery::CacheInvalidationJob]`.
- **Headers HTTP:** verificar `X-Canonical-Redirect-Slug`, `X-Nextjs-Cache` e status `404`/`503` em probes sintéticos.

