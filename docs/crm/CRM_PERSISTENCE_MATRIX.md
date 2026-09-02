# Matriz de Persistência do CRM Sales — Avalia Solar 2026

## Mapeamento Modelo ↔ Tabela PostgreSQL ↔ Integridade Operacional

| Model Rails | Tabela DB | Chaves Estrangeiras Críticas | Regra de Negócio & Constraint | Validação F5 / Reload |
| --- | --- | --- | --- | --- |
| `Sales::Account` | `sales_accounts` | `user_id` (owner) | `name` obrigatório. Soft-delete opcional. | **Persistido** |
| `Sales::Contact` | `sales_contacts` | `sales_account_id`, `user_id` | `first_name` obrigatório. Deduplicação por e-mail/telefone E.164. | **Persistido** |
| `Sales::Pipeline` | `sales_pipelines` | — | `key` e `name` únicos. Pipeline ativo padrão. | **Persistido** |
| `Sales::Stage` | `sales_stages` | `sales_pipeline_id` | `key` único por pipeline. `position` ordenado. | **Persistido** |
| `Sales::Opportunity` | `sales_opportunities` | `sales_account_id` (Obrigatório), `primary_contact_id` (Opcional), `sales_pipeline_id`, `sales_stage_id` | `name` e `sales_account` obrigatórios. Atualiza `StageHistory` na transição de estágio. | **Persistido** |
| `Sales::StageHistory` | `sales_stage_histories` | `sales_opportunity_id`, `from_stage_id`, `to_stage_id`, `user_id` (actor) | Imutável. Registrado deterministicamente a cada alteração de estágio. | **Persistido** |
| `Sales::Task` | `sales_tasks` | `sales_account_id`, `sales_opportunity_id`, `user_id` | `title` obrigatório. Atualiza timeline e analytics ao ser concluída. | **Persistido** |
| `Sales::Activity` | `sales_activities` | `sales_opportunity_id`, `sales_contact_id`, `user_id` | `activity_type`, `subject` e `body` persistidos. | **Persistido** |
| `Sales::CustomFieldDefinition` | `sales_custom_field_definitions` | — | Atributos e opções de campos customizados das entidades comercial. | **Persistido** |
