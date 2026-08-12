# Recommendation Engine Contract

## Fonte e seleção

`Chat::CompanyRecommendationService` é fonte de verdade. Ele aplica elegibilidade, status ativo, localização, categoria/segmento, cobertura e disponibilidade. `CompanyRecommendationAgent` apenas apresenta lista pronta. LLM nunca escolhe empresa, reordena lista ou inventa empresa.

## Ordenação

Ordenação orgânica usa sinais de localização, cobertura, verificação, reputação e disponibilidade. Placement patrocinado deve ser explicitamente marcado; pagamento não pode ser convertido silenciosamente em ranking orgânico.

## Contrato por empresa

```json
{
  "id": 123,
  "placement": "organic",
  "sponsored_label": null,
  "sources": [
    {"type": "company_catalog", "id": 123},
    {"type": "company_profile", "id": 123}
  ]
}
```

`placement` aceita `organic` ou `sponsored`. Quando `sponsored`, frontend exibe `Patrocinado`. Fallback retorna lista vazia e motivo; nunca seleciona primeira empresa fora dos critérios.
