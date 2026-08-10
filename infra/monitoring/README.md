# Monitoramento de Banner Ads

`banner-alerts.yml` contém regras Prometheus para ingestão, reconciliação, atribuição e latência.

Adicionar ao Prometheus da operação:

```yaml
rule_files:
  - /etc/prometheus/rules/banner-alerts.yml
```

As regras usam somente métricas agregadas; não incluem company_id, usuário, IP, URL ou identificadores de campanha.


## Resposta a alertas

- `BannerEventDiscardRateHigh`/`BannerBotDiscardRateHigh`: consultar `discard_reasons_24h`, user agents e IPs; não reprocessar eventos descartados automaticamente.
- `BannerOperationalHealthStale`: verificar Sidekiq, Redis, PostgreSQL e `BannerStatsReconciliationJob`; confirmar `last_aggregated_at`.
- `BannerReconciliationDivergence`: executar reconciliação do dia afetado e preservar divergência para auditoria.
- `BannerAttributionErrors`: verificar UTMs, lead e `BannerAttributionService`; não apagar eventos.
- `BannerOperationalHealthSlow`: verificar cache, volume de banners e queries sem índice.
