# Modelo de dados alvo

## Identidade

Proposta: `companies.primary_category_id` nullable, FK para `categories`. Nulo é válido para empresa legada sem escolha governada. Validação exige associação simultânea via `categories_companies`.

## Verificação e confiança

Não duplicar dados antes de inspecionar ciclo de vida de `CompanyTrustScore` e status business verification. Contrato API normaliza status no backend. `companies.verified` fica como compatibilidade durante rollout.

## Comercial e distribuição

`plan_id`/`plan_status` e resolvers existentes são fonte atual do plano/entitlement. `featured` e `sponsored` são sinais distintos de distribuição. `priority_score` não é rótulo de produto nem rank público.

## Reconhecimento

`badges` + `company_badges` representam reconhecimento existente. Schema não tem concessor, evidência, validade ou revogação; decisão necessária antes de novas colunas.

## Migração

Expand-only: adicionar FK nullable/index sem backfill automático. Não escolher `categories.first`. Sem evidência explícita, manter `NULL`. Rollback remove somente coluna/FK/índice novos após compatibilidade.
