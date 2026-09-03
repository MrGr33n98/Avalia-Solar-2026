# CRM People & Decisores — Estado Atual

**Baseline SHA:** `ebe4480b8c5a333037f3dca51eb5f92109b39f44`  
**Status:** **SUÍTE OPERACIONAL COMPLETA A+++**

## 1. Modelo de Domínio
- **Entidade Canônica:** `Sales::Contact` (`sales_contacts`).
- **Owner Relationship:** `sales_contacts.user_id` aliased as `owner_id`, apontando para `User`.
- **Primary Account:** `Sales::Account` (`sales_account_id`).
- **Employments:** `Sales::ContactEmployment` (`sales_contact_employments`).
- **Buying Committee:** `Sales::OpportunityContact` (`sales_opportunity_contacts`).

## 2. Capacidades Ativas
- **Filtros por Query Object (`Sales::ContactsQuery`):**
  - Busca inteligente por nome, sobrenome, e-mail e cargo.
  - Filtro por `owner_id` e `unassigned`.
  - Filtro por `decision_role` (`economic_buyer`, `champion`, `technical_buyer`, `decision_maker`).
  - Paginação baseada em metadados (`page`, `per_page`, `total`, `pages`).
- **Resolução de Contatos Comercial Real:**
  - `LastContactResolver`: Determina o último contato real via atividades/tarefas completadas (sem fallback em `updated_at`).
  - `NextActionResolver`: Determina a próxima ação agendada via tarefas pendentes.
- **Página Person 360° Full Workspace (`/dashboard/sales/people/[id]`):**
  - Visualização 75% / 25% (Main / Right Rail).
  - Write Note inline composer salvando notas reais.
  - Ações rápidas de Registrar Chamada, Enviar E-mail e Agendar Tarefa.
  - Linha do tempo canônica construída via `Sales::Contacts::TimelineBuilder`.
- **Modos de Visualização:**
  - `List View` (Grid de alta densidade).
  - `Map View` (Mapeamento geográfico de decisores sem dados inventados).
