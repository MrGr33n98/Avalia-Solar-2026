# 04 — API Contracts & Payloads

## Endpoints Principais (Rails API `/api/v1/company_dashboard/`)

### 1. Listagem de Propostas
- **Método:** `GET /api/v1/company_dashboard/proposals`
- **Headers:** `Authorization: Bearer <JWT>`, `Cookie: active_company_id=<ID>`
- **Response (200 OK):**
```json
{
  "proposals": [
    {
      "id": 1,
      "reference": "AS-2026-D00000001",
      "status": "draft",
      "total_cents": 1245000,
      "currency": "BRL",
      "expires_at": null,
      "published_at": null,
      "conversation_id": 42,
      "lead": {
        "id": 50,
        "name": "Felipe",
        "email": "felipe@example.com",
        "city": "Florianópolis",
        "state": "SC"
      },
      "version": {
        "id": 100,
        "number": 1,
        "status": "draft",
        "title": "Proposta Comercial Solar",
        "total_cents": 1245000,
        "valid_until": "2026-12-31",
        "items": [],
        "terms": [],
        "documents": []
      }
    }
  ]
}
```

### 2. Atualização de Termos e Customizações do Studio
- **Método:** `PATCH /api/v1/company_dashboard/proposals/:id`
- **Payload Request:**
```json
{
  "proposal": {
    "title": "Proposta Comercial Solar",
    "valid_until": "2026-12-31",
    "terms": [
      {
        "key": "studio_template_id",
        "label": "Modelo PDF",
        "value": "moderno",
        "position": 0
      },
      {
        "key": "studio_main_color",
        "label": "Cor Principal da Marca",
        "value": "#0066FF",
        "position": 1
      },
      {
        "key": "studio_section_about_company",
        "label": "Seção Sobre a Empresa",
        "value": "true",
        "position": 2
      },
      {
        "key": "payment_conditions",
        "label": "Condições de Pagamento",
        "value": "À vista ou Financiamento até 84x",
        "position": 3
      }
    ]
  },
  "company_id": 101
}
```
- **Response (200 OK):** Objeto `proposal` atualizado com termos persistidos.

### 3. Envio e Publicação Oficial
- **Método:** `POST /api/v1/company_dashboard/proposals/:id/send`
- **Response (200 OK):**
```json
{
  "proposal": {
    "id": 1,
    "status": "sent",
    "published_at": "2026-10-14T02:00:00Z"
  }
}
```

### 4. Criação de Nova Versão (Snapshot Imutável)
- **Método:** `POST /api/v1/company_dashboard/proposals/:id/new_version`
- **Response (201 Created):** Objeto `proposal` com nova versão `number: 2` em status `draft`, copiando itens, termos e documentos da versão anterior.
