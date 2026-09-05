# Diagnóstico & Resolução Root Cause — HTTP 500 em /api/v1/sales/campaigns

> **Data:** Setembro 2026  
> **Status:** RESOLVIDO & CERTIFICADO  
> **Diretório:** `docs/03-campaign/`

---

## 1. ROOT CAUSE (Causa Raiz Identificada)

1. **Migrações e Schema de Produção Divergentes**:
   - As migrações da release de campanhas (`20260905000001_enhance_sales_campaigns.rb` a `20260905000004_add_campaign_id_to_sales_email_messages.rb`) não constavam no contrato estrito `script/schema_contract_check.rb` nem no `db/schema.rb`.
   - Ao executar a listagem `GET /api/v1/sales/campaigns`, o ActiveRecord tentava realizar queries por colunas como `status`, `campaign_type`, `total_recipients`, `user_id` e `email_template_id`. Quando ausentes na tabela do banco de dados em produção, o PostgreSQL disparava o erro `PG::UndefinedColumn: ERROR: column sales_campaigns.status does not exist`, gerando exceção não tratada e retorno HTTP 500.

2. **Tenant Scoping com Fallback para `user_id` Inexistente**:
   - O método `scoped_campaigns` em `CampaignsController` continha fallback `::Sales::Campaign.where(user_id: current_user.id)` quando `current_user.company_id` era nulo. Caso a coluna `user_id` não estivesse presente na tabela, o Rails falhava com erro de coluna inexistente.

3. **Fallback Inseguro `Company.first` & Remetente Hardcoded**:
   - `create` de campanhas continha fallback `Company.first`, violando o isolamento de tenant.
   - `CampaignBatchProcessorJob` continha remetente hardcoded `sender_user_id = 1` e corpo HTML fake `<p>Olá ..., confira as ofertas...</p>`.

---

## 2. EVIDENCE & STACK TRACE

Exceção gerada no Rails antes do ajuste:
```text
PG::UndefinedColumn: ERROR: column sales_campaigns.status does not exist
LINE 1: SELECT "sales_campaigns".* FROM "sales_campaigns" WHERE "sales_campaigns"."status" = 'draft'
app/controllers/api/v1/sales/campaigns_controller.rb:10:in `index'
```

---

## 3. AFFECTED PATHS

- `AB0-1-back/app/controllers/api/v1/sales/campaigns_controller.rb`
- `AB0-1-back/app/jobs/sales/campaign_batch_processor_job.rb`
- `AB0-1-back/app/services/sales/campaigns/dispatcher.rb`
- `AB0-1-back/app/services/sales/campaigns/preflight.rb`
- `AB0-1-back/script/schema_contract_check.rb`
- `AB0-1-back/db/migrate/20260905000001_enhance_sales_campaigns.rb`
- `AB0-1-back/config/routes.rb`

---

## 4. FIX IMPLEMENTADO

1. **Hardening do Contrato de Schema**:
   - Adicionadas as 4 migrações de campanhas (`20260905000001` até `20260905000004`) e as tabelas/colunas obrigatórias ao script `script/schema_contract_check.rb`. O pipeline de CI/CD agora rejeita deploys que não tenham executado estas migrações.

2. **Segurança de Tenant (Fail Closed)**:
   - Removido `Company.first`. Caso o tenant não seja identificado nem autorizado para o usuário atual, a API responde HTTP 403 Forbidden.
   - `scoped_campaigns` ajustado para retornar `Sales::Campaign.none` com segurança se `company_id` for ausente.

3. **Preflight Service & Prevenção de Envio com Erro**:
   - Criado `Sales::Campaigns::Preflight` para validar nome, template, remetente e tamanho da audiência antes de qualquer disparo.
   - Removidos o remetente hardcoded `user_id = 1` e o HTML fake do worker Sidekiq.
   - Implementado lock distribuído real no Redis (`campaign:dispatch_lock:<id>`).

---

## 5. REGRESSION TEST

Spec de request dedicada criada em `AB0-1-back/spec/requests/api/v1/sales/campaigns_spec.rb`:
- Valida retorno HTTP 200 na listagem sem campanhas, com 1 campanha, 20 campanhas e isolamento por tenant.
- Testado contrato de meta de paginação `{ page: 1, per_page: 20, total_count: 0, total_pages: 0 }`.

---

## 6. DEPLOY VALIDATION

Deployment script atualizado via GitHub Actions (`deploy-v1.yml`):
- O step `bundle exec rails runner script/schema_contract_check.rb` valida todas as tabelas e índices de campanhas antes de liberar o container para o tráfego de produção.
