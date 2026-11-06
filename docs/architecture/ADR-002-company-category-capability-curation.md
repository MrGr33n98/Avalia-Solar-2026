# ADR-002: Reuso e Extensão Aditiva de `CompanyCategoryCapability` para Curadoria de Categorias

- **Status:** Aceito
- **Data:** 2026-11-06
- **Contexto:** `CDSI-086` a `CDSI-095` (PDR Categorias SEO/GEO/AEO)

## 1. Contexto e Problema

A categoria `monitoramento-operacao-manutencao` (e hubs correlatos como `apps-software-plataformas` vs serviços de campo) historicamente misturava empresas de **software SaaS de monitoramento** com equipes presenciais de **Operação & Manutenção (O&M)**, **inspeção termográfica** e **consultoria técnica** apenas pelo vínculo simples N:N `categories_companies`.

Durante a auditoria (`CDSI-086`), constatou-se que o banco já possui a tabela `company_category_capabilities` e o model `CompanyCategoryCapability` com:
- `company_id`, `category_id`, `category_solution_type_id`
- `capability_type` (`installation`, `maintenance`, `project_engineering`, `equipment_supply`, `monitoring`, `software`, `financing`)
- `coverage_scope`, `attributes_json`, `verified`, `verified_at`

## 2. Decisão

1. **Reusar `CompanyCategoryCapability`** em vez de criar uma segunda tabela concorrente.
2. **Extensão aditiva (`20261106120000_enhance_company_category_capabilities_for_curation.rb`):**
   - `curation_status` (`draft`, `verified`, `rejected`, default `'verified'` para registros legados verificados ou `'draft'`).
   - `service_delivery_mode` (`saas`, `field_service`, `hybrid`, `consulting`).
   - `evidence_json` (`jsonb`, default `{}`) para rastrear evidências públicas de auditoria sem expor PII.
   - `curated_by_id` (`bigint`, nullable).
3. **Taxonomia de Capacidades (`CAPABILITY_TYPES`):**
   - Expandir com tipos explícitos do domínio de Monitoramento e O&M: `monitoring_software`, `field_om`, `inspection`, `consulting` (preservando os 7 tipos existentes para retrocompatibilidade).
4. **Política de Elegibilidade e Ranking (`CategoryDiscovery::CompanyEligibilityPolicy`):**
   - Filtrar estritamente empresas `status: 'active'`.
   - Permitir segmentação explícita entre `saas` (`monitoring_software`, `software`) e `field_service` (`field_om`, `maintenance`, `inspection`).
   - Isolar o ranking orgânico (`rating_avg`, `rating_count`, `verified`, `id ASC`) de flags comerciais (`featured` / `sponsored`), que devem ser rotulados separadamente.
   - Nunca expor dados internos de membros, leads ou evidências privadas na API pública (`R38`).

