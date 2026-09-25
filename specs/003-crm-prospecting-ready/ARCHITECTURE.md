# Arquitetura operacional do CRM

## Fluxo existente

`Next.js /dashboard/sales → REST /api/v1/sales → Sales::BaseController → TenantScope/RBAC/Pundit → services/models → PostgreSQL → Sidekiq → provider → webhooks → eventos/timeline/analytics`.

Campanhas reaproveitam `AudienceResolver`, `Preflight`, `SnapshotService`, `Dispatcher`, `CampaignSchedulerJob`, `CampaignBatchProcessorJob` e `SendEmailJob`. Nenhuma segunda engine foi criada.

## Limites atualizados

- Requests Sales autenticados passam por `Sales::AuthorizationService` e `TenantScope`; Today filtra owner por padrão e permite equipe apenas por permissão.
- Tracking web público usa `TrackingSite` por tenant, public key server-generated, allowlist de origens exatas e CORS dinâmico; o endpoint cria session/anonymous IDs e event UUID sem aceitar IDs comerciais internos.
- UI de tracking carrega/salva origens pela API autenticada, apresenta script server-served e permite rotacionar a chave; associação a Contact continua sendo ação autenticada.
- SES health consulta conta e identidade fora de test. Apenas credenciais presentes não significam provider operacional.
- `SALES_EMAIL_SENDING_ENABLED` é um kill switch fail-closed. Campanha é mantida sem envio quando desligado; cadência pausa preservando step.
- SNS verifica assinatura, tópico, timestamp e URL/certificado antes de aceitar evento.
- Cadência tem definição (`EmailSequence/Step`) separada de execução (`Enrollment/EnrollmentStep`), scheduler de minuto e processor com lock por enrollment.
- Forms públicos resolvem `public_key` opaca, conferem tenant/campaign, validam payload pela definição do formulário e não aceitam IDs comerciais fornecidos pelo browser.

## Estados de campanha

Estados existentes são mantidos: `draft`, `scheduled`, `dispatching`, `paused`, `completed`, `failed`, `cancelled`. A transição exige preflight antes de schedule/dispatch/resume. O envio desabilitado ou preflight inválido não transforma registro local em sucesso de provider.

## Limites conhecidos

- O lock de campanha ainda tem fallback permissivo quando Redis não está disponível; capacidade de concorrência/cotas e rate limits precisam ser fechados antes de campanha comercial.
- Não foi localizada integração inbound que receba reply. Há detecção da existência de evento `replied`, mas sem o inbound operacional o auto-stop por resposta não é comprovado.
- SES não foi consultado em conta real; o snippet de tracking não foi executado em browser/staging. Rack::Attack usa MemoryStore neste checkout, sem quota distribuída.
