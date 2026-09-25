# Operação do CRM

## Modo seguro

- `SALES_EMAIL_SENDING_ENABLED` deve permanecer `false` até aprovação explícita do staging/provider, sender verificado e limite de destinatários definido.
- O `.env.example` documenta o switch e a identidade SES sem expor valores secretos.
- Jobs em campanhas interrompidas pelo switch não devem fazer fallback inline. Enrollment de email pausa preservando a etapa.
- Não configurar limites comerciais até implementar e validar cota por minuto/hora/dia, concorrência por campanha/tenant e kill switch observável.

## Filas e scheduler observados

`config/sidekiq_schedule.yml` agenda `CampaignSchedulerJob` e `EmailSequenceEnrollmentSchedulerJob` a cada minuto na fila `default`. `CampaignBatchProcessorJob` e `SendEmailJob` também usam `default`. Sidekiq/Redis em produção, dead jobs, retry policy, concorrência e draining de deploy ainda precisam ser comprovados operacionalmente.

## Saúde

`Sales::Messaging::Providers::HealthCheck` consulta SES apenas fora de `test` e classifica `not_configured`, `credentials_invalid`, `identity_unverified`, `sandbox_or_restricted`, `quota_exhausted`, `operational` ou `degraded`. Preflight exige `operational` e switch ativo. Essa consulta AWS ainda não foi executada nesta sessão.

Logs adicionados registram classes de erro e IDs operacionais sem email/corpo/credenciais em texto. Confirmar dashboards, alertas, métricas de fila e readiness no ambiente de deploy antes de abrir tráfego.

## Teste e banco

Use o banco de teste isolado e `RAILS_ENV=test`; nunca rode testes ou escrita de validação no database de produção. A migration deve ser aplicada uma vez no deploy normal conforme o processo de produção do repositório, após backup e plano de rollback aprovados.

Forms públicos têm throttles Rack::Attack de 10 envios/minuto por IP e 5/10 minutos pela chave do form. O initializer usa `MemoryStore`; os limites são locais ao processo e não substituem throttling distribuído no gateway em deploy com múltiplas réplicas.
