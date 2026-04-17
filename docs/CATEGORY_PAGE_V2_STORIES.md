# 🎯 Category Page v2 — Sprint Stories & Tasks

**Ciclo:** Sprint 1 + Sprint 2  
**Epic:** Category Page v2 Dominante (Converssão + Monetização)  
**Timestamp:** 2026-02-27T00:53:47Z

---

## 📌 SPRINT 1 — Foundation & Integration (14h)

### Story S1-001: Code Cleanup & Architecture

**Title:** Remover componentes duplicados e consolidar arquitetura  
**Effort:** 3.5h  
**Priority:** P0 (Bloqueador)

**Context:**
Atualmente existem componentes obsoletos que causam confusão de manutenção e aumentam bundle size desnecessariamente.

**Acceptance Criteria:**
- [ ] Arquivo `CategoriesGrid.tsx` removido
- [ ] Arquivo `CategoryColumn.tsx` removido
- [ ] Arquivo `_CategoryClientComponent_HEAD.tsx` removido (merge artifact)
- [ ] Arquivo `CategoryClientComponent_restore.tsx` removido (backup)
- [ ] Estrutura de pasta consolidada em `app/categories/[slug]/`
- [ ] TypeScript sem erros após limpeza
- [ ] Build sem warnings relacionados a imports mortos

**Tasks:**
1. [ ] Auditoria: listar todos arquivos de category no projeto
2. [ ] Identificar e documentar dependências de cada arquivo
3. [ ] Remover arquivos não utilizados (com backup em commit message)
4. [ ] Atualizar imports em componentes que dependiam dos removidos
5. [ ] Executar `npm run build` e validar sem erros
6. [ ] Commit: "refactor: remove obsolete category components"

**Definition of Done:**
- Build limpo
- Sem console errors/warnings
- Nenhum dead code import

---

### Story S1-002: Implementar CategoryHero Component

**Title:** Criar hero compacto com prova social + CTAs primários  
**Effort:** 2h  
**Priority:** P0

**Context:**
Hero deve guiar decisão do usuário: apresentar categoria com valor + prova social + CTAs claros (modal "Como funciona" + lead modal).

**Acceptance Criteria:**
- [ ] Componente `CategoryHero.tsx` criado em `components/categories/`
- [ ] Renderiza H1 com nome da categoria
- [ ] Exibe subheadline: "Compare empresas verificadas • ranking por confiança • solicite orçamentos em minutos"
- [ ] Prova social exibida: `{companies_count} empresas • {reviews_count} avaliações • {verified_pct}% verificadas`
- [ ] CTA secundário: "Como funciona o ranking?" (abre tooltip/modal)
- [ ] CTA primário: "Solicitar orçamentos" (abre LeadModal)
- [ ] Altura total: ~180px (alvo: compacto)
- [ ] Responsivo: stacka em mobile
- [ ] Acessibilidade: aria-label nos CTAs

**Tasks:**
1. [ ] Criar estrutura base do componente
2. [ ] Implementar renderização de H1 + subheadline
3. [ ] Implementar prova social (conditional rendering se dados faltarem)
4. [ ] Implementar CTAs com onClick handlers
5. [ ] Ajustar responsividade (mobile: stack, desktop: row)
6. [ ] Adicionar aria-labels obrigatórios
7. [ ] Teste manual: viewport 375px, 768px, 1200px

**Definition of Done:**
- Componente renderiza sem erros
- Lighthouse accessibility >= 90
- Responsivo validado em 3 breakpoints

---

### Story S1-003: Implementar DecisionChips Component

**Title:** Criar quick filters que aplicam estado instantaneamente  
**Effort:** 2.5h  
**Priority:** P0

**Context:**
Chips permitem usuários refinar categorias rapidamente sem abrir drawer/modal de filtros. Devem refletir estado ativo visualmente.

**Acceptance Criteria:**
- [ ] Componente `DecisionChips.tsx` criado
- [ ] Renderiza chips: [Verificadas], [Nota +4.5], [Meu estado], [Industrial], etc.
- [ ] Click em chip aplica filtro via `onFilterChange`
- [ ] Chip ativa muda visual (cor/outline) para indicar estado
- [ ] Em mobile: scroll horizontal (overflow-x: auto)
- [ ] Múltiplas seleções permitidas
- [ ] Remove filtro ao clicar novamente (toggle)
- [ ] URL params atualizados via router
- [ ] Tracking: `quick_filter_click { filter_name }`

**Tasks:**
1. [ ] Definir tipos de chips disponíveis (verified, rating, state, segment, etc.)
2. [ ] Criar chip individual component
3. [ ] Implementar estado active/inactive visual
4. [ ] Implementar onClick + onFilterChange
5. [ ] Ajustar layout mobile (scroll)
6. [ ] Implementar tracking
7. [ ] Testes: seleção/deselection, múltiplos ativos, layout mobile

**Definition of Done:**
- Chips toggle corretamente
- Visual feedback claro
- Mobile scroll funciona
- Tracking implementado

---

### Story S1-004: Refactor CompanyCardV2 (Compact Variant)

**Title:** Criar card compacto otimizado para conversão  
**Effort:** 2h  
**Priority:** P0

**Context:**
Reduzir altura de card (240px → 160px), mudar imagem 16:9 para 1:1, remover botão "Explorar" redundante. Este é o card padrão para lista orgânica.

**Acceptance Criteria:**
- [ ] Componente `CompanyCardV2.tsx` criado com variant "compact"
- [ ] Imagem em proporção 1:1 (quadrado) em vez de 16:9
- [ ] Altura total: ~160px (antes: 240px, -33%)
- [ ] Conteúdo: Logo + Nome + Rating + Contadores
- [ ] Botão CTA único (sem "Explorar" redundante)
- [ ] Sem gradient overlay problemático (acessibilidade)
- [ ] aria-label obrigatório: `"Ver perfil de {company_name}"`
- [ ] Hover: lift effect (scale + shadow)
- [ ] Responsivo: 1 coluna mobile, 2+ desktop

**Tasks:**
1. [ ] Criar estrutura base do card
2. [ ] Implementar imagem 1:1 com Image optimization
3. [ ] Renderizar nome + badges (rating, reviews)
4. [ ] Remover botão "Explorar"; manter card clicável inteiro
5. [ ] Implementar aria-label + semantic HTML
6. [ ] Testar contraste com axe-core
7. [ ] Testes: responsive, hover states, accessibility

**Definition of Done:**
- Card altura 160px
- Sem acessibilidade issues
- Visual feedback adequado
- Imagens carregam corretamente

---

### Story S1-005: Implementar LeadCTA Logic Component

**Title:** Criar componente que decide entre lead interno vs direto  
**Effort:** 1.5h  
**Priority:** P0

**Context:**
`LeadCTA` é um componente crítico que encapsula a lógica de monetização: empresas FREE → lead modal interno; empresas PAGAS → link direto (WhatsApp/site).

**Acceptance Criteria:**
- [ ] Componente `LeadCTA.tsx` criado
- [ ] Aceita props: `company`, `category`, `placement` (card|modal)
- [ ] **Regra A (FREE):** Renderiza `<Button onClick={openLeadModal}>Solicitar Orçamento</Button>`
- [ ] **Regra B (PAGA):** Renderiza `<a href={company.direct_lead_url}>Falar com a Empresa</a>`
- [ ] Microcopy em Regra B: "Resposta mais rápida"
- [ ] Tracking: `lead_open_internal` ou `lead_click_direct`
- [ ] Validação: `company.direct_lead_enabled` obrigatório
- [ ] Fallback: se URL vazia em regra B, usa regra A

**Tasks:**
1. [ ] Criar estrutura base com if/else logic
2. [ ] Implementar Regra A (lead modal)
3. [ ] Implementar Regra B (external link)
4. [ ] Adicionar tracking
5. [ ] Implementar fallback
6. [ ] Unit tests para ambas regras
7. [ ] Testes: click behavior, tracking validation

**Definition of Done:**
- Lógica decide corretamente
- Tracking funciona
- Fallback implementado
- Unit tests passam

---

### Story S1-006: Criar CompaniesGrid Component

**Title:** Grid responsivo para lista orgânica  
**Effort:** 1.5h  
**Priority:** P0

**Context:**
Simples grid que renderiza `CompanyCardV2` em layout responsivo. Suporta paginação e lazy loading.

**Acceptance Criteria:**
- [ ] Componente `CompaniesGrid.tsx` criado
- [ ] Grid responsivo: `grid-cols-1 sm:grid-cols-2 md:grid-cols-3` (corrigir tablet)
- [ ] Renderiza array de companies
- [ ] Skeleton loading por card
- [ ] Lazy loading de imagens
- [ ] Prefetch acima da dobra (primeira 4-6 cards)
- [ ] Sem erro se array vazio

**Tasks:**
1. [ ] Criar estrutura base grid
2. [ ] Implementar responsive classes (md: breakpoint importante)
3. [ ] Implementar skeletons
4. [ ] Implementar lazy loading de imagens
5. [ ] Implementar prefetch logic
6. [ ] Testes responsividade

**Definition of Done:**
- Grid renderiza sem erros
- Responsivo em 3 breakpoints
- Skeletons aparecem
- Prefetch funciona (DevTools Network validation)

---

### Story S1-007: Criar Category Page Server/Client Components

**Title:** Integrar todos componentes em `app/categories/[slug]/page.tsx`  
**Effort:** 2h  
**Priority:** P0

**Context:**
Página principal que compõe: Hero + DecisionChips + TopRanking (S2) + Sponsored (S2) + Toolbar + Grid.

**Acceptance Criteria:**
- [ ] `app/categories/[slug]/page.tsx` (server component) implementado
- [ ] Busca categoria por slug via API
- [ ] Passa dados para `CategoryPageClient.tsx`
- [ ] `CategoryPageClient.tsx` (client component) implementa state + filtros
- [ ] Renderiza sequência: Hero → DecisionChips → Grid (com skeleton por seção)
- [ ] Filtros funcionam: chips + toolbar + paginação
- [ ] URL params refletem filtros aplicados (state persistence)
- [ ] SEO: H1 único, breadcrumbs, canonical

**Tasks:**
1. [ ] Criar page.tsx server component
2. [ ] Criar CategoryPageClient.tsx client component
3. [ ] Implementar fetch de dados categoria
4. [ ] Implementar estado de filtros
5. [ ] Renderizar componentes em sequência
6. [ ] Implementar URL param persistence
7. [ ] Adicionar SEO metadata (H1, breadcrumbs, canonical)
8. [ ] Testes: navegação, filtros, carregamento dados

**Definition of Done:**
- Página renderiza sem erros
- Dados carregam corretamente
- Filtros funcionam
- SEO validado (verifica H1, canonical, breadcrumbs)

---

### Story S1-008: Integrar com API Backend

**Title:** Conectar página com endpoints `/api/v1/categories/{slug}/companies`  
**Effort:** 1.5h  
**Priority:** P0

**Context:**
Página precisa buscar dados reais: categoria info + companies (top_ranking, sponsored, organic) + metadata.

**Acceptance Criteria:**
- [ ] Endpoint `GET /api/v1/categories/{slug}` funciona com schema esperado
- [ ] Campos obrigatórios existem: `verified`, `sponsored`, `direct_lead_enabled`, `direct_lead_url`
- [ ] Resposta inclui: `top_ranking`, `sponsored`, `organic` separados
- [ ] Paginação funciona: `page`, `per_page`, `total_pages`
- [ ] Tratamento de erro: erro 404, timeout, sem dados → fallback graceful
- [ ] Loading states implementados (skeleton por seção)
- [ ] Refetch funciona via button "Tentar novamente"

**Tasks:**
1. [ ] Validar schema API com backend team
2. [ ] Criar API client/hook (ou usar existente)
3. [ ] Implementar fetch em CategoryPageClient
4. [ ] Implementar error handling
5. [ ] Implementar loading states
6. [ ] Implementar refetch button
7. [ ] Testes E2E: dados carregam, erro tratado, refetch funciona

**Definition of Done:**
- Dados carregam em produção
- Erro tratado gracefully
- Loading states funcionam
- Backend validou schema

---

## 📌 SPRINT 2 — Polish, Monetização & QA (21.5h)

### Story S2-001: Implementar TopRankingSection Component

**Title:** Criar seção destacada com top 3 empresas (rich variant)  
**Effort:** 2h  
**Priority:** P1

**Context:**
Seção visualmente distinta exibindo top 3 empresas com card "rich" (mais métricas). Inclui microcopy de metodologia de ranking.

**Acceptance Criteria:**
- [ ] Componente `TopRankingSection.tsx` criado
- [ ] Renderiza top 3 empresas com `CompanyCardV2` variant="rich"
- [ ] Cards ricos mostram: Logo + Nome + Rating + Reviews + Verified badge
- [ ] Altura card rich: ~220px (vs 160px compact)
- [ ] Seção tem header: "Top 3 desta categoria"
- [ ] Microcopy: "Ranking baseado em avaliações verificadas e confiabilidade"
- [ ] Botão: "Ver metodologia do ranking" (link ou modal)
- [ ] Grid: 3 colunas desktop, 1 mobile
- [ ] Séparação visual clara do resto da página (borda/bg diferente)

**Tasks:**
1. [ ] Criar seção wrapper
2. [ ] Implementar card rich variant
3. [ ] Adicionar headers + microcopy
4. [ ] Implementar botão metodologia
5. [ ] Layout responsivo
6. [ ] Testes: renderização, responsividade

**Definition of Done:**
- Seção renderiza corretamente
- Cards mostram dados esperados
- Responsivo validado

---

### Story S2-002: Implementar SponsoredSection Component

**Title:** Criar seção separada para patrocinados com badge  
**Effort:** 1.5h  
**Priority:** P1

**Context:**
Monetização: patrocinados são renderizados separados do orgânico, com badge visual e limite de 2-4 cards.

**Acceptance Criteria:**
- [ ] Componente `SponsoredSection.tsx` criado
- [ ] Renderiza máximo 4 cards patrocinados
- [ ] Badge "Patrocinado" obrigatório em cada card
- [ ] Visual premium: borda/sombra diferenciada vs orgânico
- [ ] Header: "Destaques Patrocinados"
- [ ] Nunca misturar patrocinados com orgânico
- [ ] Escondido se não houver patrocinados
- [ ] Analytics tracking: `sponsored_card_click`

**Tasks:**
1. [ ] Criar seção wrapper
2. [ ] Implementar badge patrocinado
3. [ ] Aplicar estilo premium (CSS)
4. [ ] Implementar limite máximo
5. [ ] Implementar condicional renderização
6. [ ] Adicionar tracking
7. [ ] Testes: visibilidade, limite, styling

**Definition of Done:**
- Seção renderiza corretamente
- Badge visível
- Limite respeitado

---

### Story S2-003: Implementar CompaniesToolbarSticky Component

**Title:** Toolbar fixa com ordenação, contador e chips ativos  
**Effort:** 2h  
**Priority:** P1

**Context:**
Toolbar sticky que acompanha usuário ao scroll, permitindo rápida mudança de ordenação e remoção de filtros ativos.

**Acceptance Criteria:**
- [ ] Componente `CompaniesToolbarSticky.tsx` criado
- [ ] Sticky position: aparece acima do grid ao scroll
- [ ] Dropdown ordenação: Ranking, Mais avaliadas, Melhor nota, Mais recentes
- [ ] Contador: "Exibindo X de Y empresas"
- [ ] Chips ativos removíveis: `[MT] [Verificadas] [X] [Nota +4.5] [X]`
- [ ] Botão "Filtros" mobile only (abre drawer)
- [ ] Z-index >= 20 (acima de outros elementos)
- [ ] Layout: flex row com responsive ajustes
- [ ] Tracking: `sort_change`, `filter_remove`

**Tasks:**
1. [ ] Criar estrutura sticky
2. [ ] Implementar dropdown ordenação
3. [ ] Implementar contador
4. [ ] Implementar chips ativos removíveis
5. [ ] Implementar botão filtros (mobile)
6. [ ] Adicionar tracking
7. [ ] Testes: sticky behavior, interações

**Definition of Done:**
- Toolbar fica sticky ao scroll
- Ordenação funciona
- Chips removíveis funcionam
- Mobile drawer aparece

---

### Story S2-004: Implementar LeadModalInternal Component

**Title:** Modal de conversão interna para captura de leads  
**Effort:** 3h  
**Priority:** P1

**Context:**
Modal com form minimalista para capturar leads internos. Validação, submit, sucesso + upsell sutil.

**Acceptance Criteria:**
- [ ] Componente `LeadModalInternal.tsx` criado
- [ ] Fields: Nome*, WhatsApp*, Cidade/UF*, Tipo Projeto, Potência, Mensagem (opt)
- [ ] Validação: obrigatórios + formato WhatsApp (11 dígitos BR)
- [ ] Submit via POST `/api/v1/leads` com empresa_id, categoria
- [ ] Tela de sucesso: "Enviamos seu pedido para empresas qualificadas"
- [ ] Upsell sutil: "Quer resposta mais rápida? Prefira empresas com contato direto ✅"
- [ ] Botão fechar/X funciona
- [ ] Tracking: `lead_modal_open`, `lead_submit_internal`, `lead_success`
- [ ] Responsivo: mobile, tablet, desktop
- [ ] Sem overflow de conteúdo

**Tasks:**
1. [ ] Criar estrutura modal (usar Dialog shadcn/ui)
2. [ ] Implementar form fields
3. [ ] Implementar validação
4. [ ] Implementar submit logic
5. [ ] Implementar tela de sucesso
6. [ ] Implementar upsell (links para patrocinados)
7. [ ] Adicionar tracking
8. [ ] Testes: validação, submit, sucesso, responsividade

**Definition of Done:**
- Modal abre/fecha corretamente
- Validação funciona
- Submit envia dados corretos
- Tela de sucesso aparece

---

### Story S2-005: Implementar Skeleton Loading (por seção)

**Title:** Criar skeletons granulares para melhorar UX de carregamento  
**Effort:** 2h  
**Priority:** P1

**Context:**
Em vez de skeleton full-page, implementar skeletons por seção (hero, ranking, grid) para feedback visual mais fino.

**Acceptance Criteria:**
- [ ] Skeleton para CategoryHero
- [ ] Skeleton para cada card (compact + rich)
- [ ] Skeleton para grid (renderiza 6 skeletons)
- [ ] Skeleton para toolbar
- [ ] Animar com fade-in + shimmer (opcional mas bom)
- [ ] Sem "flash" de conteúdo após carregar
- [ ] Renderização granular: hero skeleton → após, grid skeleton → após

**Tasks:**
1. [ ] Criar skeleton components
2. [ ] Integrar em CategoryHero
3. [ ] Integrar em CompanyCardV2
4. [ ] Integrar em CompaniesGrid
5. [ ] Integrar em Toolbar
6. [ ] Testar transição skeleton → conteúdo
7. [ ] Testes: performance de render, visual

**Definition of Done:**
- Skeletons aparecem enquanto carrega
- Transição suave para conteúdo
- Sem visual glitches

---

### Story S2-006: Implementar Analytics & Tracking

**Title:** Integrar eventos de tracking em toda página  
**Effort:** 2h  
**Priority:** P1

**Context:**
Tracking de user behavior para ROI analytics: views, cliques, filtros, leads. Usar `track()` existente.

**Acceptance Criteria:**
- [ ] `category_page_view { slug, filters_applied }`
- [ ] `quick_filter_click { filter_name, state: on|off }`
- [ ] `company_card_click { company_id, placement: top|sponsored|organic, card_variant }`
- [ ] `lead_open_internal { company_id, placement, category }`
- [ ] `lead_submit_internal { company_id, category, success: bool }`
- [ ] `lead_click_direct { company_id, category, url }`
- [ ] `sort_change { sort_by }`
- [ ] `filter_toolbar_remove { filter_key }`
- [ ] Analytics dashboard atualizado para aceitar eventos

**Tasks:**
1. [ ] Importar `track()` em componentes
2. [ ] Adicionar eventos em CategoryHero
3. [ ] Adicionar eventos em DecisionChips
4. [ ] Adicionar eventos em CompanyCardV2
5. [ ] Adicionar eventos em LeadCTA
6. [ ] Adicionar eventos em LeadModalInternal
7. [ ] Adicionar eventos em Toolbar
8. [ ] Testes: validar eventos no analytics

**Definition of Done:**
- Eventos disparam corretamente
- Analytics dashboard recebe eventos
- Sem console errors

---

### Story S2-007: Dark Mode Implementation

**Title:** Adicionar variantes dark mode em todos componentes  
**Effort:** 2h  
**Priority:** P1 (Nice-to-have mas alinhado com design system)

**Context:**
Design system moderno requer dark mode. Usar `dark:` classes Tailwind.

**Acceptance Criteria:**
- [ ] CategoryHero com dark mode
- [ ] DecisionChips com dark mode
- [ ] CompanyCardV2 (compact + rich) com dark mode
- [ ] LeadModalInternal com dark mode
- [ ] Toolbar com dark mode
- [ ] Contraste validado em ambos temas (axe-core)
- [ ] Sem hard-coded colors (usar tokens)
- [ ] Preferência do usuário respeitada (prefers-color-scheme)

**Tasks:**
1. [ ] Adicionar `dark:` classes em CategoryHero
2. [ ] Adicionar em DecisionChips
3. [ ] Adicionar em CompanyCardV2
4. [ ] Adicionar em Modal
5. [ ] Adicionar em Toolbar
6. [ ] Testar contraste em ambos temas
7. [ ] Testes: dark mode toggle

**Definition of Done:**
- Dark mode renderiza sem erros
- Contraste WCAG AA+ ambos temas

---

### Story S2-008: Acessibilidade & WCAG Compliance

**Title:** Validar e implementar acessibilidade WCAG AAA  
**Effort:** 2h  
**Priority:** P1

**Context:**
Garantir página é acessível para todos usuários: cego, motor impaired, etc.

**Acceptance Criteria:**
- [ ] Todos links/botões têm aria-label descritivo
  - "Ver perfil da empresa {name}"
  - "Solicitar orçamento para {company}"
  - "Remover filtro {filter_name}"
- [ ] Sem badges flutuando sem contexto (flow document)
- [ ] Contraste WCAG AA+ (mínimo 4.5:1 texto normal)
- [ ] Foco visível em navegação teclado
- [ ] Keyboard navigation funciona (Tab, Enter, Escape)
- [ ] Semântica HTML5: `<nav>`, `<main>`, `<section>`, `<article>`
- [ ] Form labels acessíveis (LeadModalInternal)
- [ ] Erros de form acessíveis (aria-live)
- [ ] axe-core scan: 0 violations críticos

**Tasks:**
1. [ ] Auditoria com axe-core + WAVE
2. [ ] Adicionar aria-labels em todos CTAs
3. [ ] Validar contraste com Color Contrast Analyzer
4. [ ] Testar navegação por teclado (Tab through page)
5. [ ] Testar com screen reader (NVDA/JAWS simulado)
6. [ ] Corrigir semantic HTML
7. [ ] Final axe-core scan

**Definition of Done:**
- axe-core: 0 violations
- WCAG AAA compliant
- Keyboard navigation funciona

---

### Story S2-009: Responsividade & Tablet Fix

**Title:** Corrigir grid em tablet (md: breakpoint)  
**Effort:** 1.5h  
**Priority:** P1

**Context:**
Atual layout pula de 1 coluna (mobile) para 3 (desktop). Falta breakpoint tablet (md: 768px) que causa cards imensos.

**Acceptance Criteria:**
- [ ] Grid em mobile (< 640px): 1 coluna
- [ ] Grid em tablet (640px-1024px): 2 colunas ✅ (novo)
- [ ] Grid em desktop (> 1024px): 3 colunas
- [ ] Sidebar de filtros (S1 futuro): responsive (escondido mobile, drawer)
- [ ] Toolbar sticky: responsivo em todos tamanhos
- [ ] Chips: scroll horizontal em mobile
- [ ] Nenhum overflow/scroll horizontal inesperado

**Tasks:**
1. [ ] Atualizar Tailwind classes: `md:grid-cols-2`
2. [ ] Testar em breakpoints: 375px, 640px, 768px, 1024px, 1200px
3. [ ] Validar imagens scalability
4. [ ] DevTools device emulation: iPhone, iPad, Desktop

**Definition of Done:**
- Grid responsivo em todos breakpoints
- Sem overflow
- Imagens dimensionadas corretamente

---

### Story S2-010: Testes E2E (Playwright)

**Title:** Testes E2E completos de jornada usuario  
**Effort:** 3h  
**Priority:** P1

**Context:**
Validar fluxos críticos: navegação, filtros, lead modal, responsividade.

**Acceptance Criteria:**
- [ ] Test: Load page → hero visible → data loads
- [ ] Test: Click chip filter → grid atualiza
- [ ] Test: Click company card → lead modal abre
- [ ] Test: Fill lead form → validação + submit → sucesso
- [ ] Test: Mobile → drawer filters → apply
- [ ] Test: Tablet breakpoint → grid 2 cols
- [ ] Test: Prefetch → DevTools network
- [ ] Test: Dark mode toggle
- [ ] Todos tests passam em CI/CD

**Tasks:**
1. [ ] Setup Playwright (ou Cypress)
2. [ ] Criar test suite base
3. [ ] Implementar tests acima
4. [ ] Executar localmente
5. [ ] Integrar em CI/CD
6. [ ] Documentar como rodar

**Definition of Done:**
- Todos E2E tests passam
- CI/CD verde
- Documentação de como rodar tests

---

## 🎯 Story Mapping (Sequência Recomendada)

```
S1-001 (Code Cleanup)
  ↓
S1-002 (Hero) → S1-003 (Chips) → S1-004 (CardV2) → S1-005 (LeadCTA)
  ↓
S1-006 (Grid) → S1-007 (Page) → S1-008 (API Integration)
  ↓ (Sprint 2)
S2-001 (Top Ranking) → S2-002 (Sponsored)
  ↓
S2-003 (Toolbar) → S2-004 (Lead Modal)
  ↓
S2-005 (Skeletons) → S2-006 (Analytics)
  ↓
S2-007 (Dark Mode) → S2-008 (Accessibility)
  ↓
S2-009 (Responsividade) → S2-010 (E2E Tests)
```

---

## 📊 Estimativa Total

| Sprint | Stories | Effort | Buffer | Total |
|--------|---------|--------|--------|-------|
| **Sprint 1** | 8 | 14h | +1.5h (10%) | **15.5h** |
| **Sprint 2** | 10 | 21.5h | +2.5h (10%) | **24h** |
| **TOTAL** | 18 | **35.5h** | +4h | **39.5h** |

**Estimativa por dev:** ~5 dias de trabalho (8h/dia)

---

## 🚀 Próximos Passos

1. **Sprint Planning:**
   - [ ] Revisar stories com team
   - [ ] Confirmar effort estimates
   - [ ] Atribuir ownership (qui faz o quê)

2. **Setup:**
   - [ ] Criar branch feature
   - [ ] Setup local environment
   - [ ] Criar PRs/issues no GitHub

3. **Development:**
   - Executar Sprint 1 → Sprint 2 conforme plano
   - Daily standups para alinhar blockers

4. **QA & Deploy:**
   - [ ] Testes E2E em staging
   - [ ] Validação de performance (Lighthouse)
   - [ ] Validação de acessibilidade (axe-core)
   - [ ] Validação de analytics
   - [ ] Deploy para produção
   - [ ] Monitor de issues pós-deploy (rollback plano se necessário)

---

**Documento criado por:** Technical Product Owner  
**Status:** 🟡 READY FOR SPRINT PLANNING  
**Próxima ação:** Agendamento de Sprint Planning Meeting

---
