# Blueprint Arquitetural: Dual-Density Kanban Card (Compact + Expanded)
### Arquitetura Enterprise Reutilizável para Produtos SaaS

> **Padrão de Design:** Dual-Density Presentation State Pattern  
> **Aplicações:** CRM de Vendas, Helpdesk/Suporte, Gestão de Tarefas/Projetos (Jira-like), ATS (Recrutamento), Logística/Pedidos.  
> **Stack Base:** React 18/19, Next.js (App Router ou Pages), TypeScript, Tailwind CSS, Lucide Icons, Jest/RTL e Playwright.

---

## 1. Visão Geral e Filosofia do Padrão Dual-Density

Os Kanban boards tradicionais sofrem de um dilema crônico de densidade informacional:
1. **Cards Grandes (160–220px):** Fornecem contexto imediato (atividades, tags, responsáveis), mas provocam fadiga de rolagem. Uma coluna comporta apenas 3 a 4 itens visíveis na viewport, prejudicando o fluxo de triagem rápida.
2. **Cards Muito Pequenos (~50px):** Maximizam o número de itens na tela, mas forçam o operador a abrir drawers ou modals o tempo todo para saber detalhes triviais.

### A Solução Dual-Density
Um **componente de card único** que opera dinamicamente em dois modos:
- **Modo `compact` (~70–82px) — Modo Operacional:** Focado em escaneabilidade instantânea (8 a 10 cards simultâneos por coluna sem scroll). Exibe os elementos âncoras essenciais (título, contato, valor, prioridade/temperatura, tempo no estágio, menu e expand).
- **Modo `expanded` (~160–190px) — Modo Investigativo:** Acionado sob demanda pelo operador para aprofundar contexto de um item específico (histórico recente, próxima ação, tags, notas de qualificação).

---

## 2. Princípios Enterprise Fundamentais

1. **Zero Contaminação de Domínio / DTO:**  
   O backend, banco de dados ou schemas de API **nunca** devem armazenar `isExpanded` ou `density`. O estado de expansão é estritamente efêmero e de apresentação no frontend.
2. **Single Component Root:**  
   Não crie dois componentes concorrentes (`CompactCard` e `ExpandedCard`) duplicando regras de negócios, drag-and-drop ou handlers. A raiz deve ser um único componente `<OpportunityCard density={...} />`.
3. **Isolamento de Estado na Coluna (`Set<ID>`):**  
   O estado de quais cards estão expandidos é mantido no container da coluna (`PipelineColumn`), usando uma estrutura `Set<ID>`. Isso garante que expandir o item `A` **nunca** afete o item `B` e que a expansão ocorra com **zero requisições de rede** (< 1ms).
4. **Matriz Estrita de Propagação de Eventos (`e.stopPropagation()`):**  
   Interações aninhadas (checkbox, menu, botão expand/collapse) jamais devem disparar acidentalmente o clique do corpo do card (abertura de modal/drawer) ou iniciar arrasto indevido.
5. **Skeleton Proporcional:**  
   O estado de carregamento (`Skeleton`) deve respeitar a densidade padrão para evitar saltos visuais (*Cumulative Layout Shift - CLS*).

---

## 3. Matriz de Interação e Eventos

| Elemento Interativo | Evento | Comportamento Esperado | Propagação (`e.stopPropagation`) |
| :--- | :--- | :--- | :--- |
| **Corpo do Card** | `click` / `Enter` / `Space` | Abre o Drawer / Modal de Detalhes 360 | Não (é o container principal) |
| **Controle Expand/Collapse** | `click` | Alterna entre `compact` e `expanded` | **SIM (Obrigatório)** |
| **Checkbox de Seleção** | `click` / `change` | Seleciona/deseleciona o item para ações em lote | **SIM (Obrigatório)** |
| **Menu de Ações (`...`)** | `click` | Abre menu contextual com ações rápidas | **SIM (Obrigatório)** |
| **Item do Menu** | `click` | Executa ação específica ou navega | **SIM (Obrigatório)** |
| **Container (Drag)** | `dragstart` | Inicia arrasto com payload JSON serializado | Permite arrastar em ambos os modos |

---

## 4. Estrutura Modular de Arquivos Recomendada

```
src/components/pipeline/OpportunityCard/
├── types.ts                        # DTO do item e tipos de densidade
├── OpportunityCard.tsx             # Componente raiz dual-density
├── OpportunityCardHeader.tsx       # Cabeçalho (checkbox, título, badges)
├── OpportunityCardContact.tsx      # Identificação de contato e responsável
├── OpportunityCardValue.tsx        # Métrica principal (valor, score, SLA)
├── OpportunityCardActivity.tsx     # Atividades recentes (somente expanded)
├── OpportunityCardNextAction.tsx   # Próximas ações / tarefas (somente expanded)
├── OpportunityCardFooter.tsx       # Tags, metadados secundários (somente expanded)
├── OpportunityCardMenu.tsx         # Menu contextual com ações rápidas
├── OpportunityCardSkeleton.tsx     # Skeleton adaptativo
└── index.ts                        # Barrel de exports
```

---

## 5. Código-Fonte Pronto para Replicação (Starter Kit)

### 5.1 `types.ts` — Contratos de Dados e Apresentação
```typescript
export type CardDensity = 'compact' | 'expanded';

export interface CardTag {
  id: number;
  name: string;
  color?: string;
}

export interface CardDTO {
  id: number;
  title: string;
  subtitle?: string;
  primary_contact?: { id: number; name: string; email?: string } | null;
  owner?: { id: number; name: string; avatar_url?: string } | null;
  stage_key: string;
  value_cents: number;
  currency: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  temperature?: 'cold' | 'warm' | 'hot';
  aging_days: number;
  is_stale?: boolean;
  tags: CardTag[];
  last_activity?: { description: string; occurred_at: string } | null;
  next_action?: { title: string; due_at?: string; overdue: boolean } | null;
}
```

### 5.2 `OpportunityCard.tsx` — Componente Raiz Dual-Density
```tsx
'use client';

import React from 'react';
import { Building2, ChevronDown, ChevronUp, User, Flame, Zap, ThermometerSnowflake } from 'lucide-react';
import { CardDTO, CardDensity } from './types';
import { OpportunityCardMenu } from './OpportunityCardMenu';

export interface OpportunityCardProps {
  card: CardDTO;
  density?: CardDensity;
  selected?: boolean;
  onToggleSelect?: (id: number) => void;
  onToggleExpand?: () => void;
  onOpenDetails: (card: CardDTO) => void;
  onDragStart?: (e: React.DragEvent, card: CardDTO) => void;
  onAction?: (actionKey: string, card: CardDTO) => void;
}

export const OpportunityCard: React.FC<OpportunityCardProps> = ({
  card,
  density = 'expanded',
  selected = false,
  onToggleSelect,
  onToggleExpand,
  onOpenDetails,
  onDragStart,
  onAction,
}) => {
  const isCompact = density === 'compact';

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpenDetails(card);
    }
  };

  // Classes visuais operacionais
  let borderClasses = 'border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600';
  let bgClasses = 'bg-white dark:bg-slate-900';

  if (selected) {
    borderClasses = 'border-blue-700 dark:border-blue-500 ring-2 ring-blue-700/20';
    bgClasses = 'bg-blue-50/40 dark:bg-blue-950/30';
  } else if (card.next_action?.overdue) {
    borderClasses = 'border-red-300 dark:border-red-800';
  } else if (card.is_stale) {
    bgClasses = 'bg-amber-50/30 dark:bg-slate-900';
  }

  const formattedValue = card.value_cents
    ? (card.value_cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: card.currency || 'BRL' })
    : 'R$ 0';

  return (
    <div
      tabIndex={0}
      role="button"
      aria-label={`Item ${card.title} - ${formattedValue}`}
      draggable
      onDragStart={(e) => onDragStart?.(e, card)}
      onClick={() => onOpenDetails(card)}
      onKeyDown={handleKeyDown}
      className={`group relative flex flex-col rounded-lg border shadow-xs transition-all duration-150 cursor-grab active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
        isCompact ? 'p-2.5 gap-1.5' : 'p-3'
      } ${borderClasses} ${bgClasses}`}
      data-testid={`opportunity-card-${card.id}`}
    >
      {isCompact ? (
        /* ================= MODO COMPACT (~74px) ================= */
        <div className="flex flex-col gap-1 min-w-0" data-testid={`opportunity-card-compact-${card.id}`}>
          {/* Linha 1: Checkbox + Título + Badge */}
          <div className="flex items-center justify-between gap-1.5 min-w-0">
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <input
                type="checkbox"
                checked={selected}
                onChange={(e) => {
                  e.stopPropagation();
                  onToggleSelect?.(card.id);
                }}
                onClick={(e) => e.stopPropagation()}
                className="h-3.5 w-3.5 shrink-0 rounded border-slate-300 text-blue-900 focus:ring-blue-800 cursor-pointer"
                aria-label={`Selecionar ${card.title}`}
                data-testid={`opportunity-card-checkbox-${card.id}`}
              />
              <div className="flex items-center gap-1 min-w-0 flex-1">
                <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <h4 className="truncate text-[12px] font-semibold text-slate-900 dark:text-slate-100" title={card.title}>
                  {card.title}
                </h4>
              </div>
            </div>

            {/* Badge de Temperatura / Prioridade */}
            {card.temperature === 'hot' && (
              <span className="inline-flex items-center gap-1 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700 dark:bg-red-950/50 dark:text-red-300 shrink-0">
                <Flame className="h-3 w-3 fill-red-500 text-red-500" /> HOT
              </span>
            )}
            {card.temperature === 'warm' && (
              <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 shrink-0">
                <Zap className="h-3 w-3 fill-amber-500 text-amber-600" /> WARM
              </span>
            )}
            {card.temperature === 'cold' && (
              <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400 shrink-0">
                <ThermometerSnowflake className="h-3 w-3 text-slate-400" /> COLD
              </span>
            )}
          </div>

          {/* Linha 2: Contato Principal */}
          {card.primary_contact && (
            <div className="flex items-center gap-1 min-w-0 text-[11px] text-slate-500 dark:text-slate-400 pl-5">
              <User className="h-3 w-3 shrink-0 text-slate-400" />
              <span className="truncate font-medium">{card.primary_contact.name}</span>
            </div>
          )}

          {/* Linha 3: Valor + Aging + Controles */}
          <div className="flex items-center justify-between gap-1 pt-1 mt-0.5 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[13px] font-bold tracking-tight text-blue-950 dark:text-blue-200">
                {formattedValue}
              </span>
              <span className="font-mono text-[10px] font-bold px-1 rounded text-slate-400">
                {card.aging_days}d
              </span>
            </div>

            <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                aria-expanded={false}
                aria-label="Expandir detalhes"
                data-testid={`opportunity-card-expand-${card.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleExpand?.();
                }}
                className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors outline-none focus-visible:ring-1 focus-visible:ring-blue-600"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              <OpportunityCardMenu card={card} onOpenDetails={onOpenDetails} onAction={onAction} />
            </div>
          </div>
        </div>
      ) : (
        /* ================= MODO EXPANDED (~170px) ================= */
        <div className="flex flex-col gap-2 min-w-0" data-testid={`opportunity-card-expanded-${card.id}`}>
          {/* Header com Expand/Collapse e Menu */}
          <div className="flex items-start justify-between gap-1">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <input
                type="checkbox"
                checked={selected}
                onChange={(e) => {
                  e.stopPropagation();
                  onToggleSelect?.(card.id);
                }}
                onClick={(e) => e.stopPropagation()}
                className="h-3.5 w-3.5 rounded border-slate-300 text-blue-900"
              />
              <h4 className="truncate text-[13px] font-semibold text-slate-900 dark:text-slate-100">
                {card.title}
              </h4>
            </div>

            <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                aria-expanded={true}
                aria-label="Recolher detalhes"
                data-testid={`opportunity-card-expand-${card.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleExpand?.();
                }}
                className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 transition-colors"
              >
                <ChevronUp className="h-3.5 w-3.5" />
              </button>
              <OpportunityCardMenu card={card} onOpenDetails={onOpenDetails} onAction={onAction} />
            </div>
          </div>

          {/* Dados Contextuais do Expanded */}
          <div className="text-[11px] text-slate-500">
            {card.primary_contact?.name} • {card.owner?.name}
          </div>

          <div className="text-[14px] font-bold text-blue-950 dark:text-blue-200">
            {formattedValue}
          </div>

          {card.last_activity && (
            <div className="text-[11px] bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded text-slate-600 dark:text-slate-300">
              Última atividade: {card.last_activity.description}
            </div>
          )}

          {card.next_action && (
            <div className="text-[11px] text-indigo-700 dark:text-indigo-300 font-medium">
              Próxima: {card.next_action.title}
            </div>
          )}

          {/* Tags */}
          {card.tags.length > 0 && (
            <div className="flex gap-1 overflow-hidden pt-1 border-t border-slate-100 dark:border-slate-800">
              {card.tags.map((tag) => (
                <span key={tag.id} className="text-[10px] px-1 py-0.5 rounded text-white bg-blue-600 font-medium">
                  {tag.name}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
```

### 5.3 `PipelineColumn.tsx` — Gestão de Estado Local por Coluna
```tsx
'use client';

import React, { useState } from 'react';
import { CardDTO } from './types';
import { OpportunityCard } from './OpportunityCard';

interface PipelineColumnProps {
  title: string;
  cards: CardDTO[];
  selectedIds: number[];
  onToggleSelect: (id: number) => void;
  onOpenDetails: (card: CardDTO) => void;
  onDropCard: (card: CardDTO, targetStageKey: string) => void;
}

export const PipelineColumn: React.FC<PipelineColumnProps> = ({
  title,
  cards,
  selectedIds,
  onToggleSelect,
  onOpenDetails,
  onDropCard,
}) => {
  // Estado local isolado por coluna
  const [expandedCardIds, setExpandedCardIds] = useState<Set<number>>(new Set());

  const toggleCardExpanded = (id: number) => {
    setExpandedCardIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="flex flex-col w-80 bg-slate-100 rounded-xl p-3">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-bold text-slate-800">{title} ({cards.length})</h3>
      </div>

      <div className="flex flex-col gap-2.5 flex-1">
        {cards.map((card) => (
          <OpportunityCard
            key={card.id}
            card={card}
            density={expandedCardIds.has(card.id) ? 'expanded' : 'compact'}
            onToggleExpand={() => toggleCardExpanded(card.id)}
            selected={selectedIds.includes(card.id)}
            onToggleSelect={onToggleSelect}
            onOpenDetails={onOpenDetails}
            onDragStart={(e) => {
              e.dataTransfer.setData('application/json', JSON.stringify(card));
            }}
          />
        ))}
      </div>
    </div>
  );
};
```

### 5.4 `OpportunityCardSkeleton.tsx` — Carregamento Fluido sem CLS
```tsx
'use client';

import React from 'react';
import { CardDensity } from './types';

export const OpportunityCardSkeleton: React.FC<{ density?: CardDensity }> = ({ density = 'compact' }) => {
  if (density === 'expanded') {
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-3 shadow-xs animate-pulse dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <div className="h-4 w-3/4 bg-slate-200 rounded dark:bg-slate-700" />
          <div className="h-4 w-10 bg-slate-200 rounded dark:bg-slate-700" />
        </div>
        <div className="h-5 w-1/2 bg-slate-200 rounded dark:bg-slate-700" />
        <div className="h-3 w-4/5 bg-slate-200 rounded dark:bg-slate-700" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-slate-200 bg-white p-2.5 shadow-xs animate-pulse dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1">
          <div className="h-3.5 w-3.5 rounded bg-slate-200 shrink-0 dark:bg-slate-700" />
          <div className="h-3.5 w-1/2 rounded bg-slate-200 dark:bg-slate-700" />
        </div>
        <div className="h-4 w-10 rounded bg-slate-200 shrink-0 dark:bg-slate-700" />
      </div>
      <div className="pl-5">
        <div className="h-3 w-1/3 rounded bg-slate-200 dark:bg-slate-700" />
      </div>
      <div className="flex items-center justify-between pt-1 mt-0.5 border-t border-slate-100 dark:border-slate-800/80">
        <div className="h-4 w-14 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-4 w-4 rounded bg-slate-200 dark:bg-slate-700" />
      </div>
    </div>
  );
};
```

---

## 6. Como Adaptar para Outros Segmentos de SaaS

| Segmento SaaS | Métrica Âncora 1 (Título) | Métrica Âncora 2 (Valor/Score) | Métrica Âncora 3 (Status) | Dados Expandidos |
| :--- | :--- | :--- | :--- | :--- |
| **Helpdesk / Suporte** | Assunto do Ticket / Solicitante | SLA Restante (`2h restantes`) | Prioridade (`P1`, `P2`, `Urgent`) | Conversa recente, Tags, Categoria, CSAT anterior |
| **Gestão de Tarefas (Jira)** | Título da Issue + Chave (`PROJ-102`) | Pontos / Estimativa (`5 SP`) | Responsável / Tipo (Bug, Story) | Sub-tarefas, Critérios de Aceite, PRs vinculados |
| **ATS / Recrutamento** | Nome do Candidato + Cargo | Score de Match (`92% IA`) | Origem (LinkedIn, Indicação) | Última entrevista, Pretensão salarial, Feedback |
| **Logística / Pedidos** | ID do Pedido + Destinatário | Valor do Frete / Pedido | Prazo de Entrega (Previsão) | Rastreio de rota, Nota fiscal, Itens do pacote |

---

## 7. Checklist de Qualidade para Novos Produtos

- [ ] **Modo Compact como Default:** O Kanban sempre inicializa com os cards compactados.
- [ ] **Acessibilidade WCAG:** Botão de expansão possui `aria-expanded="false|true"` e `aria-label` dinâmico.
- [ ] **Teclado:** Foco navegável por Tab e acionamento por Enter / Space no container do card.
- [ ] **Isolamento de StopPropagation:** Clicar no botão expandir nunca dispara a abertura do modal/drawer.
- [ ] **Dark Mode:** Todos os tokens usam variantes `dark:bg-*` e `dark:border-*`.
- [ ] **Layout Shifts (CLS):** Skeleton de carregamento espelha fielmente a altura do modo compact (~74px).
