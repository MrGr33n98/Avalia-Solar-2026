# Avalia Solar — Arquitetura de Navegação TO-BE (TO_BE_NAVIGATION.md)
**Data:** 13/10/2026  
**Módulo:** Workspace de Propostas Enterprise A+++

---

## 1. Arquitetura de Layout Adaptativo (3 / 2 / 1 Regiões)

O layout TO-BE é governado pela **largura útil real** disponível após a sidebar empresarial (que ocupa ~112px em estado recolhido ou ~240px em estado expandido).

```
┌─────────────────────────── SHELL DO DASHBOARD EMPRESARIAL ──────────────────────────┐
│ Topo / Toolbar da Empresa                                                           │
├─────────┬───────────────────────────────────────────────────────────────────────────┤
│ SIDEBAR │ BARRA DE FERRAMENTAS DO WORKSPACE (Título, Abas Agrupadas, Busca, + Nova) │
│ CANÔNICA├─────────────────────┬───────────────────────────────┬─────────────────────┤
│         │ REGIÃO 1: LISTA     │ REGIÃO 2: DETALHES            │ REGIÃO 3: CONVERSA  │
│         │ (280px - 320px)     │ (flex-1 min-w-0)              │ (320px - 360px)     │
│         │                     │                               │                     │
│         │ • Busca e Ordenação │ • Identificação e Lead        │ • Cabeçalho P2P     │
│         │ • Cards clicáveis   │ • Abas:                       │ • Histórico Real    │
│         │ • Status coloridos  │   - Resumo Comercial          │ • Anexos e Envio    │
│         │ • Badge de versão   │   - Itens & Técnico           │ • Empty state       │
│         │ • Scroll vertical   │   - Documentos PDF            │   quando não aberta │
│         │                     │   - Histórico & Timeline      │ • Composer fixo     │
│         │                     │ • Ações (Ver/Nova Versão)     │                     │
└─────────┴─────────────────────┴───────────────────────────────┴─────────────────────┘
```

### 1.1 Regras por Faixa de Largura Útil

1. **Desktop Amplo (Largura Útil ≥ 1180px):**
   - **3 Regiões Visíveis Simultaneamente:**
     - **Coluna Esquerda (Lista):** Fixa entre `280px` e `320px`.
     - **Coluna Central (Detalhes):** Flexível (`minmax(0, 1fr)`).
     - **Coluna Direita (Conversa):** Fixa entre `320px` e `360px`.
   - Cada coluna possui seu próprio scroll vertical independente (`overflow-y-auto`), sem duplo scroll da página.
2. **Desktop Médio / Tablet (Largura Útil entre 800px e 1179px):**
   - **2 Regiões Visíveis:**
     - Coluna 1 (Lista: `300px`).
     - Coluna 2 (Detalhes da Proposta: `flex-1`).
   - A Conversa fica acessível contextualmente por botão com badge na barra de detalhes, abrindo um Sheet/Drawer lateral deslizante ou aba dedicada sem perda de estado.
3. **Mobile e PWA (Largura Útil < 800px):**
   - **Navegação Progressiva em 1 Tela por Vez:**
     - **Tela 1 — Lista:** Busca, filtros rápidos e cards de propostas.
     - Ao tocar em um card → transição suave para **Tela 2 — Detalhes da Proposta**.
     - Barra de navegação superior com botão `< Voltar para lista`, breadcrumb e ações primárias.
     - Aba ou botão de acesso para **Tela 3 — Conversa / Chat do Lead**, com botão `< Voltar para proposta`.

---

## 2. Fluxo Canônico de Deep Link (`/dashboard/proposals?id={id}`)

1. Ao carregar a página:
   - Verifica se há parâmetro `id` na query string.
   - Procura a proposta na lista carregada da empresa ativa.
2. Se o ID estiver na lista:
   - Seleciona a proposta (`selectedProposal`).
   - Sincroniza a conversa vinculada no painel de chat.
3. Se o ID **NÃO** for encontrado:
   - Dispara chamada individual de verificação `companyMarketplaceProposalsApi.get(id, companyId)`.
   - Se a API retornar `404` ou `403` (proposta inexistente ou pertencente a outro tenant):
     - Exibe banner de alerta explícito: `"Proposta AS-XXXX não encontrada ou sem permissão de acesso para esta empresa."`
     - **PROIBIDO:** fallback silencioso para a primeira proposta da lista.
     - Botão `Limpar filtro de busca` para visualizar a lista geral.

---

## 3. Diretrizes de Design UI UX Pro Max

### 3.1 Paleta de Cores e Tokens
- **Fundo da Página:** `bg-slate-50/60` ou `hsl(var(--clay-bg))`.
- **Containers e Cards:** `bg-white` com bordas sutis `border-slate-200` e sombras leves `shadow-sm`.
- **Identidade Primária (Navy & Slate):**
  - Títulos e textos de destaque: `text-slate-950` e `text-slate-900`.
  - Textos secundários e metadados: `text-slate-500` e `text-slate-600`.
- **Acentos Solares e Primários:**
  - Azul Solar: `bg-blue-600` e `text-blue-600` para CTAs primários e seleção ativa.
  - Amarelo Solar: Apenas em acentos de atenção/oportunidade (`amber-500` / `yellow-500`).
  - **PROIBIDO:** Tons dominantes de verde ou gradientes roxos artificiais.

### 3.2 Tipografia e Escala
- Títulos de seção: `text-sm` a `text-base font-bold text-slate-900`.
- Rótulos e metadados: `text-xs font-semibold uppercase tracking-wider text-slate-500`.
- Corpo de texto: `text-xs sm:text-sm text-slate-700`.
- **PROIBIDO:** Textos de decisão menores que `11px` (proibir 9px ilegível).

### 3.3 Cards e Acessibilidade
- Raios de borda consistentes: `rounded-xl` (12px) a `rounded-2xl` (16px).
- Interatividade: `:hover:border-slate-300`, `:focus-visible:ring-2 :focus-visible:ring-blue-500`.
- Card selecionado: `border-blue-500 bg-blue-50/30 ring-1 ring-blue-500`.
