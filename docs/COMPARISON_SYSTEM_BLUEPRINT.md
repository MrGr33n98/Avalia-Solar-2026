# Comparison System Blueprint

Status: `active`  
Owner sugerido: `Product + Frontend + Backend`  
Última atualização: `2026-03-13`

## Objetivo

Mapear o sistema de comparação de empresas e produtos do Avalia Solar, garantindo que a experiência de decisão do usuário seja fluida e os dados sejam consistentes.

---

## 1. Arquitetura Geral

O sistema é baseado em um modelo **Client-Side Heavy**, onde a lista de comparação reside no navegador do usuário para permitir uma navegação rápida entre diferentes páginas sem perder a seleção.

### Camadas do sistema

- **Persistência:** LocalStorage (`ab01_comparison_list`).
- **Estado:** Hook React `useComparison` com sincronização via `EventTarget`.
- **Renderização:** Página `/compare` dinâmica com layouts mobile (cards) e desktop (tabela).
- **Conversão:** Integração direta com o `LeadEngine`.

---

## 2. Ativos Estruturais

### Frontend

- [compare/page.tsx](/Users/felipemorais/Avalia-Solar-2026/AB0-1-front/app/compare/page.tsx): Orquestrador da página.
- [useComparison.ts](/Users/felipemorais/Avalia-Solar-2026/AB0-1-front/hooks/useComparison.ts): Lógica de negócio da lista.
- [ComparisonFloatingBar.tsx](/Users/felipemorais/Avalia-Solar-2026/AB0-1-front/components/ComparisonFloatingBar.tsx): Widget global de acesso rápido.

### Backend

- [companies_controller.rb](/Users/felipemorais/Avalia-Solar-2026/AB0-1-back/app/controllers/api/v1/companies_controller.rb): Provê os dados da entidade `Company`.
- [financing_options_controller.rb](/Users/felipemorais/Avalia-Solar-2026/AB0-1-back/app/controllers/api/v1/financing_options_controller.rb): Possui endpoint específico de comparação de crédito.

---

## 3. Taxonomia de Analytics (PostHog V2)

O sistema deve disparar os seguintes eventos:

| Evento | Trigger | Propriedades Reais |
| --- | --- | --- |
| `comparison_usage` | Visualizar `/compare` | `comparison_count`, `company_ids` |
| `comparison_quote_click` | Clicar em "Orçar" na tabela | `company_id`, `position` |
| `comparison_added` | Adicionar empresa à lista | `company_id`, `source` |
| `comparison_removed` | Remover da lista | `company_id` |

---

## 4. Riscos e Melhorias Recomendadas

### Riscos Identificados

1. **Dados Estáticos:** Os dados da empresa no LocalStorage podem ficar desatualizados (ex: nota mudou no banco mas não no browser).
2. **Payload Size:** Armazenar o objeto `Company` inteiro pode exceder limites de LocalStorage se crescer descontroladamente.

### RoadMap de Evolução

- **Short Term:** Implementar eventos `comparison_added/removed` semânticos no PostHog.
- **Medium Term:** Criar endpoint `GET /api/v1/companies/compare?ids=...` para hidratação de dados frescos na renderização da tabela.
- **Long Term:** Permitir compartilhamento de comparação via link (serialização de IDs na URL).
