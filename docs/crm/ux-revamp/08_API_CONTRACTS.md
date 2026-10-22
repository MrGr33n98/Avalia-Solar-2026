# 08 — Contratos de API REST, Envelopes de Erro & Escopo Multi-Tenant

## 1. Convenção de Comunicação REST
- **Base URI:** `/api/v1/sales`
- **Autenticação:** Cookie de sessão seguro (`credentials: 'include'`) ou header `Authorization: Bearer <JWT>`.
- **Validação de Permissão:** Todo controller herda de `Api::V1::Sales::BaseController` e executa `authenticate_api_user` e `require_internal_sales`.
- **Tenant Scoping:** O acesso a contas, contatos e oportunidades é intermediado exclusivamente por `current_tenant_scope`.

---

## 2. Endpoints Core Auditados

### 2.1 Atividades (`ActivitiesController`)
- **Rotas Canônicas:**
  - `POST /api/v1/sales/accounts/:account_id/activities` (Rota aninhada tradicional)
  - `POST /api/v1/sales/activities` (Rota direta com `sales_account_id` no payload)
- **Request Body:**
```json
{
  "activity": {
    "activity_type": "call",
    "subject": "Ligação de Alinhamento",
    "body": "Duração: 180s. Cliente interessado no plano Pro.",
    "sales_account_id": 101,
    "sales_opportunity_id": 50,
    "sales_contact_id": 204,
    "direction": "outbound"
  }
}
```
- **Response (201 Created):**
```json
{
  "activity": {
    "id": 892,
    "activity_type": "call",
    "subject": "Ligação de Alinhamento",
    "body": "Duração: 180s...",
    "occurred_at": "2026-10-22T19:50:00.000Z",
    "sales_account_id": 101,
    "sales_opportunity_id": 50,
    "sales_contact_id": 204,
    "actor": {
      "id": 1,
      "name": "Vendedor Avalia Solar"
    }
  }
}
```

### 2.2 Fila do Dia (`TodayController`)
- **Rota:** `GET /api/v1/sales/today`
- **Response (200 OK):**
```json
{
  "overdue_tasks": [],
  "today_tasks": [],
  "upcoming_tasks": [],
  "stale_opportunities": [],
  "top_prospects": [],
  "kpis": {
    "open_deals_count": 12,
    "pipeline_total_cents": 18000000,
    "pending_tasks_count": 5
  }
}
```

---

## 3. Envelope Padronizado de Erros (`SalesApiError`)

Em caso de falha de validação ou permissão, o backend Rails responde com o envelope padronizado consumido pelo frontend:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Parâmetros inválidos para criação da atividade.",
    "fields": {
      "sales_account_id": ["não pode ficar em branco"]
    },
    "request_id": "req-9a8b7c6d5e"
  }
}
```

- **Mapeamento HTTP no Frontend:**
  - `401 Unauthorized`: Sessão expirada; tentativa de renovação silenciosa via `/api/v1/auth/refresh`. Se falhar, redireciona para login preservando rota interna.
  - `403 Forbidden`: Mensagem amigável de acesso negado sem vazar dados cadastrais.
  - `404 Not Found`: Recurso inexistente ou fora do escopo do tenant atual.
  - `422 Unprocessable Entity`: Erros de validação inline associados aos campos do formulário.
  - `5xx / Network Error`: Exibição de aviso persistente mantendo rascunho intacto para reenvio.
