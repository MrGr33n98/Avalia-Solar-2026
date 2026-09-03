# Matriz do Menu Global "+ Add new" — Avalia Solar CRM

## Mapeamento Canônico (`CRMGlobalCreateHost` & `CRM_CREATE_ACTIONS`)

| Ação | Ícone | Título PT-BR | Descrição Explicativa | Tipo | Componente / Ação Executada | Status |
| --- | --- | --- | --- | --- | --- | --- |
| `company` | `Building2` | **Empresa** | Organização com quem você faz negócios | Modal | Abre `CreateCompanyModal` (POST `/api/v1/sales/accounts`) | **Ativo** |
| `contact` | `Users` | **Pessoa** | Decisor ou contato comercial | Modal | Abre `CreateContactModal` (POST `/api/v1/sales/contacts`) | **Ativo** |
| `opportunity` | `Target` | **Oportunidade** | Venda potencial no pipeline | Rota | Redireciona `/dashboard/sales/pipeline` | **Ativo** |
| `activity` | `Phone` | **Atividade** | Ligação, reunião ou interação | Modal | Abre `CreateActivityModal` (POST `/api/v1/sales/activities`) | **Ativo** |
| `task` | `CalendarClock` | **Tarefa** | Follow-up ou ação pendente | Modal | Abre `CreateTaskModal` (POST `/api/v1/sales/tasks`) | **Ativo** |
| `quote` | `FileText` | **Proposta / Quote** | Criar proposta comercial solar | Modal | Abre `CreateQuoteModal` (POST `/api/v1/sales/quotes`) | **Ativo** |
| `email` | `Mail` | **E-mail** | Enviar mensagem comercial | Modal | Abre `SendEmailModal` (POST `/api/v1/sales/emails`) | **Ativo** |
| `import` | `FileSpreadsheet` | **Importar Leads** | Adicionar dados em lote (CSV) | Rota | Navega para `/dashboard/sales/import` | **Ativo** |

---

## Garantia de Qualidade
- **Zero Botões Mortos**: Nenhuma opção do menu `+ Add new` resulta em ação vazia ou erro.
- **Modais Desacoplados Reutilizáveis**: Todos os modais residem em `components/sales/create/` e são despachados pelo host controlado `CRMGlobalCreateHost.tsx`.
- **Registro Único (`CRM_CREATE_ACTIONS`)**: Centralizado em `lib/sales/create-actions.ts` e consumido por `CRMTopbar`, `CRMSidebar` e `CRMCommandPalette`.
