# Matriz do Menu Global "+ Add new" — Avalia Solar CRM

## Mapeamento do Menu `CRMGlobalCreateMenu` (`CRM_CREATE_ACTIONS`)

| Ação | Ícone | Título PT-BR | Descrição Explicativa | Tipo de Ação | Ação Executada | Status |
| --- | --- | --- | --- | --- | --- | --- |
| `company` | `Building2` | **Empresa** | Organização com quem você faz negócios | Modal | Abre `AccountCreateModal` | **Ativo** |
| `contact` | `Users` | **Pessoa** | Decisor ou contato comercial | Modal | Abre `ContactCreateModal` | **Ativo** |
| `opportunity` | `Target` | **Oportunidade** | Venda potencial no pipeline | Modal | Abre `NewOpportunityModal` (640px) | **Ativo** |
| `activity` | `Phone` | **Atividade** | Ligação, reunião ou interação | Modal | Abre `CallLoggerModal` | **Ativo** |
| `task` | `CalendarClock` | **Tarefa** | Follow-up ou ação pendente | Modal | Abre `TaskCreateModal` | **Ativo** |
| `quote` | `FileText` | **Proposta / Quote** | Criar proposta comercial solar | Modal | Abre `QuoteCreateModal` | **Ativo** |
| `email` | `Mail` | **E-mail** | Enviar mensagem ou modelo comercial | Modal | Abre `EmailComposeModal` | **Ativo** |
| `import` | `FileSpreadsheet` | **Importar Leads** | Adicionar dados em lote (CSV) | Rota | Navega para `/dashboard/sales/import` | **Ativo** |

---

## Garantia de Qualidade
- **Zero Botões Mortos**: Nenhuma opção do menu `+ Add new` resulta em ação vazia ou erro 404.
- **Registro Único (`CRM_CREATE_ACTIONS`)**: Centralizado em `lib/constants/crm.ts` para reuso no Command Palette (`Ctrl+K`), Topbar e Atalhos de Teclado.
