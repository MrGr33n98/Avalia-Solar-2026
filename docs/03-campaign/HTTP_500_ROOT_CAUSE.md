# Diagnóstico & Resolução Root Cause — HTTP 500 em /api/v1/sales/campaigns

> **Data:** Setembro 2026  
> **Status:** RESOLVIDO & CERTIFICADO  
> **Diretório:** `docs/03-campaign/`

---

## 1. ROOT CAUSE (Causa Raiz Identificada)

1. **Invocação de `current_user.admin?` com Usuário Nulo (`NoMethodError`)**:
   - `CampaignsController` e `AudiencesController` não continham o filtro `before_action :authenticate_api_user`.
   - Quando uma requisição sem token ou com sessão/cookie expirado chamava `GET /api/v1/sales/campaigns`, o método `scoped_campaigns` executava `current_user.admin?` com `current_user = nil`.
   - O Rails levantava `NoMethodError: undefined method 'admin?' for nil:NilClass`, que não era capturado pelo controlador e gerava resposta **HTTP 500 Internal Server Error** em produção.

2. **Conflito de Sobrescrita de Método `ActionController#dispatch` (`ArgumentError`)**:
   - No `CampaignsController`, a ação member `def dispatch` sobrescrevia o método nativo do Rails `ActionController::Metal#dispatch(name, request, response)` (que espera 3 argumentos).
   - Quando o Rails tentava processar requisições no `CampaignsController`, a chamada interna passava 3 argumentos e disparava `ArgumentError (wrong number of arguments (given 3, expected 0))` em `app/controllers/api/v1/sales/campaigns_controller.rb:112:in dispatch`.
   - **Fix**: Renomeada a ação do controlador para `def launch` e mapeadas as rotas `post :dispatch, action: :launch` e `post :launch, action: :launch`.

3. **Schema Mismatch e Ausência de Defesa contra Colunas Nulas**:
   - As migrações da release de campanhas (`20260905000001_enhance_sales_campaigns.rb` a `20260905000004_add_campaign_id_to_sales_email_messages.rb`) não constavam no contrato estrito `script/schema_contract_check.rb`.
   - Quando colunas novas ou migrações pendentes eram consultadas em bancos não atualizados, queries por colunas como `status`, `campaign_type` ou `user_id` falhavam com `PG::UndefinedColumn`.

4. **Fallback Inseguro `Company.first` & Remetente Hardcoded**:
   - `create` de campanhas continha fallback `Company.first`, violando o isolamento de tenant.
   - `CampaignBatchProcessorJob` continha remetente hardcoded `sender_user_id = 1` e corpo HTML fake `<p>Olá ..., confira as ofertas...</p>`.

---

## 2. EVIDENCE & STACK TRACE

Exceções geradas no Rails antes dos ajustes:
```text
1. NoMethodError: undefined method 'admin?' for nil:NilClass
   app/controllers/api/v1/sales/campaigns_controller.rb:139:in `scoped_campaigns'
   app/controllers/api/v1/sales/campaigns_controller.rb:20:in `index'

2. PG::UndefinedColumn: ERROR: column sales_campaigns.status does not exist
   app/controllers/api/v1/sales/campaigns_controller.rb:21:in `index'
```

---

## 3. AFFECTED PATHS

- `AB0-1-back/app/controllers/api/v1/sales/campaigns_controller.rb`
- `AB0-1-back/app/controllers/api/v1/sales/audiences_controller.rb`
- `AB0-1-back/app/jobs/sales/campaign_batch_processor_job.rb`
- `AB0-1-back/app/services/sales/campaigns/dispatcher.rb`
- `AB0-1-back/app/services/sales/campaigns/preflight.rb`
- `AB0-1-back/script/schema_contract_check.rb`

---

## 4. FIX IMPLEMENTADO

1. **Autenticação Obrigatória e Defesa contra `NilClass`**:
   - Adicionado `before_action :authenticate_api_user` no topo de `CampaignsController.rb` e `AudiencesController.rb`. Requisições não autenticadas retornam HTTP 401 Unauthorized limpo sem derrubar o servidor.
   - `scoped_campaigns` ajustado para checar `return ::Sales::Campaign.none if current_user.nil?` e utilizar navegadores seguros (`respond_to?(:admin?)`).

2. **Defensividade na Serialização e Queries**:
   - Métodos de serialização e filtros usam `.try(...)`, `.to_i` e verificação de colunas (`column_names.include?`), prevenindo crash mesmo diante de tabelas ou registros legados.

3. **Hardening do Contrato de Schema**:
   - Adicionadas as 4 migrações de campanhas (`20260905000001` a `20260905000004`) e as tabelas/colunas obrigatórias ao script `script/schema_contract_check.rb`.

4. **Preflight Service & Lock Distribuído**:
   - Criado `Sales::Campaigns::Preflight` e lock no Redis (`campaign:dispatch_lock:<id>`).

---

## 5. REGRESSION TEST

Spec de request dedicada em `AB0-1-back/spec/requests/api/v1/sales/campaigns_spec.rb`:
- Testes com 0 campanhas, 1 campanha, 20 campanhas com paginação, e isolamento de tenant entre diferentes empresas.

---

## 6. DEPLOY VALIDATION

Deploy executado via GitHub Actions (`deploy-v1.yml`) com contrato de schema e Zeitwerk passados.
