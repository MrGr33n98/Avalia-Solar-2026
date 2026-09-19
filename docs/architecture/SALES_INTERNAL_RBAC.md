# Sales Internal RBAC — Arquitetura de Autorização Canônica

**Projeto:** Avalia Solar 2026
**Domínio:** Internal Sales CRM
**Status:** IMPLEMENTED, CANONICALIZED & HARDENED (WAVE 1C)

---

## 1. Regra de Ouro: Fronteira Inegociável de Produto

```
                                      USER
                                       │
         ┌─────────────────────────────┼──────────────────────────────┐
         ▼                             ▼                              ▼
   Marketplace Identity          Internal Staff                  Platform Admin
         │                             │                              │
   CompanyMember                 Sales RBAC                      AdminUser / User(admin: true)
         │                             │                              │
   Portal da Empresa             Internal CRM                    ActiveAdmin
   (app.avaliasolar.com.br)      (crm.avaliasolar.com.br)        (/admin)
```

> [!IMPORTANT]
> - O Sales CRM é **ESTRITAMENTE INTERNO** para a equipe de vendas e SDRs do Avalia Solar.
> - Ser `CompanyMember`, proprietário de empresa, assinante de plano Pro/Enterprise ou avaliador **NUNCA** concede acesso ao CRM de vendas.
> - O acesso ao Sales CRM decorre exclusivamente da concessão explícita de `Sales::UserRole` a um `User` interno ou do privilégio de `AdminUser`/Platform Admin.

---

## 2. Hierarquia Canônica de Autorização em 3 Níveis

1. **Level 1 — Authentication (Identidade):**
   - Validada por `JwtAuthenticatable#authenticate_api_user`.
   - Verifica assinatura HMAC, expiração, tipagem (`typ: access`) e blacklist no Redis.
2. **Level 2 — Surface Access (Acesso à Superfície Sales):**
   - Validada por `Sales::BaseController#require_sales_surface_access!`.
   - Executa `Sales::AuthorizationService.sales_access?(user:)`.
   - Bloqueia usuários anônimos, avaliadores, empresas, membros de empresa e usuários internos sem roles atribuídas.
3. **Level 3 — Action Capability (Permissão de Ação e Política de Objeto):**
   - Validada por `require_sales_permission!(resource, action)` e/ou Policies Pundit (`Sales::OpportunityPolicy`).
   - Mutações administrativas de RBAC (`RbacController`, `UserRolesController`) exigem estritamente `sales.settings.manage`.

---

## 3. Taxonomia Canônica de Permissões

As permissões são persistidas na tabela `sales_permissions` com chave única `[resource, action]`:

| Permissão | Recurso | Ação | Descrição |
|---|---|---|---|
| `sales.opportunities.read` | `opportunities` | `read` | Visualizar funil e lista de oportunidades |
| `sales.opportunities.manage` | `opportunities` | `manage` | Criar, editar e alterar estágio de oportunidades |
| `sales.accounts.read` | `accounts` | `read` | Visualizar contas e dados cadastrais |
| `sales.accounts.manage` | `accounts` | `manage` | Criar e editar contas B2B |
| `sales.contacts.read` | `contacts` | `read` | Visualizar contatos e histórico |
| `sales.contacts.manage` | `contacts` | `manage` | Criar e atualizar contatos |
| `sales.tasks.read` | `tasks` | `read` | Visualizar tarefas atribuídas |
| `sales.tasks.manage` | `tasks` | `manage` | Criar, concluir e delegar tarefas |
| `sales.reports.read` | `reports` | `read` | Visualizar relatórios de performance de vendas |
| `sales.settings.manage` | `settings` | `manage` | Administrar papéis, permissões e atribuições RBAC |
| `sales.pipeline.manage` | `pipeline` | `manage` | Configurar pipelines e etapas de vendas |
| `sales.email.send` | `email` | `send` | Disparar e-mails e sequências de prospecção |

---

## 4. Papéis do Sistema (Sales Roles)

| Role Slug | Nome | Permissões Típicas |
|---|---|---|
| `sales_admin` | Administrador de Vendas | Todas as permissões de vendas (`sales.*`) |
| `sales_manager` | Gerente Comercial | Leitura e gestão de contas, contatos, oportunidades, tarefas, relatórios, pipeline e e-mails |
| `sales_rep` | Representante Comercial / SDR | Leitura e gestão de oportunidades próprias, contas, contatos, tarefas e e-mails |
| `sales_readonly` | Auditor / Somente Leitura | Apenas leitura de oportunidades, contas, contatos e tarefas |

---

## 5. Prevenção de Auto-Escalação de Privilégios (GAP-W1B-02)

- Controladores RBAC (`Api::V1::Sales::RbacController` e `Api::V1::Sales::UserRolesController`) são protegidos por `require_sales_permission!('settings', 'manage')`.
- SDRs (`sales_rep`), gerentes (`sales_manager`), usuários sem role (`internal_no_role`) ou membros externos são terminantemente proibidos de:
  - Atribuir papéis a si mesmos ou a terceiros.
  - Criar novos papéis ou modificar matrizes de permissão.
  - Elevar privilégios horizontal ou verticalmente.
