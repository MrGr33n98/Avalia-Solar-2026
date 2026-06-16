---
status: draft
phase: 01-funda-o-e-integra-o-da-home-p0
design_system: manual (Themed Components + Vanilla CSS)
---

# UI Specification - Fase 01: Fundação e Integração da Home (P0)

Este documento define o contrato visual e de interação para a Fase 01, focada na transição da Home mockada para uma integração real via GraphQL.

## 1. Design Tokens (Fundação)

Baseado em `src/constants/theme.ts` e `mobile-task.md` Seção 8.

### 1.1. Spacing
Escala de 8 pontos (multiples of 8, with 4 for micro-spacing).
- **Scale:** 4, 8, 16, 24, 32, 48, 64 (px)
- **Component Gutters:** 16px (padrão para margens laterais)
- **Section Gap:** 24px entre blocos da Home.

### 1.2. Typography
Ajuste das definições de `themed-text.tsx` para alinhar com o PRD.
- **Font Family:** System Default (Sans-serif)
- **Sizes:**
  - `Title`: 24px (Bold/700) - Títulos de seções e Header.
  - `Body`: 16px (Regular/500) - Texto padrão e Cards.
  - `Small`: 14px (Regular/500) - Texto auxiliar e metadados.
  - `Micro`: 12px (Regular/400) - Badges e rótulos pequenos.
- **Line Heights:** 1.2 para títulos, 1.5 para corpo de texto.

### 1.3. Color Contract (60/30/10)
- **60% Dominant (Surface):** `#F8FAFC` (Fundo claro) / `#020617` (Dark Mode).
- **30% Secondary (Cards/Nav):** `#FFFFFF` (White cards) / `#0F172A` (Dark cards).
- **10% Accent (Action/Status):** `#208AEF` (Azul principal).
- **Semantic:**
  - `Success`: `#16A34A`
  - `Error/Destructive`: `#DC2626`
  - `Warning`: `#F59E0B`
  - `Star/Rating`: `#FACC15`

## 2. Component Inventory

### 2.1. Home Layout Structure
Ordem vertical dos blocos:
1. **Header:** Logo (esquerda) + Ícone de Busca (direita).
2. **Search Anchor:** Barra de busca estática que abre a busca real.
3. **Banner Carousel:** Carrossel horizontal de banners dinâmicos.
4. **Category Grid:** Scroll horizontal de chips com ícone e nome.
5. **Featured Companies:** Lista vertical/grid de cards de empresas.
6. **Latest Articles:** Scroll horizontal de cards de blog.

### 2.2. Banner Carousel
- **Aspect Ratio:** 16:9.
- **Corner Radius:** 12px.
- **Pagination:** Pontos discretos centralizados abaixo do banner.
- **Image Treatment:** Overlay gradiente sutil (0.2 opacity black) se houver texto sobre a imagem.

### 2.3. Skeleton Loaders
Devem usar efeito "Shimmer" (animação de opacidade ou gradiente de 0.5 a 1.0).
- **Banner Skeleton:** Retângulo 16:9 com bordas arredondadas.
- **Company Card Skeleton:** Bloco de imagem (logo) + 2 linhas de texto (nome, rating).
- **Category Chip Skeleton:** Pílula (capsule) de 80x32px.

### 2.4. Interactive Feedback
- **Touch Targets:** Mínimo de 44x44px para todos os elementos clicáveis.
- **Active State:** Redução de opacidade (0.7) ao tocar.
- **Pull-to-Refresh:** Indicador de carregamento padrão do sistema (Spinner Azul `#208AEF`).

## 3. Copywriting & Content

### 3.1. Primary CTAs
- **Home:** "Ver perfil" (no card de empresa).
- **Banner:** Dinâmico vindo da API (fallback: "Saiba mais").

### 3.2. Empty & Error States
- **Empty Categories:** "Nenhuma categoria disponível no momento."
- **Empty Companies:** "Nenhuma empresa em destaque encontrada."
- **API Error:** "Ops! Não conseguimos carregar os dados."
- **Error Action:** Botão "Tentar novamente".

## 4. Design System Registry (shadcn-like)

O projeto usa componentes customizados baseados em `ThemedView` e `ThemedText`.
Para esta fase, os seguintes componentes devem ser criados/migrados para `src/components/home/`:

| Component | Purpose | Status |
|-----------|---------|--------|
| `BannerCarousel` | Exibe banners dinâmicos via GQL | New |
| `CategoryScroll` | Lista horizontal de categorias | New |
| `FeaturedCompanies` | Lista de empresas em destaque | Refactor |
| `HomeSkeleton` | Skeleton unificado da página | New |

## 5. Visual Quality Pillars (GSD)

1. **Hierarchy:** Título da seção (20px Semibold) deve ser claramente distinto do texto do card (14px).
2. **Consistency:** Todos os cards devem ter `borderRadius: 12` e `elevation: 2` (Android) / `shadow` (iOS).
3. **Affordance:** Cards de empresa devem ter um indicador visual de clicabilidade (ex: sombra que aumenta ou feedback de toque claro).
4. **Spacing:** Manter `marginHorizontal: 16` constante em todos os blocos para alinhamento com a borda da tela.
5. **Legibility:** Texto secundário em `#64748B` nunca deve ser menor que 12px.
6. **States:** Transição suave de 300ms entre Skeleton e Conteúdo Real.

---
*UI-SPEC criado a partir de RESEARCH.md e mobile-task.md.*
