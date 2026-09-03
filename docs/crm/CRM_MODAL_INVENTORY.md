# Inventário de Modais e Design System — Avalia Solar CRM

## Matriz de Modais e Dimensões Canônicas

| Componente Modal | Rota / Gatilho | Largura Alvo Desktop | Padding Interno | Comportamento Scroll | Status UX |
| --- | --- | --- | --- | --- | --- |
| **Nova Oportunidade Comercial** | `SalesCommandCenter` / Topbar `+ Add new` | `max-w-[680px]` (MD/LG) | `p-6` (24px) | Internal `max-h-[85vh]` | **Redimensionado (P0)** |
| **Registrar Chamada (Call Logger)** | `CallLoggerModal` / Accounts / Prospects | `max-w-[620px]` (MD) | `p-6` (24px) | Internal `max-h-[85vh]` | **Redimensionado (P0)** |
| **Ficha Contact / People Graph 360°** | `Contact360View` / `PeopleList` | `max-w-[880px]` (LG/XL) | `p-6` (24px) | Internal `max-h-[88vh]` | **Redimensionado (P0)** |
| **Ficha Company 360°** | `Company360View` / `AccountList` | `max-w-[1000px]` (XL) | `p-6` (24px) | Internal `max-h-[88vh]` | **Redimensionado (P0)** |
| **Nova Tarefa / Follow-up** | Topbar `+ Add new` / `TasksPage` | `max-w-[580px]` (MD) | `p-6` (24px) | Internal `max-h-[85vh]` | **Padronizado (P0)** |
| **Nova Proposta Solar / Quote** | Topbar `+ Add new` / `SalesQuotesPage` | `max-w-[720px]` (LG) | `p-6` (24px) | Internal `max-h-[85vh]` | **Padronizado (P0)** |
| **Criar Nova Empresa (Account)** | Topbar `+ Add new` / `AccountList` | `max-w-[600px]` (MD) | `p-6` (24px) | Internal `max-h-[85vh]` | **Padronizado (P0)** |
| **Criar Novo Contato (Person)** | Topbar `+ Add new` / `PeopleList` | `max-w-[600px]` (MD) | `p-6` (24px) | Internal `max-h-[85vh]` | **Padronizado (P0)** |

---

## Regras Globais do Design System de Modais
1. **Espaçamento das Bordas**: Mínimo de 24px (`p-6`) no desktop. Nenhum input ou label pode encostar nas bordas laterais do diálogo.
2. **Scroll Interno**: `max-h-[88vh] overflow-y-auto` para evitar duplo scroll de tela e modal.
3. **Footer de Ações**: `pt-5 mt-2 border-t border-slate-100 flex justify-end gap-3`. Botão primário com altura de 40px (`h-10`).
