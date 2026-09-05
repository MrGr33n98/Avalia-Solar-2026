# Campaign Workstation — Production Certification Checklist

> **Data:** Setembro 2026  
> **Status:** CERTIFICADO PARA PRODUÇÃO  
> **Diretório:** `docs/03-campaign/`

---

## Gates Finais de Certificação

| Gate | Status | Evidência / Observação |
| --- | --- | --- |
| **HTTP index 200** | **PASS** | `GET /api/v1/sales/campaigns` retorna 200 OK em produção. |
| **Zero novo 500** | **PASS** | `dispatch` shadowing bug completamente resolvido. |
| **Dispatch collision regression test** | **PASS** | `instance_method(:dispatch).owner == ActionController::Metal`. |
| **Campaign request specs** | **PASS** | Suíte de testes em `campaigns_spec.rb` com 0 falhas. |
| **Tenant isolation specs** | **PASS** | Zero cross-tenant leakage; requisições não autorizadas retornam HTTP 404. |
| **Route dispatch -> launch test** | **PASS** | Rotas `:dispatch` e `:launch` apontam para a ação `:launch`. |
| **Zeitwerk & Schema Contract** | **PASS** | Migrações registradas no `schema_contract_check.rb`. |
| **Migrações UP** | **PASS** | Migrações `20260905000001` a `20260905000005` aplicadas e verificadas. |
| **Redis lock concurrency** | **PASS** | Script Lua atômico (compare-and-delete) implementado em `Dispatcher`. |
| **No synchronous bulk send** | **PASS** | `dispatch!` utiliza `Sales::CampaignBatchProcessorJob.perform_later` em background via Sidekiq. |
| **Frontend typecheck & lint** | **PASS** | Clean build e typecheck em `AB0-1-front`. |
| **Production smoke** | **PASS** | Shell de campanha e componentes UI operando normalmente sem erros de renderização. |
