# Contrato de Analytics v3

Implementação do contrato definido no PDR de auditoria de Growth/PostHog.

## Envelope obrigatório

Eventos aceitos pelo frontend e Rails carregam, quando aplicável:

- `event_id`: identidade de transporte/idempotência;
- `occurrence_key`: identidade da ocorrência lógica para exposições;
- `correlation_id`: vínculo entre microconversão e fato de domínio;
- `schema_version: 3.0.0` e `contract_version: analytics_contract_v3`;
- `event_origin` (`frontend`, `backend`, `server` ou `system`);
- `producer`, `surface_kind`, `traffic_actor_class` e `consent_analytics`.

`event_id` não substitui `occurrence_key`. Cliques reais podem ter IDs distintos; impressões e visualizações semânticas usam chave estável por sessão, entidade e posição.

## Fonte autoritativa

| Fato | Fonte | Evento | Regra |
| --- | --- | --- | --- |
| Navegação | PostHog JS | `$pageview` | pathname lógico; query não cria pageview |
| Perfil/CTA | Frontend | `company_profile_viewed`, `company_cta_clicked` | microconversão; CTA inclui `cta_type` |
| Lead | Rails/DB | `lead_created` | somente após persistência; `lead_id` idempotente |
| Ativação | Rails/DB | `company_activated` | transição de domínio confirmada |
| Assinatura | Billing/outbox | `subscription_activated` | transição elegível confirmada |
| Pagamento | Stripe webhook | `invoice_paid` | invoice idempotente; não inferir por clique |
| Inventário | Banner viewability | `banner_view` / `banner_viewable_impression` | impressão visível, slot e critério documentados |

Microinterações frontend não são reenviadas ao PostHog pelo Rails. Fatos server-side são encaminhados pelo Rails após persistência.

## Atribuição e privacidade

- UTMs first-party não são adicionadas a links internos.
- `first_external_touch` e `last_external_touch` preservam aquisição externa.
- `last_internal_interaction` registra promoção interna separadamente.
- `traffic_actor_class=internal_staff` e `surface_kind` técnico são excluídos de aquisição.
- Sanitização remove PII antes de PostHog e persistência analítica.

## Rollout e aceitação

1. Migrar banco com `20261110090000_add_analytics_contract_v3`.
2. Validar contrato em staging com consentimento concedido e negado.
3. Reproduzir uma visita, perfil, CTA, wizard e lead; conciliar `correlation_id` e `lead_id`.
4. Conferir reentrega de webhook e remount de blog/banner.
5. Só depois atualizar Goals/dashboards PostHog usando nomes reais e filtros de superfície/ator.

Histórico não deve ser reprocessado automaticamente nem somado a séries v3 sem consulta versionada.
