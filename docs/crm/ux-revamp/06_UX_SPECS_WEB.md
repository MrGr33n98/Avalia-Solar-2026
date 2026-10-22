# 06 — Especificação de UX / UI: Web App (Desktop & Tablet ≥ 768px)

## 1. Princípios de Layout para Web
- **Breakpoints:** Tablet (768px – 1023px) e Desktop (≥ 1024px, otimizado para 1280px–1600px).
- **Estrutura Shell:**
  - **Sidebar Lateral (`CRMSidebar.tsx`):** Largura de 256px (expandida) ou 64px (colapsada via `localStorage`). Fundo navy escuro `#0c102b`, borda discreta em `border-slate-850`, texto em `text-slate-300`, ícone ativo em `text-emerald-400` com badge de contagem.
  - **Topbar Superior (`CRMTopbar.tsx`):** Altura fixa de 56px (`h-14`), fundo navy institucional `#0c1a30`, borda inferior `border-slate-800`.
  - **Área Central (`main`):** `max-w-[1600px]`, preenchimento `p-6` a `p-8`, fundo cinza-neutro `bg-slate-50`. Rolagem vertical exclusiva da área de conteúdo principal, mantendo sidebar e topbar fixas.

---

## 2. Padrões por Tela

### 2.1 Visão Geral / Hoje (`/dashboard/sales/today`)
- **Grid de Indicadores:** 4 KPI cards em 1 linha com métricas verdadeiras (Oportunidades em aberto, Tarefas atrasadas, Follow-ups de hoje, Receita potencial em BRL).
- **Divisão Bilateral:**
  - Coluna Principal (65% largura): Lista ordenada de tarefas do dia e atividades pendentes com filtros rápidos (Todas, Atrasadas, Hoje, Próximas).
  - Painel Lateral de Apoio (35% largura): Sugestões de Next Best Action com contexto da oportunidade e botão de ação rápida.

### 2.2 Pipeline Comercial (`/dashboard/sales/pipeline`)
- **Quadro Kanban (`PipelineBoard.tsx`):**
  - Colunas lado a lado por estágio (Prospecção, Qualificação, Apresentação, Negociação, Ganho/Perdido).
  - Rolagem horizontal restrita ao container do quadro, sem gerar scrollbar na janela do navegador.
  - Cards de Oportunidade densos com: Título, Empresa, Contato principal, Valor em R$ e badge de temperatura (Hot, Warm, Cold).
  - Drag-and-Drop transacional com feedback visual de hover sobre a coluna alvo.

### 2.3 Visões 360° (Empresas, Contatos e Oportunidades)
- **Cabeçalho Fixo do Registro:** Nome em destaque, status, owner e botões de ação rápida primária (Nova Oportunidade, Registrar Ligação, Enviar E-mail).
- **Painéis em 2 Colunas:**
  - Esquerda (60%): Linha do tempo unificada com abas de filtro (Tudo, Ligações, E-mails, Notas, Tarefas).
  - Direita (40%): Ficha cadastral detalhada, comitê de decisão e checklist de qualificação técnica.
