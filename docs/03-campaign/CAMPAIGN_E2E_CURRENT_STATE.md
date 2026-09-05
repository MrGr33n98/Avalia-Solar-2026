# Estado atual do Campaign Workstation

Status: NOT CERTIFIED. Discovery local em 5 de setembro de 2026.

| Camada | Evidência | Lacuna |
| --- | --- | --- |
| Rotas Next.js | campaigns/page.tsx e campaigns/[id]/page.tsx | Rotas estáticas de audiences/templates/sequences e ID numérico validado |
| API frontend | lib/api-campaigns.ts | Timeout de 20s e erro explícito para JSON inválido |
| Audiências | AudiencesController; AudienceResolver | Preview/segmentos e CRUD de audiência salva; builder avançado ainda pendente |
| Templates | EmailTemplatesController; Sales::EmailTemplate | CRUD/preview reais; preflight e test-send avançados ainda pendentes |
| Sequências | EmailSequencesController; EmailSequence/Step | CRUD existente; execução ainda não comprovada |
| Campanhas | CampaignsController; CampaignPolicy | Snapshot/dispatch/pause/resume/retry/cancel; verificar contratos e isolamento |
| Jobs | CampaignBatchProcessorJob; SendEmailJob | Idempotência de mensagens existentes corrigida; confirmação externa ainda não comprovada |
| Preflight | Sales::Campaigns::Preflight | Resumo usa total_count; provider permanece não verificado sem evidência externa |
| Métricas | MetricsCalculator; campaign_daily_metrics | CTR usa aberturas como denominador; persistência E2E pendente |
| Provider/tracking | messaging/providers/ses; ses_webhooks; email_events; tracking_rewriter | Specs existentes; certificação real pendente |
| Banco | migrations 20260905 de campanhas/recipients/metrics/indexes | Executar schema, constraints e EXPLAIN |
| CI | campaign-certification.yml; docker-compose.campaign-cert.yml | Smoke Rails não substitui browser E2E autenticado |

Não houve envio externo nem alteração de produção durante discovery.

Atualização: P0 routing/loading corrigido; rotas estáticas e regressões adicionadas. Audiência dinâmica canônica adicionada, mas UI agora salva audiência dinâmica via API; edição/duplicação ainda pendentes.

Deliverability: rotas de domínio, remetente e deliverability criadas; exibem unavailable até integração real de verificação.

Sequences: criação e listagem UI usam `email_sequences` real; steps/enrollment ainda sem engine.
