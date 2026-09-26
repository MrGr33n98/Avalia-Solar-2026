# API contract — Timeline V2

## GET opportunity timeline

Contrato alvo versionado sem quebrar consumidores legados durante rollout:

```json
{
  "timeline": [{
    "id": "email:321",
    "kind": "email",
    "occurred_at": "2026-09-26T12:00:00Z",
    "actor": {"id": 12, "name": "Felipe", "avatar_url": null},
    "email": {
      "id": 321,
      "direction": "outbound",
      "subject": "Convite",
      "preview": "Oi João, tudo bem?...",
      "from": "sales@example.test",
      "to": ["joao@example.test"],
      "delivery_status": "delivered",
      "engagement_status": "open_signal"
    },
    "engagement": {
      "raw_open_signals": 2,
      "unique_open_signals": 1,
      "human_likely_open_signals": 0,
      "proxy_open_signals": 1,
      "bot_open_signals": 0,
      "raw_clicks": 0,
      "unique_clicks": 0,
      "replies": 0
    },
    "lifecycle": []
  }],
  "meta": {"cursor": "983"}
}
```

Dados de exemplo são ilustrativos, não resultado do sistema. O cursor atual é uma sequência decimal monotônica por opportunity, não um token opaco. `GET .../timeline?after=<cursor>` retorna itens de email alterados desde a sequência, sem corpo inteiro de email. A expiração explícita do cursor e paginação não estão implementadas nesta entrega. Autorização e TenantScope resolvem Opportunity antes da query. Erros mantêm envelope Sales existente.

Lifecycle event fields: `type`, `occurred_at`, `source`, `signal_class?`, `classification_reasons?`. Campos técnicos detalhados ficam restritos a permissão autorizada.
