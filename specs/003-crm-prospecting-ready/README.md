# CRM Prospecting Ready

## Objetivo

Endurecer o CRM existente para prospecção com isolamento por tenant, consentimento, email verificável, campanhas idempotentes, cadências, tracking e operação auditável. Este artifact acompanha o código na branch `feat/crm-prospecting-ready`; não declara liberação comercial.

## Estado atual

- Corrigidos contratos de revogação, fila Today por owner, escopos de relações comerciais e limites dos endpoints internos de tracking.
- Criados health check SES, kill switch, verificação de envelope SNS, unsubscribe assinado e execução persistida de cadências.
- As migrations de enrollment/cadência, `public_key` de forms e TrackingSite/sessões foram aplicadas somente no PostgreSQL descartável de teste e refletidas no `db/schema.rb`.
- Suíte Sales request/service/job/model/query/policy passou: 279 exemplos, 0 falhas. `tsc --noEmit` passou; ESLint focado será repetido no fechamento.
- Tracking público tem chave por tenant, origem/CORS, snippet server-served e ingestão idempotente; segue sem browser E2E, Lead creation e attribution até opportunity.
- Form público usa chave opaca, allowlist, limites e idempotência; ainda não converte submission em Lead/Contact.
- SES real, delivery, bounce/complaint recebidos de AWS, inbound reply, tracking browser e E2E em staging não foram exercitados.

## Gate de operação

Use [GO_LIVE_CHECKLIST.md](GO_LIVE_CHECKLIST.md) e [TEST_MATRIX.md](TEST_MATRIX.md). Até haver inbox inbound e uma conta SES verificada em staging, o estado máximo permitido é **CRM CORE READY / EMAIL GO-LIVE BLOCKED**, condicionado aos demais gates.

## Artifacts

- [Discovery](DISCOVERY.md) · [Tasks](TASKS.md) · [Architecture](ARCHITECTURE.md)
- [API contracts](API_CONTRACTS.md) · [Data model](DATA_MODEL.md) · [Test matrix](TEST_MATRIX.md)
- [Operations](OPERATIONS.md) · [Email runbook](EMAIL_RUNBOOK.md) · [Campaign runbook](CAMPAIGN_RUNBOOK.md)
- [Cadence runbook](CADENCE_RUNBOOK.md) · [Tracking runbook](TRACKING_RUNBOOK.md) · [Go-live](GO_LIVE_CHECKLIST.md)
