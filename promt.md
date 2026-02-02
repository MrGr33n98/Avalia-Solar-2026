# TASK: Refatorar Sidebar de Filtros – /companies (UI/UX Premium + DB-first + Querystring + Performance)

Você é um **Senior Frontend Engineer + UI/UX Designer**. Refatore completamente a **sidebar de filtros** da rota **/companies** do Avalia Solar, entregando uma UI estilo SaaS premium (Stripe/Airbnb/G2), compacta, consistente e com alta densidade de informação. O componente deve ser **100% dinâmico e escalável**, com opções vindas do **backend/DB** (sem hardcode) e com **estado refletindo sempre a URL (querystring)**.

## Stack obrigatória
- Next.js (App Router) + TypeScript
- TailwindCSS
- shadcn/ui
- lucide-react (ícones)
- **Sem libs extras** (sem zustand, sem react-query, etc.)

## Regras inegociáveis
1) **NÃO hardcode**: categorias, estados, cidades, contagens, opções de ordenação (se possível). Tudo que puder vir do backend deve vir do backend.
2) Sidebar **URL-driven**: parse da querystring → estado inicial; update do filtro → router.replace (sem scroll) atualizando params.
3) **SSR-safe** e performático: sem `window` no server, memo, componentes pequenos, evitar re-render inútil; debounce em buscas.
4) UX compacta (menos altura, mais info): alinhamentos precisos, chips de filtros ativos, “Limpar” global.
5) Filtros combináveis (AND) e devem atualizar a listagem de empresas.

---------------------------------------------------

## Contexto do DB (schema relevante)
### companies (base do /companies)
Filtros suportados por campos reais:
- `verified:boolean`, `featured:boolean`
- `state:string`, `city:string`
- `rating_avg:decimal(3,2)`, `rating_count:int`, `reviews_count:int`
- `financing_enabled:boolean`, `whatsapp_enabled:boolean`
- `services_offered:json[]`, `project_types:json`
- `status:string` (default active), `moderation_status:string`
- `plan_id:int` (pode virar “Premium” se existir)
- relação com categorias via `categories_companies (company_id, category_id)`
### categories
- `id`, `name`, `parent_id`, `seo_url(unique)`, `companies_count:int`
### reviews
- `company_id`, `rating`, `status`, `verified` (usar no backend para calcular caches, se necessário)

---------------------------------------------------

## Problemas atuais
- Muito espaço vertical, visual “quadrado”, densidade baixa
- Blocos desconectados (localização / ordenação / filtros)
- Ícones inconsistentes e sem padrão visual
- Falta estado ativo claro + falta resumo (chips) + “Limpar” global
- Dropdowns onde deveriam ser toggles (ex: verificação)

---------------------------------------------------

# Novo design obrigatório (SaaS premium)

## Sidebar container
- width **300px**
- sticky top **88px**
- bg-white, border-slate-200, rounded-xl, p-3, spacing compacto
- Mobile: virar **Sheet/Drawer** (shadcn Sheet), com botão “Filtrar”

## Header
- ícone `SlidersHorizontal` + título “Filtros”
- botão “Limpar” (reset total)
- mobile opcional: botão “Aplicar” (desktop instant)

## Resumo (premium)
- contador de filtros ativos (ex: 3)
- **chips removíveis** (remover filtro individual)
- exemplo: “SP”, “Verificadas”, “4+”, “Categoria: Carregadores”

---------------------------------------------------

# Seções / Componentes (obrigatório)

## 1) Localização (DB-first)
Accordion “Localização” + ícone `MapPin`.
- **Estados**: multi-select com checkbox + busca interna + badge com contagem por UF.
  Fonte: backend (distinct `companies.state` + count).
- **Cidades**: multi-select (ou Command/Combobox) dependente de estados.
  Só carregar quando existir ao menos 1 estado selecionado.
  Fonte: backend (distinct `companies.city` filtrado por states).
- Debounce busca: **300ms**.

## 2) Categorias (DB-first)
Accordion “Categorias” + ícone `Tag`.
- Exibir árvore (root → children) vinda do backend.
- Root colapsável; children com checkbox multi.
- Badge: total selecionadas.
- Aplicar filtro via join `categories_companies`.

## 3) Avaliações
Accordion “Avaliações” + ícone `Star`.
- Min rating: **5+ / 4+ / 3+**
- UI: ToggleGroup (single) ou segmentado.
- Critério: `companies.rating_avg >= min_rating`
- Opcional se suportado: “somente com avaliações” (`rating_count > 0`)

## 4) Empresas verificadas (NÃO dropdown)
Linha simples com `Switch` + ícone `ShieldCheck` + label “Apenas verificadas”.
Fonte: `companies.verified`.

## 5) Sinais de qualidade (opcional, mas recomendado se a API filtrar de verdade)
Com switches compactos:
- Featured: `Sparkles` → `companies.featured`
- Financiamento: `BadgePercent` → `companies.financing_enabled`
- WhatsApp: `MessageCircle` → `companies.whatsapp_enabled`
(Se backend não suportar, **não criar filtro fake**.)

## 6) Ordenação
Accordion “Ordenar” + ícone `ArrowUpDown`.
- Recomendadas (default)
- Melhor avaliadas (rating_avg desc, rating_count desc)
- Mais avaliadas (rating_count desc)
- Mais recentes (created_at desc)
- A-Z / Z-A (name)
- Próximas (somente se existir geo real no backend)
Ideal: backend retorna `allowed_sorts` (sem hardcode).

---------------------------------------------------

# Padrão de ícones (obrigatório)
- lucide-react: size **20**, strokeWidth **1.75**
- container: `bg-slate-100 rounded-xl p-2`
Mapeamento: SlidersHorizontal, MapPin, Tag, Star, ShieldCheck, ArrowUpDown, Sparkles, BadgePercent, MessageCircle.

# Tokens Tailwind (obrigatório)
Item:
- `flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 transition`
Ativo:
- `bg-blue-50 text-blue-700 border border-blue-100`
Badge:
- `text-xs rounded-full bg-blue-50 text-blue-700 px-2 py-0.5`
Inputs:
- `h-9 rounded-lg bg-slate-50 border-slate-200`

---------------------------------------------------

# Funcionalidade (URL-driven + controlado)

## Estado global
```ts
type CompanyFilters = {
  state: string[];
  city: string[];
  category_ids: number[];
  min_rating: number | null; // 3|4|5
  verified: boolean;
  featured: boolean;
  financing_enabled: boolean;
  whatsapp_enabled: boolean;
  sort: string;
  page: number;
}
