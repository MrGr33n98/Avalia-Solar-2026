# Runbook Operacional & Arquitetura — Reviewer Brands & Solutions Ecosystem

## 1. Visão Geral
O ecossistema **Reviewer Brands & Solutions** permite que avaliadores, engenheiros e integradores solares declarem equipamentos, marcas e projetos com os quais atuam de forma 100% factual, transparente e em estrita conformidade com as diretrizes de design IBM Carbon e a LGPD (Lei 13.709/2018).

---

## 2. Princípios Inegociáveis (Anti-Slop & Truthfulness)
1. **Zero Métricas Falsas**: Nunca inventar "+20 pontos no Green Score", métricas de CO₂ não calculadas ou status "Em análise" derivado de contagens.
2. **Monogramas Oficiais vs Ícones Genéricos**: Fabricantes utilizam logotipo oficial cadastrado ou monograma tipográfico padronizado (`BrandAvatar` / `fallbackInitials`). Ícones genéricos (`Zap`, `Cpu`) são terminantemente proibidos para representar fabricantes.
3. **Isolamento de Privacidade (Private by Default)**: Todo novo vínculo de marca ou projeto é gravado como `private`. A transição para `public` exige consentimento explícito e versão de termos (`reviewer-brands-v1` / `reviewer-projects-v1`).
4. **Sem Verificação Automática por Review**: A aprovação de uma avaliação de produto/empresa pela moderação NÃO altera o status da marca para `evidence_verified`. Apenas laudos técnicos e comprovações documentais homologadas alteram o status.
5. **Defesa IDOR e Multitenancy**: Todas as operações de leitura, edição e deleção em endpoints `/api/v1/reviewer/*` são estritamente filtradas por `current_user`.

---

## 3. Arquitetura de Dados (PostgreSQL / Rails 7)

```
[Brand] (Catálogo Canônico)
   ▲
   │ belongs_to :brand
   │
[ReviewerBrandUsage] (Declarações do Usuário)
   ├── user_id: references User
   ├── brand_id: references Brand
   ├── usage_context: enum (personal_owner, integrator_install, designer_specification, maintenance, reseller)
   ├── source: enum (manual, review_form, import_reviewed)
   ├── source_review_id: references Review (optional)
   ├── verification_status: enum (self_declared, under_review, evidence_verified, rejected)
   ├── visibility: enum (private, public)
   └── lock_version: integer (concurrency control)
   ▲
   │ belongs_to :reviewer_brand_usage
   │
[ReviewerPortfolioProjectBrand]
   ▼
[ReviewerPortfolioProject] (Projetos e Obras)
   ├── user_id: references User
   ├── title: string
   ├── project_type: enum (residential, commercial, rural, industrial, ev_charging, bess_storage)
   ├── capacity_kwp: decimal
   ├── completed_at: date (cannot be in the future)
   └── visibility: enum (private, public)
```

---

## 4. Endpoints REST & Rate Limits (Rack::Attack)

| Endpoint | Método | Descrição | Rate Limit |
|---|---|---|---|
| `/api/v1/brands` | GET | Busca e catálogo de fabricantes canônicos | 120 req/min |
| `/api/v1/reviewer/brand_usages` | GET, POST | Listagem e criação de vínculos | 30 req/min (write) |
| `/api/v1/reviewer/brand_usages/:id` | PATCH, DELETE | Atualização de visibilidade e soft delete | 30 req/min (write) |
| `/api/v1/reviewer/brand_experience_summary` | GET | Indicadores reais consolidados | — |
| `/api/v1/reviewer/portfolio_projects` | GET, POST | Listagem e cadastro de obras | 20 req/min (write) |
| `/api/v1/reviewer/portfolio_projects/:id` | PATCH, DELETE | Edição e exclusão de obras | 20 req/min (write) |
| `/api/v1/reviewer/portfolio_projects/summary` | GET | KPIs de projetos e potência total em kWp | — |
| `/api/v1/creators/:slug` | GET | Perfil público (Creator DTO com marcas e projetos públicos) | Cache 5 min (`v4`) |

---

## 5. Caching e Invalidação Imediata
- **Chave de Cache do Creator**: `creator/public-profile/#{profile.public_slug}/v4`
- **Invalidação**: Callbacks `after_commit :invalidate_creator_cache` em `ReviewerBrandUsage` e `ReviewerPortfolioProject` acionam `Creator::PublicProfileService.invalidate_for_user(user)` sempre que um registro for alterado, tornado privado ou removido.
- **Revogação Global em Configurações**: A aba *Privacidade* em `/review-dashboard/settings` disponibiliza ação de 1 clique para revogar o consentimento público de todas as marcas, voltando-as para `private` e invalidando os caches instantaneamente.

---

## 6. Procedimentos de Troubleshooting

### Problema: "Conflito de concorrência detectado (code: CONFLICT)"
- **Causa**: Duas abas ou requisições simultâneas tentaram atualizar o mesmo registro com `lock_version` defasado.
- **Resolução**: Recarregar os dados na UI (`loadData`) para obter a versão mais recente e reaplicar a alteração.

### Problema: "Data de início ou conclusão não pode ser futura"
- **Causa**: O usuário preencheu data superior a `Date.current`.
- **Resolução**: Validar que instalações registradas já foram efetivamente iniciadas ou concluídas.

### Problema: "Consentimento obrigatório para visibilidade pública"
- **Causa**: Tentativa de salvar `visibility: 'public'` sem `consent_confirmed: true` e `consent_version: 'reviewer-brands-v1'`.
- **Resolução**: O usuário deve marcar explicitamente o checkbox de consentimento antes de publicar.
