# Guia de Operações e Execução de Campanhas — Marketing Workspace

> **Status:** Ativo  
> **Diretório:** `docs/03-campaign/`  
> **Data:** Setembro 2026

---

## 1. Operações Suportadas no Ciclo de Vida da Campanha

| Operação | Método / Endpoint | Descrição |
| --- | --- | --- |
| **Criar Rascunho** | `POST /api/v1/sales/campaigns` | Registra parâmetros de público e template. Status: `draft`. |
| **Estimar Audiência** | `GET /api/v1/sales/audiences/estimate` | Calcula contatos legíveis e excluídos por LGPD/supressão. |
| **Iniciar Disparo** | `POST /api/v1/sales/campaigns/:id/dispatch` | Gera snapshot imutável e enfileira batches Sidekiq. Status: `sending`. |
| **Pausar Campanha** | `POST /api/v1/sales/campaigns/:id/pause` | Interrompe o envio de novos lotes imediatamente. Status: `paused`. |
| **Retomar Campanha** | `POST /api/v1/sales/campaigns/:id/resume` | Retoma o processamento dos lotes pendentes. Status: `sending`. |
| **Re-tentar Falhas** | `POST /api/v1/sales/campaigns/:id/retry_failed` | Coloca destinatários com falha (`failed`) de volta em `pending`. |

---

## 2. Controle de Concorrência e Redis

### Keys no Redis
- `campaign:dispatch_lock:<campaign_id>`: Mutex com TTL de 60s para evitar disparos duplicados concorrentes.
- `campaign:rate_limit:<account_id>`: Rate limiter de 10.000 requisições/minuto via `Rack::Attack`.

### Queues no Sidekiq
- `queue: :mailers` — Prioridade alta para disparo dos emails individuais (`Sales::SendEmailJob`).
- `queue: :default` — Orquestração de batches (`Sales::CampaignBatchProcessorJob`).

---

## 3. Resposta a Falhas & Recovery

1. **Worker Crashes / Worker Timeout**:
   - Destinatários não marcados como `sent` permanecem em estado `pending` e são reprocessados no próximo ciclo ou via `retry_failed`.
2. **Provider Throttling (SES Rate Limits)**:
   - Respostas HTTP 429 do provider ativam exponential backoff com jitter no Sidekiq.
3. **Pausas de Emergência**:
   - O comando `pause` altera o status na base PostgreSQL, fazendo com que workers em andamento abortem a execução do lote imediatamente antes da chamada SES.
