# Semântica comercial

- Plano: `Company#plan`/`plan_id` e status comercial resolvido no backend.
- Tier: calculado por `Plan#inferred_plan_tier` e `PlanFeatureCatalog`; cliente não repete heurística.
- Paid: método existente `has_paid_plan?`; semântica para trial/inadimplência precisa revisão antes de congelar.
- Entitlements: resolver existente `CompanyFeatureAccessResolver`/`feature_access`; não misturar com featured.
- `featured`/`sponsored`: distribuição, não plano, verificação ou badge de mérito.
- Regra para `promoted` ainda não foi encontrada; não inventar persistência/equivalência.

Revisar specs de billing/segurança antes de alterar `has_paid_plan?` ou autorização de recursos.
