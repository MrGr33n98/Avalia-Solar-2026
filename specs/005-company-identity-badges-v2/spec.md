# Spec 005 — Identidade, plano comercial, confiança e badges

## Estado

Discovery inicial em andamento. Baseline: `5196d9850be0fd079054195085c6839fce383624` (`origin/main`, 2026-09-26). Nenhuma implementação validada por testes.

## Problema

O domínio mistura conceitos em campos e projeções diferentes. `companies` mantém `featured`, `verified`, `sponsored`, `priority_score` e `trust_score`. `CompanyCardSerializer` expõe blocos `identity` e `trust`, mas calcula `primary_category` por `categories.first`. Clientes web também derivam rótulos comerciais combinando flags legadas.

## Objetivo

Separar categoria primária, verificação, plano/entitlements, distribuição, reconhecimento, ranking e TrustScore. Backend define semântica; web e mobile renderizam contratos explícitos.

## Contrato alvo

- `identity.primary_category`: `{ id, name, slug }` ou `null`; nunca inferido pela posição da associação.
- `identity.verification`: `{ status, verified, verified_at, method }`; verificação não implica plano pago.
- `commercial`: tier/status/paid/entitlements explícitos e originados no backend.
- `distribution`: `featured`, `sponsored`, `promoted` explícitos.
- `recognition.badges`: reconhecimentos governados, separados de verificação e plano.
- `trust`: TrustScore e sinais de autoridade separados da verificação.

## Critérios de aceite

1. Categoria primária tem fonte persistida e governança; legado ambíguo fica `null`.
2. Serializadores REST entregam contratos canônicos.
3. Clientes não inferem categoria principal ou status comercial de combinações legadas.
4. Verificação nunca aparece como premium; badge de categoria navega para `/categories/{slug}`.
5. Web e mobile cobrem contrato, estados nulos e legado.
6. Migração tem backfill determinístico, auditável e reversível; não converte `priority_score` em ranking/reconhecimento.

## Limite do prompt recebido

O conteúdo recebido termina no cabeçalho “VERIFICATION != PREMIUM”. Regras posteriores não foram fornecidas; semânticas além dos requisitos explícitos permanecem pendentes de validação do produto.
