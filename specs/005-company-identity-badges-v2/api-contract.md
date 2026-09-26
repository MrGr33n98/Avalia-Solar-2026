# Contrato de API (REST & GraphQL) — Spec 005

## 1. DTO Canônico de Empresa (Projeção Completa)

```json
{
  "id": 10,
  "name": "WEG Solar",
  "slug": "weg-solar",
  "identity": {
    "primary_category": {
      "id": 70,
      "name": "Mobilidade Elétrica",
      "slug": "mobilidade-eletrica"
    },
    "verification": {
      "status": "verified",
      "verified": true,
      "verified_at": "2026-01-15T10:00:00Z",
      "method": "receita_federal_and_manual_audit"
    }
  },
  "commercial_status": {
    "tier": "pro",
    "status": "active",
    "paid": true
  },
  "distribution": {
    "featured": false,
    "sponsored": false
  },
  "recognitions": [
    {
      "id": 12,
      "name": "Top Brand 2026",
      "description": "Líder nacional em inversores e infraestrutura solar.",
      "category": "Mobilidade Elétrica",
      "year": 2026,
      "edition": "1",
      "public_slug": "top-brand-2026-a1b2",
      "image_url": "https://avaliasolar.com.br/rails/active_storage/blobs/proxy/.../badge.png",
      "verification_url": "https://avaliasolar.com.br/badges/top-brand-2026-a1b2"
    }
  ],
  "trust": {
    "trust_score": 87.5,
    "is_claimed": true,
    "verification_status": "verified"
  }
}
```

---

## 2. Contrato de Badge Canônico Único

Todos os serializers que expõem selos devem utilizar o seguinte contrato único (sem fallbacks):

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `integer` | ID interno do selo |
| `name` | `string` | Título oficial do reconhecimento (ex: "Top Brand 2026") |
| `description` | `string \| null` | Motivação ou escopo da outorga |
| `category` | `string \| null` | Rótulo da categoria do selo (`category_label`) |
| `year` | `integer \| null` | Ano de concessão (ex: 2026) |
| `edition` | `string \| null` | Edição (ex: "1" ou "Anual") |
| `public_slug` | `string` | Slug único indexado para a URL pública |
| `image_url` | `string \| null` | URL do ativo visual oficial gerada pelo Rails Storage Proxy |
| `verification_url` | `string` | Link público canônico: `https://avaliasolar.com.br/badges/:public_slug` |

---

## 3. Endpoints REST Auditados

### 3.1 `GET /api/v1/badges/:slug` (Público)
- **Status:** 200 OK ou 404 Not Found (se inexistente ou inativo).
- **Resposta:**
```json
{
  "badge": {
    "id": 12,
    "name": "Top Brand 2026",
    "description": "Líder nacional em inversores.",
    "category": "Mobilidade Elétrica",
    "year": 2026,
    "edition": "1",
    "public_slug": "top-brand-2026-a1b2",
    "image_url": "https://...",
    "verification_url": "https://avaliasolar.com.br/badges/top-brand-2026-a1b2"
  },
  "featured_companies": [
    {
      "id": 10,
      "name": "WEG Solar",
      "slug": "weg-solar",
      "logo_url": "https://..."
    }
  ]
}
```

### 3.2 `GET /api/v1/companies/:id/badges` (Público)
- Retorna array de selos canônicos outorgados à empresa, ordenados por `position ASC`.

### 3.3 `GET /api/v1/company_dashboard/certification_progress` (Autenticado B2B)
- **Correção de Root Cause:**
  - Substituir `icon_url` por `image_url`.
  - Substituir `badge_type` por `category_label`.
  - Desacoplar de coluna `verified` inexistente na tabela `company_badges`.
- **Resposta:**
```json
{
  "earned_badges": [
    {
      "id": 12,
      "name": "Top Brand 2026",
      "description": "...",
      "image_url": "https://...",
      "earned_at": "2026-02-10T12:00:00Z"
    }
  ],
  "available_badges": [
    {
      "id": 15,
      "name": "Instalador 5 Estrelas",
      "description": "...",
      "category": "Instalação Residencial"
    }
  ],
  "total_badges": 10,
  "earned_count": 1,
  "verification_progress": 10.0
}
```

---

## 4. Estratégia de Retrocompatibilidade (Expand-Only)
Os campos legados em nível superior (`verified`, `featured`, `sponsored`, `category_info`, `badges`) permanecem serializados durante a fase de transição para assegurar zero quebra em clientes web/mobile legados até a migração completa.
