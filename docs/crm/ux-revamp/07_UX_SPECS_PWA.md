# 07 — Especificação de UX / UI: PWA Mobile (< 768px)

## 1. Princípios de Layout para Mobile & PWA
- **Faixa de Viewports Suportada:** 320px (iPhone SE legado), 360px (Android compacto), 375px/390px/430px (smartphones padrão e Max).
- **Sem Scroll Horizontal da Janela:** Largura estrita `w-full max-w-full overflow-x-hidden`. Nenhum card ou tabela pode estourar a largura da tela.
- **Áreas Seguras (Safe Area Insets):**
  - Topo: `padding-top: env(safe-area-inset-top)`.
  - Base: `padding-bottom: calc(54px + env(safe-area-inset-bottom))`.
- **Área de Toque Mínima (Tap Targets):** Botões e controles interativos com área de toque de no mínimo 44x44px.

---

## 2. Shell Móvel e Navegação Inferior

### 2.1 Header Móvel Compacto
- **Altura:** 52px + safe area top.
- **Elementos:** Logotipo compacto Avalia Solar à esquerda, botão de busca global (ícone de lupa) e botão Adicionar (`+` azul/esmeralda) à direita.
- **Modo Subpágina / Detalhe 360°:** O logotipo é substituído pelo botão "Voltar" (seta esquerda) e pelo título truncado do registro atual (ex: "Empresa: Solarium Energy").

### 2.2 Barra Inferior do CRM (`CRMMobileBottomNav.tsx`)
- **Altura Visual:** 54px + `env(safe-area-inset-bottom)`.
- **Fundo:** `#0c102b` (navy profundo idêntico à sidebar desktop), com borda superior `border-slate-800`.
- **5 Destinos do CRM:**
  1. **Hoje:** Ícone `CalendarClock`, rota `/dashboard/sales/today`.
  2. **Pipeline:** Ícone `CircleDollarSign`, rota `/dashboard/sales/pipeline`.
  3. **Empresas:** Ícone `Building2`, rota `/dashboard/sales/accounts`.
  4. **Tarefas:** Ícone `CheckSquare`, rota `/dashboard/sales/tasks`.
  5. **Mais:** Ícone `Menu` / `MoreHorizontal`, abre menu de rotas secundárias (Prospecção, Relatórios, Propostas, Configurações).
- **Isolamento de Conflito:** A barra pública do marketplace é automaticamente ocultada sob rotas `/dashboard/**` via `shouldHideMobileNav()`.

---

## 3. Padrões de Interação e Bottom Sheets (≤ 70dvh)

### 3.1 Filtros e Seletores Rápidos
- Em telas móveis, filtros de listas e seletores de estágio não abrem diálogos centralizados que cobrem a tela toda.
- Abrem um **Bottom Sheet** com altura máxima de até `70dvh` (`max-h-[70dvh]`), cantos superiores arredondados (`rounded-t-2xl`), alça de puxar (drag handle) visual e botão "Aplicar Filtros" fixo no rodapé do sheet.
- Teclado virtual: o sheet respeita a `visualViewport` dinâmica, garantindo que o botão de submissão permaneça acessível sem rolagem truncada.

### 3.2 Modais de Criação e Ficha Completa
- Formulários com mais de 4 campos (ex: `CreateCompanyModal`, `CreateOpportunityDialog`) ocupam altura completa (`h-full` ou `95dvh`) para digitação confortável com teclado visível.
- Proteção de Rascunho (Dirty Form): tentar fechar tocando fora ou no botão voltar dispara diálogo de confirmação para prevenir perda de notas.
