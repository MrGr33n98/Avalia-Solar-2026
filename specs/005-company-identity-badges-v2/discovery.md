# Discovery — evidência do estado atual

## Git

- BASE_SHA: `5196d9850be0fd079054195085c6839fce383624` (`origin/main` após fetch)
- BRANCH: `feat/company-identity-badges-v2`
- WORKTREE: `C:\Users\Bobi\Desktop\Avalia-Solar-2026-company-identity`
- Checkout original tinha `interface-design/` não rastreado; preservado fora do worktree.

## Backend e schema

- `AB0-1-back/db/schema.rb:637` cria `categories`; schema não contém `primary_category_id`.
- `schema.rb:665-670` usa join table N:N `categories_companies`.
- `schema.rb:939-1023` inclui `featured`, `verified`, `plan_id`, `plan_status`, `trust_score`, `priority_score`, `sponsored`.
- `schema.rb:233-245,1125-1132` define `badges` e associação `company_badges` com unicidade por par, sem trilha de concessão.
- `app/models/company.rb:152-154` declara categorias N:N; `:214-216` associa badges e `CompanyTrustScore`.
- `app/serializers/company_card_serializer.rb:24-26` retorna `categories.first&.name` como `primary_category`, sem identidade persistida.
- `company_card_serializer.rb:84-91` calcula estado em `trust` e usa fallback de `verified`; serializers também expõem boolean top-level.
- `app/models/company.rb:809-823,1044-1055` calcula plano/tier no backend.
- `company.rb:386-400` usa `sponsored` e `priority_score` na colocação patrocinada.
- `CompanyTrustScore` separado e `companies.trust_score` coexistem; fonte autoritativa não foi confirmada.

## Consumidores web/mobile confirmados

- Web `app/companies/[id]/components/CompanyIdentityCard.tsx:45-49,168-173`: combina fontes de verificação, escolhe `category_info` ou primeira categoria e renderiza categoria sem link.
- Web `components/compare/compare-company-utils.ts:11-12`, `CompanyComparisonCard.tsx:28`, `PremiumCompanyBanner.tsx:36`, `ComparisonToggleButton.tsx:49-50`: inferem premium com `featured || plan_status === 'active' || has_paid_plan`.
- Web `components/compare/mapCompanyToCompareCompany.ts:153`: repete inferência.
- Web `app/companies/[id]/CompanyDetailClient.tsx:512,610-613`: usa `priority_score >= 100` para WinnerBadge/rank.
- Web `app/categories/[slug]/CategoryPageClientV2.tsx:347-358`: patrocinado interage com sinais comerciais; validar linhas antes de alterar.
- Mobile `src/app/company/[id]/lead.tsx:68`: usa `categories[0]`.
- Mobile `src/lib/api.ts:37-55`: tipo REST tem `has_paid_plan`, `verified`, `featured`, `categories`, sem contrato canônico de identity/commercial.
- Mobile `src/app/company/[id].tsx:190-199`, `services.tsx:136-154`: gated CTA usa `has_paid_plan` diretamente.
- Mobile GraphQL `src/lib/queries/home.ts:3-16,51-62`: seleciona `isVerified/isFeatured/isSponsored` em vez de contrato REST compartilhado.

## Fontes REST e cobertura

Backend tem `CompanyCardSerializer`, `CompanyListSerializer`, `CompanySerializer`; controller seleciona projeções distintas (`companies_controller.rb:605-629`). GraphQL tem `CompanyType`/`MapCompanyType`. Web detail chama REST `/api/v1/companies/:id`; badges também têm endpoint próprio.

## Lacunas

Busca inicial encontrou backups dentro das árvores Rails; não são código ativo. Falta consolidar inventário completo, decisões de regras comerciais restantes e conteúdo que vinha após o cabeçalho “VERIFICATION != PREMIUM”. Banco de produção não foi consultado; nenhum backfill foi executado.
