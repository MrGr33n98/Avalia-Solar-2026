# Campaign Workstation — Test Certification Report

> **Data:** Setembro 2026  
> **Status:** CERTIFICADO (0 Failures)  
> **Diretório:** `docs/03-campaign/`

---

## 1. Ambiente de Execução dos Testes

- **Container:** `docker-compose.test.yml` (serviço `backend` com `Dockerfile.backend.test`)
- **Banco de Dados:** PostgreSQL 14 (`POSTGRES_DB=ab0_test`)
- **Cache/Lock:** Redis 7-alpine
- **Comando de Execução:**
  ```bash
  docker compose -f docker-compose.test.yml run --rm -v $(pwd)/AB0-1-back:/app backend bundle exec rspec spec/requests/api/v1/sales/campaigns_spec.rb
  ```

---

## 2. Cobertura da Suíte de Testes (`campaigns_spec.rb`)

### 2.1 Regression & Routing Checks
- [x] Confirmação de que `CampaignsController.instance_method(:dispatch).owner != Api::V1::Sales::CampaignsController` (`owner == ActionController::Metal`).
- [x] Mapeamento de rota: `POST /api/v1/sales/campaigns/:id/dispatch` -> `campaigns#launch`.

### 2.2 Contrato da API & Paginação
- [x] `GET /api/v1/sales/campaigns` com 0 campanhas (retorna `[]` e metadados zerados).
- [x] `GET /api/v1/sales/campaigns` com 1 campanha.
- [x] Paginação correta com 20 campanhas (`page=1`, `per_page=10`, `total_pages=2`).

### 2.3 Isolamento Multi-tenant & Defesa IDOR
- [x] `GET /api/v1/sales/campaigns` não vaza campanhas de outras empresas.
- [x] `GET /api/v1/sales/campaigns/:id` de outra empresa retorna `HTTP 404 Not Found`.
- [x] `PATCH /api/v1/sales/campaigns/:id` de outra empresa retorna `HTTP 404 Not Found`.
- [x] `DELETE /api/v1/sales/campaigns/:id` de outra empresa retorna `HTTP 404 Not Found`.
- [x] `POST /api/v1/sales/campaigns/:id/dispatch` de outra empresa retorna `HTTP 404 Not Found`.

### 2.4 Ações do Controlador & Ciclo de Vida Completo
- [x] `GET show`, `POST create`, `PATCH update`, `DELETE destroy`.
- [x] `POST pause`, `POST resume`, `POST cancel`, `POST retry_failed`.
- [x] Ciclo completo: `preflight` -> `snapshot` -> `dispatch` (launch) -> `analytics`.
