# Contrato API

## Payload canônico proposto

```json
{
  "identity": {
    "primary_category": { "id": 70, "name": "Mobilidade Elétrica", "slug": "mobilidade-eletrica" },
    "verification": { "status": "verified", "verified": true, "verified_at": null, "method": null }
  },
  "commercial": { "plan_tier": "free", "plan_status": "inactive", "paid": false, "entitlements": {} },
  "distribution": { "featured": false, "sponsored": false, "promoted": false },
  "recognition": { "badges": [] },
  "trust": { "trust_score": null, "reviews_count": 0 }
}
```

Exemplo descreve forma, não valores/defaults garantidos. Implementação deve usar fonte real e preservar `null`.

## Projeções

REST tem `CompanyCardSerializer`, `CompanyListSerializer`, `CompanySerializer`; GraphQL tem `CompanyType` e `MapCompanyType`. Cobertura/consistência endpoint a endpoint permanece pendente.

## Compatibilidade

Adicionar objetos sem remover campos legados inicialmente. Clientes migram para objetos explícitos; remover alias apenas em rollout/versionamento posterior.
