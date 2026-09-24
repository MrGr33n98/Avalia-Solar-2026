# Workspace Tracking & Atribuição — v1

## Entrada

A navegação adiciona Tracking & Atribuição ao grupo Performance:

~~~text
/dashboard?company_id=:id&tab=tracking-attribution
~~~

A aba é core e não usa FeatureGuard. O entitlement advanced_analytics altera profundidade, não existência do workspace.

## Subabas

1. Visão geral: saúde da mensuração e fonte/período.
2. Gerador de links: criação local de UTM de entrada; nada é salvo automaticamente.
3. Atribuição: canais core, First Touch/Last Touch, campanhas e exportação CSV para entitlement avançado.
4. Diagnóstico: eventos, cobertura de identidade/UTM, click IDs, surface e placement quando disponíveis.
5. Configuração: regras de entrada, origem de saída, separação patrocinado/orgânico e estado de conversão.

## API

Endpoint:

~~~text
GET /api/v1/company_dashboard/analytics/tracking_workspace
~~~

Parâmetros aceitos: company_id, from, to, preset, timezone e attribution_model (first_touch ou last_touch). A resposta é sempre limitada à empresa autorizada.

Envelope:

~~~json
{
  "version": "tracking-attribution-v1",
  "status": "ready|empty|unavailable|processing|error",
  "data_source": "analytics_events",
  "range": { "from": "2026-09-01", "to": "2026-09-30" },
  "summary": null,
  "channels": [],
  "campaigns": [],
  "cta_matrix": [],
  "landing_pages": [],
  "health": { "status": "attention", "healthy": 0, "total": 6, "items": [] },
  "diagnostics": { "components": [] },
  "capabilities": {
    "core": true,
    "advanced": false,
    "saved_links": false,
    "export": false,
    "conversion_tracking": "not_configured"
  },
  "policy": {
    "inbound_source": "configurable",
    "outbound_source": "avaliasolar",
    "ads_source": "avaliasolar_ads",
    "internal_identity": "click_id/impression_id/delivery_id"
  }
}
~~~

Falha de consulta retorna status unavailable, policy completa e error code sem mensagem interna. A UI para antes dos painéis e informa indisponibilidade; empty continua sendo estado separado.

## Entitlements

| Capacidade | Core | Avançado |
| --- | --- | --- |
| Receber e diagnosticar tracking | sim | sim |
| Gerador UTM de entrada | sim | sim |
| Canais e modelo First/Last Touch | sim | sim |
| Campanhas e detalhamento profundo | limitado | sim |
| Exportação CSV | não | sim |
| Links salvos | não implementado | não implementado |
| Conversão configurada | não configurado | não configurado |
| Integrações externas | não implementado | não implementado |

Nenhuma capacidade ausente recebe dado fictício. Links salvos, conversão e integrações exigem contrato de persistência/integração próprio antes de serem liberados.

## Observabilidade e segurança

- Backend reutiliza AnalyticsEvent, TrackEventService, EventTaxonomy, AttributionClassifier e AttributionQuery.
- Sem migration nova nesta entrega.
- Pundit protege a empresa; a query aplica company_id no backend.
- UTM e exportação não devem conter PII.
- Error response contém request_id, nunca exceção ou credencial.
- O health card usa texto, ícone e estado sem depender apenas de cor.

## Critérios de aceite

- Aba abre pela URL canônica e navegação não bloqueia plano gratuito.
- 0 observado continua 0; unavailable não vira 0.
- Direct e Unknown permanecem distintos.
- First Touch e Last Touch são selecionáveis.
- Destino externo recebe origem controlada e company_id validado.
- Retry do mesmo click não cria nova contagem quando o produtor reenvia event_id estável (click_id sozinho é correlação).
- Tenancy, empty, unavailable, URL segura e exportação têm cobertura de teste.
