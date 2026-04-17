# 📋 Category Page v2 - Plano de Implementação Executivo

**Status:** 🟡 PLANNING  
**Data:** 27/02/2026  
**Owner:** Technical Product Owner + Frontend Lead  
**Referência:** ANALISE_CRITICA_CATEGORIES.md + PO Master Prompt

---

## 🎯 Visão Geral

Implementar a **Category Page v2 Dominante** — uma página de categoria padronizada, replicável e otimizada para conversão que será usada em **TODAS as rotas `/categories/[slug]`**.

### Resultado Esperado:
```
ANTES: Página desorganizada, cards pesados, sem decisão guiada
├─ 2-3 categorias visíveis
├─ 240px de altura por card
└─ CTAs confusos

DEPOIS: Página com jornada clara, separação monetária, leads guiados
├─ 6-8 categorias visíveis
├─ 160px de altura por card (redução de 33%)
├─ CTAs únicos e diretos (interno vs externo)
└─ Analytics completo para ROI
```

---

## 📐 Arquitetura da Solução

### Estrutura Visual da Página

```
┌─────────────────────────────────────────────────────┐
│  HERO COMPACTO                                      │
│  H1: "Energia Solar Comercial" + Subheadline       │
│  Prova Social: "234 empresas • 1.2k avaliações"    │
│  CTA: "Como funciona" (modal) | "Solicitar" (lead) │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  DECISION LAYER (Quick Filters / Chips)             │
│  [Verificadas] [Nota +4.5] [Meu estado] [Industrial]
│  Atualiza grid em tempo real                        │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  TOP RANKING SECTION (Destacado)                    │
│  "Top 3 desta categoria"                            │
│  ┌──────────┬──────────┬──────────┐                 │
│  │ Card Rich│ Card Rich│ Card Rich│ (métricas ext.)
│  └──────────┴──────────┴──────────┘                 │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  SPONSORED SECTION (Seção Separada)                 │
│  "Destaques Patrocinados" 🏷️ PATROCINADO           │
│  ┌──────────┬──────────┐                            │
│  │ Card Prem│ Card Prem│ (máx 2-4)                 │
│  └──────────┴──────────┘                            │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  TOOLBAR STICKY (Ordenação + Chips Ativos)         │
│  Ordenar: [Ranking ▼] Exibindo 12 de 156           │
│  Ativos: [MT] [Verificadas] [X] [Nota +4.5] [X]   │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  COMPANIES GRID (Orgânico)                          │
│  ┌────────┬────────┬────────┐ (responsive: 1/2/3)  │
│  │ Compact│ Compact│ Compact│                       │
│  │ Card V2│ Card V2│ Card V2│                       │
│  └────────┴────────┴────────┘                       │
│  Skeleton por seção + Prefetch above-the-fold       │
└─────────────────────────────────────────────────────┘
```

---

## 🏗️ Componentes Obrigatórios

### 1. **CategoryHero** (Novo)
**Responsabilidade:** Hero compacto + decisão inicial

**Props:**
```typescript
interface CategoryHeroProps {
  category: {
    name: string;
    slug: string;
    companies_count: number;
    reviews_count: number;
    verified_pct: number; // %
  };
  onLeadClick?: () => void;
}
```

**Output:**
- H1 com nome da categoria
- Subheadline com valor proposto
- Prova social (3 métricas)
- 2 CTAs: "Como funciona?" + "Solicitar orçamentos"

**Altura:** 180px (antes: 240px no hero antigo)

---

### 2. **DecisionChips** (Novo)
**Responsabilidade:** Quick filters que aplicam estado instantaneamente

**Props:**
```typescript
interface DecisionChipsProps {
  category: string;
  activeFilters: {
    verified?: boolean;
    minRating?: number;
    segment?: string;
    state?: string;
  };
  onFilterChange: (key: string, value: any) => void;
  availableFilters: AvailableFiltersData;
}
```

**Exemplos de chips:**
- [Verificadas]
- [Nota +4.5]
- [São Paulo]
- [Industrial]
- [Até 75kW]

**Comportamento:**
- Toggle em click
- Atualiza URL params
- Chips ativas refletem estado com cor/outline
- Em mobile: scroll horizontal

---

### 3. **TopRankingSection** (Novo)
**Responsabilidade:** Exibir top 3 empresas com layout rich

**Props:**
```typescript
interface TopRankingSectionProps {
  companies: CompanyRich[];
  category: string;
}
```

**Layout:**
- Grid 3 colunas desktop / 1 coluna mobile
- Card rico com mais métricas (rating, reviews, verified badge)
- Microcopy: "Ranking baseado em avaliações verificadas"
- Botão: "Ver metodologia"

---

### 4. **SponsoredSection** (Novo)
**Responsabilidade:** Exibir patrocinados separados e monetizáveis

**Props:**
```typescript
interface SponsoredSectionProps {
  companies: CompanySponsored[];
  category: string;
}
```

**Validações:**
- Máximo 4 cards patrocinados
- Badge "Patrocinado" obrigatório
- Visual premium (borda/sombra)
- Nunca misturar com orgânico

---

### 5. **CompaniesToolbarSticky** (Novo/Refactor)
**Responsabilidade:** Toolbar fixa com ordenação + chips ativos

**Props:**
```typescript
interface CompaniesToolbarStickyProps {
  totalCount: number;
  visibleCount: number;
  sortBy: 'ranking' | 'rating' | 'recent' | 'reviews';
  onSortChange: (sort: string) => void;
  activeFilters: FilterState;
  onRemoveFilter: (key: string) => void;
  onOpenMobileFilters?: () => void;
}
```

**Componentes internos:**
- Dropdown de ordenação
- Contador "Exibindo X de Y"
- Chips ativos removíveis
- Botão "Filtros" (mobile only)

---

### 6. **CompanyCardV2** (Refactor)
**Responsabilidade:** Card compacto e otimizado para conversão

**Props:**
```typescript
interface CompanyCardV2Props {
  company: Company;
  variant: 'compact' | 'rich'; // rich para top ranking
  category: string;
  onLeadClick: (company: Company) => void;
}
```

**Variante "compact" (padrão):**
```
┌──────────────────────┐
│   [1:1 Logo/Image]   │  160px altura total
│  ┌──────────────────┐│
│  │ Nome      [⭐4.8]│ │  
│  │ Segmento  [12 av]│ │
│  │ [CTA único]      │ │
│  └──────────────────┘│
└──────────────────────┘
```

**Variante "rich" (top ranking):**
```
┌──────────────────────┐
│   [1:1 Logo/Image]   │  220px altura
│  ┌──────────────────┐│
│  │ Nome   [✓Verif]  │ │
│  │ Seg: Industrial  │ │  
│  │ ⭐ 4.8 (234 av)  │ │
│  │ [CTA único]      │ │
│  └──────────────────┘│
└──────────────────────┘
```

**Melhorias (vs atual):**
- ✅ Imagem 1:1 (quadrado) em vez de 16:9
- ✅ Sem botão "Explorar" redundante
- ✅ Logo preserva proporção
- ✅ Altura reduzida 33% (240px → 160px)
- ✅ Acessibilidade: aria-label obrigatório
- ✅ Contraste WCAG AA+

---

### 7. **LeadCTA** (Novo/Crítico)
**Responsabilidade:** Decisão inteligente de CTA (interno vs direto)

```typescript
interface LeadCTAProps {
  company: Company;
  category: string;
  placement: 'card' | 'modal'; // Para analytics
}

function LeadCTA({ company, category, placement }: LeadCTAProps) {
  // Regra A: Empresa FREE → Lead Interno
  if (!company.direct_lead_enabled) {
    return (
      <Button onClick={() => openLeadModal(company, category)}>
        Solicitar Orçamento
      </Button>
    );
  }
  
  // Regra B: Empresa PAGA → Lead Direto
  return (
    <Button 
      asChild 
      onClick={() => track('lead_click_direct', {
        company_id: company.id,
        category,
        placement,
        url: company.direct_lead_url
      })}
    >
      <a href={company.direct_lead_url} target="_blank">
        Falar com a Empresa
        <span className="text-xs text-slate-400 ml-1">
          Resposta mais rápida
        </span>
      </a>
    </Button>
  );
}
```

---

### 8. **LeadModalInternal** (Novo)
**Responsabilidade:** Modal de conversão interna de leads

**Fields:**
- Nome *
- WhatsApp *
- Cidade/UF *
- Tipo de Projeto (industrial/agro/comercial/usina)
- Faixa de Potência (chips)
- Mensagem (opcional)
- Botão: "Receber Propostas"

**Fluxo pós-envio:**
1. Validação
2. Submit via API
3. Tela de sucesso com upsell sutil
4. Tracking: `lead_submit_internal`

---

## 🗑️ Limpeza & Consolidação

### Remover (Code Cleanup):
- ❌ `CategoriesGrid.tsx` (obsoleto, nunca usado)
- ❌ `CategoryColumn.tsx` (padrão antigo)
- ❌ `_CategoryClientComponent_HEAD.tsx` (merge artifact)
- ❌ `CategoryClientComponent_restore.tsx` (backup)
- ❌ Qualquer arquivo duplicado em `/categories`

### Consolidar em:
- ✅ `app/categories/[slug]/page.tsx` (server)
- ✅ `app/categories/[slug]/CategoryPageClient.tsx` (client)
- ✅ `components/categories/*` (reutilizáveis)

---

## 📊 Modelo de Dados Esperado

### API Esperada: `GET /api/v1/categories/{slug}/companies`

```json
{
  "data": {
    "category": {
      "id": 1,
      "name": "Energia Solar Comercial",
      "slug": "energia-solar-comercial",
      "companies_count": 156,
      "reviews_count": 1234,
      "verified_pct": 78
    },
    "top_ranking": [
      {
        "id": 1,
        "name": "Empresa Top 1",
        "logo_url": "...",
        "rating": 4.8,
        "rating_count": 234,
        "verified": true,
        "sponsored": false,
        "direct_lead_enabled": false,
        "direct_lead_url": null
      }
    ],
    "sponsored": [
      {
        "id": 10,
        "name": "Empresa Premium",
        "logo_url": "...",
        "rating": 4.5,
        "rating_count": 120,
        "verified": true,
        "sponsored": true,
        "direct_lead_enabled": true,
        "direct_lead_url": "https://wa.me/55..."
      }
    ],
    "organic": [
      { /* ... */ }
    ],
    "meta": {
      "total_count": 156,
      "current_page": 1,
      "per_page": 12,
      "total_pages": 13
    }
  }
}
```

---

## 🚀 Plano de Implementação (2 Sprints)

### **Sprint 1 — Foundation (P0 Bloqueadores)**

| Task | Component | Effort | Dependencies | Owner |
|------|-----------|--------|--------------|-------|
| Limpar código morto | Code | 1h | Nenhuma | Dev |
| Criar CategoryHero | CategoryHero | 2h | None | Dev |
| Criar DecisionChips | DecisionChips | 2.5h | None | Dev |
| Refactor CompanyCardV2 (compact) | CompanyCardV2 | 2h | None | Dev |
| Criar LeadCTA (lógica) | LeadCTA | 1.5h | None | Dev |
| Criar CompaniesGrid | CompaniesGrid | 1.5h | CompanyCardV2 | Dev |
| Criar page.tsx novo | Category Page | 2h | Todos acima | Dev |
| Integrar API | API | 1.5h | Backend | Dev |
| **Sprint 1 Total** | — | **14h** | — | — |

### **Sprint 2 — Polish & Monetização (P1)**

| Task | Component | Effort | Dependencies | Owner |
|------|-----------|--------|--------------|-------|
| Criar TopRankingSection | TopRankingSection | 2h | CompanyCardV2 rich | Dev |
| Criar SponsoredSection | SponsoredSection | 1.5h | CompanyCardV2 | Dev |
| Criar CompaniesToolbarSticky | Toolbar | 2h | None | Dev |
| Criar LeadModalInternal | Modal | 3h | None | Dev |
| Implementar Skeletons | Skeleton | 2h | None | Dev |
| Analytics / Tracking | Tracking | 2h | Todos | Dev |
| Dark Mode (variants) | Design | 2h | Todos | Designer/Dev |
| Acessibilidade (aria-labels) | QA | 2h | Todos | Dev/QA |
| Responsividade (tablet md:) | Responsive | 1.5h | Todos | Dev |
| Testes E2E (Playwright) | Tests | 3h | Page completo | QA |
| **Sprint 2 Total** | — | **21.5h** | — | — |

**Total:** ~35.5h (4.5 dias dev)

---

## 📋 Definition of Done (DoD)

### Code Quality:
- [ ] TypeScript sem erros (tscheck)
- [ ] Linter sem warnings (eslint)
- [ ] Nenhum console.error/warn em produção
- [ ] Componentes documentados com JSDoc

### Functionality:
- [ ] Todos os 8 componentes implementados
- [ ] LeadCTA decide interno vs direto corretamente
- [ ] LeadModal valida e submita dados
- [ ] Filtros aplicam estado em tempo real
- [ ] Paginação funciona
- [ ] Sticky toolbar não quebra scroll

### Performance:
- [ ] Lighthouse >= 90 (ou +5 de melhora)
- [ ] Skeleton por seção (não full-page)
- [ ] Prefetch acima da dobra
- [ ] Imagens lazy-loaded
- [ ] Bundle size <= +5KB

### UX/Design:
- [ ] Cards altura 160px (compact) / 220px (rich)
- [ ] Imagens 1:1 proporção
- [ ] Grid responsivo: 1/2/3 colunas
- [ ] Toolbar sticky funcional
- [ ] Mobile drawer de filtros
- [ ] Feedback visual (hover, active states)

### Accessibility:
- [ ] aria-label em todos links/botões
- [ ] Contraste WCAG AA+ (verificar com axe)
- [ ] Foco visível em navegação teclado
- [ ] Sem badges flutuando
- [ ] Semântica HTML5 correta

### Analytics:
- [ ] category_page_view { slug, filters }
- [ ] quick_filter_click { filter_name }
- [ ] company_card_click { company_id, placement }
- [ ] lead_open_internal { company_id }
- [ ] lead_submit_internal { company_id, success }
- [ ] lead_click_direct { company_id, url }

### Testing:
- [ ] Unit tests para LeadCTA logic
- [ ] E2E: Hero → DecisionChips → Card Click → Lead Modal
- [ ] E2E: Desktop → Mobile → Tablet (responsividade)
- [ ] E2E: Filtros aplicam + toolbar atualiza
- [ ] E2E: Prefetch funciona (DevTools Network)

### Documentation:
- [ ] PR descrevendo mudanças + impactos
- [ ] Componentes com exemplos de uso
- [ ] README em `/categories/[slug]/README.md`
- [ ] Guia de como replicar em outras rotas (se houver)

---

## 🎯 Métricas de Sucesso (Post-Deploy)

### Baseline vs Alvo:

| Métrica | Antes | Alvo | Delta |
|---------|-------|------|-------|
| **Cards visíveis (viewport 1080p)** | 2-3 | 6-8 | +200% |
| **Card altura (compact)** | 240px | 160px | -33% |
| **Lighthouse score** | 85 | 92+ | +7 |
| **WCAG compliance** | AA | AAA | +1 nível |
| **CTR lead modal** | — | >3% | Baseline |
| **Lead submit rate** | — | >20% | Baseline |
| **Mobile conversion** | — | ≥ Desktop | Parity |
| **Bounce rate** | +5% | -2% | -7% delta |
| **Time on page** | 45s | 60s+ | +33% engagement |

---

## 🔗 Dependências Externas

### Backend (Validar com team):
- [ ] API retorna `verified`, `sponsored`, `direct_lead_enabled`, `direct_lead_url`
- [ ] API suporta separação: `top_ranking`, `sponsored`, `organic`
- [ ] Endpoint `/api/v1/categories/{slug}/companies` validado
- [ ] Lead modal endpoint: `POST /api/v1/leads` funcional

### Design System (shadcn/ui):
- [ ] Badge, Button, Card, Input, Select, Sheet — OK
- [ ] Skeleton component — OK
- [ ] Modal/Dialog component — OK
- [ ] Considerar custom Tooltip para "Como funciona"

---

## 🚨 Riscos & Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|--------|-----------|
| API não retorna campos novos | Média | Alto | Criar fallback; atualizações backend paralelas |
| Responsive tablet quebra | Média | Médio | Testar md: 768px breakpoint cedo |
| Lead modal form validation falha | Baixa | Médio | Testes unitários + Playwright E2E |
| Performance piora (+ componentes) | Média | Médio | Medir Lighthouse antes/depois; lazy load |
| Dark mode quebra contraste | Baixa | Baixo | axe-core scan em ambos temas |

---

## 📚 Referências

1. **Análise Crítica:** `ANALISE_CRITICA_CATEGORIES.md`
2. **PO Master Prompt:** Category Page v2 Dominante
3. **Padrões UI:** Shopify Collections, Airbnb Categories
4. **Design System:** shadcn/ui + Tailwind
5. **Analytics:** Track.js (existente)
6. **Acessibilidade:** WCAG 2.1 AA+ guidelines

---

## 📝 Próximos Passos

1. **Validação de Requisitos** (PO + Designer)
   - [ ] Confirmar todos os componentes obrigatórios
   - [ ] Validar mockups/wireframes
   - [ ] Confirmar modelo de dados com backend

2. **Preparação Sprint 1** (Dev)
   - [ ] Setup de branch
   - [ ] Estrutura de pastas
   - [ ] Criação de componentes base

3. **Implementação** (Dev)
   - Sprint 1: Foundation + integration
   - Sprint 2: Polishing + monetização

4. **QA & Deploy** (QA + DevOps)
   - Testes E2E
   - Performance audit
   - Analytics validation
   - Deploy staging → produção

---

**Documento criado por:** Technical Product Owner  
**Status:** 🟡 READY FOR BACKLOG  
**Revisão:** PO + Designer + Tech Lead antes de Sprint Planning

---
