# Arquitetura do Sistema e Fluxo de Dados
## Avalia Solar — Instagram Autonomous Content Engine

**Documento:** Architecture Specification  
**Padrão:** Modular Workflows, Microservices & Outbox Pattern  
**Timezone:** `America/Sao_Paulo` (UTC-3)  

---

## 1. Visão Geral da Arquitetura

O sistema é desenhado de forma desacoplada, utilizando n8n como orquestrador de eventos, a API REST do Rails 7 como fonte da verdade de conteúdos, Next.js como gerador gráfico de alta fidelidade e a Meta Graph API oficial para entrega.

```text
+-----------------------------------------------------------------------------------+
|                               AVALIA SOLAR ECOSYSTEM                              |
|                                                                                   |
|  [Rails 7 API] ────> Articles, Categories, Slugs, Cover Images                    |
|  [Next.js App] ────> /api/social/render-post (1080x1350 High-Res Generator)       |
|  [PostHog API] <──── Telemetry: Discovery, Editorial, Approval, Publish, Failures |
+------------------------------------------┬----------------------------------------+
                                           │
                                           ▼
+-----------------------------------------------------------------------------------+
|                               n8n ORCHESTRATION LAYER                             |
|                                                                                   |
|   +---------------------------------------------------------------------------+   |
|   | WF-IG-00: Preflight & Meta Identity Check (Token & Permissions Validation)|   |
|   +---------------------------------------------------------------------------+   |
|                                          │                                        |
|   +---------------------------------------------------------------------------+   |
|   | WF-IG-01: Content Discovery & Deterministic Deduplication                 |   |
|   +---------------------------------------------------------------------------+   |
|                                          │                                        |
|   +---------------------------------------------------------------------------+   |
|   | WF-IG-02: AI Editorial Engine (Structured JSON Copywriting + Validation)   |   |
|   +---------------------------------------------------------------------------+   |
|                                          │                                        |
|   +---------------------------------------------------------------------------+   |
|   | WF-IG-03: Media Render Engine (1080x1350 PNG/JPEG Generation)             |   |
|   +---------------------------------------------------------------------------+   |
|                                          │                                        |
|   +---------------------------------------------------------------------------+   |
|   | WF-IG-04: Human Approval Gateway (Visual Preview + Single-Use Webhook)    |   |
|   +---------------------------------------------------------------------------+   |
|                    │ (Rejected)                         │ (Approved)              |
|                    ▼                                    ▼                         |
|             [Quarantine/Log]             +------------------------------------+   |
|                                          | WF-IG-05: Meta Instagram Publisher |   |
|                                          | - Container Creation (POST /media) |   |
|                                          | - Status Polling (GET /creation_id)|   |
|                                          | - Publish (POST /media_publish)    |   |
|                                          | - Verification (GET /media_id)     |   |
|                                          +------------------------------------+   |
|                                                         │                         |
|   +---------------------------------------------------------------------------+   |
|   | WF-IG-06: Analytics & Insights Collector (Telemetry to PostHog)           |   |
|   +---------------------------------------------------------------------------+   |
|                                                                                   |
|   +---------------------------------------------------------------------------+   |
|   | WF-IG-99: Global Error Handler & Alerting Gateway                         |   |
|   +---------------------------------------------------------------------------+   |
+-----------------------------------------------------------------------------------+
                                           │
                                           ▼
+-----------------------------------------------------------------------------------+
|                              META GRAPH API PLATFORM                              |
|                                                                                   |
|   Host: graph.facebook.com                                                        |
|   App: Avalia Solar Social                                                        |
|   Account: @avalia_solar                                                          |
|   Endpoints: /{ig-user-id}/media, /{ig-user-id}/media_publish                     |
+-----------------------------------------------------------------------------------+
```

---

## 2. Máquina de Estados da Publicação (State Machine)

```text
[DISCOVERED]
     │
     ▼
[EDITORIAL_DRAFT] ────(AI Failure)────► [EDITORIAL_FAILED]
     │
     ▼
[MEDIA_RENDERED] ────(Render Error)───► [RENDER_FAILED]
     │
     ▼
[PENDING_APPROVAL]
     ├───(Rejected)────────► [REJECTED]
     ├───(Changes Req)─────► [CHANGES_REQUESTED]
     │
     ▼ (Approved)
[SCHEDULED]
     │
     ▼ (Kill-switch = false / Time reached)
[PUBLISHING] (Acquire Mutex Lock)
     │
     ├───(Container Error)─► [CONTAINER_FAILED]
     ├───(Timeout/Retry)───► [RECONCILING]
     │
     ▼
[PUBLISHED] (Persist Media ID & Permalink)
     │
     ▼
[ANALYTICS_TRACKED]
```

---

## 3. Estratégia de Idempotência e Concorrência

Para impedir que falhas de rede, reexecuções automáticas de webhooks ou concorrência publiquem o mesmo post duas vezes:

1. **Chave de Idempotência Determinística:**
   ```text
   idempotency_key = SHA256("instagram:avalia_solar:" + source_type + ":" + source_id + ":" + content_version)
   ```
2. **Bloqueio de Concorrência (Mutex Lock):**
   * Antes de disparar a criação do contêiner na Meta, o sistema verifica se a `idempotency_key` já possui status `PUBLISHING` ou `PUBLISHED`.
   * Se a chave já existir em estado `PUBLISHED`, a execução é abortada graciosamente com log informativo.
3. **Reconciliação após Timeout:**
   * Se a chamada para `media_publish` sofrer timeout de rede, o workflow **não tenta publicar novamente às cegas**.
   * Ele primeiro consulta `GET /{ig-user-id}/media?limit=5` para inspecionar se a última mídia publicada coincide com o `container_id` gerado. Se coincidir, marca como sucesso; caso contrário, realiza retry controlado.

---

## 4. Mecanismo de Kill Switch Operacional

O sistema conta com um interruptor de emergência:
* Variável global no n8n: `INSTAGRAM_AUTOPUBLISH_ENABLED`.
* No MVP: **valor padrão é `false`**.
* Qualquer tentativa de publicação verifica essa variável no primeiro node do WF-IG-05. Se `false`, o post aprovado é retido na fila e um alerta é emitido, impedindo envios não supervisionados.
