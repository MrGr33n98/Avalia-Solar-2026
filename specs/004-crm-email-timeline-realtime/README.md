# CRM Email Tracking + Timeline Realtime

Objetivo: tornar os sinais de email auditáveis, classificados, tenant-safe, recuperáveis e visíveis na timeline sem refresh manual. A feature reutiliza `Sales::EmailMessage`, `Sales::EmailEvent`, `Sales::EmailLink`, SNS/Ses, suppression, cadências e ActionCable existentes.

**Status inicial:** PLANNED. Nenhum gate operacional é considerado PASS por documentação ou teste unitário isolado. Pixels indicam carregamento de imagem; não comprovam leitura humana. Provider, inbox real, DNS, Nginx da VPS e deploy permanecem dependências externas.

## Artefatos

- [Spec](spec.md) · [Plan](plan.md) · [Tasks](tasks.md)
- [Data model](data-model.md) · [API contract](api-contract.md) · [Realtime contract](realtime-contract.md)
- [Tracking semantics](tracking-semantics.md) · [Privacy](privacy.md) · [Test matrix](test-matrix.md)
- [Operations](operations.md) · [Go-live checklist](go-live-checklist.md) · [Rollback](rollback.md)

## Escopo e limites

Inclui lifecycle outbound, tracking de pixel/link, ingestão autenticada de eventos SES, inbound reply por integração suportada, suppression/cadence, timeline V2, ActionCable com recovery delta, UX e observabilidade. Exclui envio ou deploy em produção por este agente. A prova final depende de mailbox sintética e ambiente staging controlado.
