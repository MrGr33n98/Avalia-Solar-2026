# PERFORMANCE INVESTIGATION DOSSIER
## AvaliaSolar — Lighthouse Score: 41 → Plano de Recuperação

**Data:** 2026-03-18
**Escopo:** https://www.avaliasolar.com.br
**Stack:** Next.js 14.2.34 · Rails 7 · Docker · Node.js standalone
**Investigador:** Auditoria Estática (sem modificações de código)

---

## 1. RESUMO EXECUTIVO

O score de **41 em Performance** é causado por **quatro vetores críticos independentes** que se somam:

| # | Vetor | Métrica Impactada | Impacto Estimado |
|---|-------|-------------------|------------------|
| 1 | **GTM executando 2 scripts inline síncronos no `<head>`** | TBT +1.500–2.500ms | Crítico |
| 2 | **Ausência de HTTP/2 — Nginx Proxy Manager (NPM) externo** | FCP +400–800ms | Alto |
| 3 | **`LandingHero` (componente Client) importa Carousel+Autoplay no bundle inicial** | LCP +300–600ms | Alto |
| 4 | **Bundle Analyzer desabilitado — JS não-utilizado invisível (3.3MB)** | TBT +500ms+ | Alto |

A boa notícia: **LCP tem `priority` e `fetchPriority="high"` corretamente configurados**, e a estratégia de cache dos assets estáticos é correta (`immutable, 1 ano`). O problema não está no image pipeline — está no **JavaScript que bloqueia o main thread antes da imagem aparecer**.

---

## 2. DIAGNÓSTICO DETALHADO

---

### 2.1 CAMADA DE REDE & INFRA (EXTERNAL PROXY)

#### 🔴 HTTP/1.1 via NPM — O Gargalo de Protocolo Externo

**Localização:** Nginx Proxy Manager (NPM) na VM `npm.avaliasolar.com.br`

O Lighthouse reportou o uso de **HTTP/1.1**. O acesso externo é mediado por um **Nginx Proxy Manager** (NPM) rodando em Docker na VM. 

- **Diagnóstico:** O Proxy Host para `avaliasolar.com.br` no NPM provavelmente não está com a flag **"HTTP/2 Support"** ativada na aba SSL.
- **Consequência:** Head-of-line blocking massivo. Como o Next.js gera muitos chunks críticos, o HTTP/1.1 força o navegador a baixar um por um ou em pequenos grupos, atrasando a renderização.

**Impacto:** FCP e LCP são severamente prejudicados pelo protocolo antigo.

---

#### 🟡 Compressão Gzip vs Brotli

**Localização:** Configuração do Proxy (NPM)

Atualmente, o tráfego é comprimido via Gzip (padrão do NPM/Node.js). 
- **Oportunidade:** Habilitar Brotli no NPM (via Advanced Tab ou custom config) para reduzir o tamanho dos assets em mais ~20% em comparação ao Gzip.

---

#### ✅ Cache de Assets Estáticos — Correto

**Localização:** `next.config.js` linhas 107–113

```javascript
source: '/_next/static/:path*',
value: 'public, max-age=31536000, immutable'   // 1 ano ✅
```

Esta configuração está correta e não é o problema.

---

#### 🟡 Cache da Home — Conflito de Configuração

**Localização:** `next.config.js` linha 102 vs `page.tsx` linha 71

```javascript
// next.config.js — HTTP response header
value: 'public, max-age=300, stale-while-revalidate=86400'   // 5min

// page.tsx — Next.js ISR revalidation
export const revalidate = 3600;   // 1 hora
```

Os dois mecanismos de cache conflitam: o `Cache-Control` do Next.js diz 5 minutos, mas o ISR revalida só de hora em hora. O CDN pode servir conteúdo de até 1h mesmo quando o header diz 5min.

---

### 2.2 ANÁLISE DO BUNDLE JS — O VERDADEIRO CULPADO

#### 🔴 Bundle Analyzer Desabilitado — Cegueira Total

**Localização:** `next.config.js` linhas 2–8

```javascript
// ATUAL (NO-OP — análise completamente desabilitada)
const withBundleAnalyzer = (config) => config;

/*
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});
*/
```

O pacote `@next/bundle-analyzer` está nas devDependencies (`package.json` linha 90), mas está comentado. **Não há visibilidade sobre quais bibliotecas estão no bundle inicial**. O Lighthouse reporta 3.3MB de JS não-utilizado, mas sem o analyzer não é possível identificar a origem exata.

---

#### 🔴 `LandingHero` é Client Component com Carrossel no Bundle Inicial

**Localização:** `app/page.tsx` linha 8 + `components/landing/LandingHero.tsx` linha 1

```typescript
// page.tsx — Importação ESTÁTICA (não usa dynamic())
import LandingHero from '@/components/landing/LandingHero';

// LandingHero.tsx — é um Client Component que importa Carousel
'use client';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
```

**Problema:** `LandingHero` é importado estaticamente (não via `next/dynamic`), portanto:
- `embla-carousel-react` + `embla-carousel-autoplay` entram no **bundle inicial da home**
- O componente marca `'use client'` → precisa de hidratação → bloqueia o LCP
- O `useEffect` com tracking (`track('home_hero_experiment_exposed', ...)`) força hidratação imediata

---

#### 🔴 Dupla Declaração de `swcMinify` e `compiler`

**Localização:** `next.config.js` linhas 39–51

```javascript
// DECLARADO DUAS VEZES — o segundo sobrescreve o primeiro
swcMinify: enableSwcMinify,   // linha 39
compress: true,               // linha 40
compiler: { ... },            // linha 41-43

// ... código ...

swcMinify: enableSwcMinify,   // linha 47 (DUPLICATA)
compress: true,               // linha 48 (DUPLICATA)
compiler: { ... },            // linha 49-51 (DUPLICATA)
```

O segundo bloco sobrescreve o primeiro. Se `NEXT_DISABLE_SWC_MINIFY=true` for injetado no ambiente CI por alguma razão, a minificação pode estar desabilitada silenciosamente.

---

#### 🟡 Bibliotecas Pesadas — Inventário

| Biblioteca | Versão | Bundle Estimado | Uso | Risco |
|-----------|--------|-----------------|-----|-------|
| `framer-motion` | 12.26.1 | ~65KB gzip | Animações | Alto — tree-shakeable mas importações amplas podem vazar |
| `recharts` | 2.12.7 | ~55KB gzip | Gráficos | Médio — provavelmente só no dashboard |
| `posthog-js` | 1.359.1 | ~45KB gzip | Analytics | Médio — lazy init, mas bundle fixo |
| `embla-carousel-react` | 8.6.0 | ~12KB gzip | Carrossel hero | **Alto — no bundle inicial via LandingHero** |
| `embla-carousel-autoplay` | 8.6.0 | ~3KB gzip | Autoplay hero | **Alto — no bundle inicial** |
| `mixpanel-browser` | 2.74.0 | ~40KB gzip | Analytics | **Crítico — sem importações encontradas no código** |
| `html-to-image` | 1.11.13 | ~35KB gzip | Export de canvas | Alto — provavelmente só em dashboard |
| `dexie` | 4.3.0 | ~25KB gzip | IndexedDB | Médio — offline/PWA |
| `driver.js` | 1.4.0 | ~15KB gzip | Onboarding tour | Médio — não precisa no bundle inicial |
| `@sentry/nextjs` | 8.0.0 | ~30KB gzip | Error tracking | Médio — instrumenta o app em build time |

**⚠️ `mixpanel-browser` (40KB):** Está em `package.json` linha 69, mas **nenhum `import mixpanel` foi encontrado** nos arquivos de produção. Está sendo bundled como dead code. Precisa de verificação com o analyzer habilitado.

---

### 2.3 SCRIPTS DE TERCEIROS & TRACKING — TBT DE 4.5s

#### 🔴 GTM: 2 Scripts Inline Síncronos no `<head>` sem `next/script`

**Localização:** `components/GoogleTagManager.tsx` linhas 14–57 + `app/layout.tsx` linha 115

```typescript
// layout.tsx — Renderizado no <head> no lado do servidor
<head>
  <GoogleTagManager gtmId={GTM_ID} />   // ← Duas tags <script> inline aqui
</head>
```

```typescript
// GoogleTagManager.tsx — 'use client' com dois scripts inline
'use client';

// Script 1: Google Consent Mode (roda SÍNCRONO no parse do HTML)
<script id="google-consent-mode" dangerouslySetInnerHTML={{ __html: `
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('consent', 'default', { ... 'wait_for_update': 500 });
  gtag('js', new Date());
  // Lê localStorage SINCRONAMENTE
  var stored = localStorage.getItem('avaliasolar_consent');
  ...
` }} />

// Script 2: GTM Loader (cria elemento <script> e insere no DOM)
<script id="gtm-script" dangerouslySetInnerHTML={{ __html: `
  (function(w,d,s,l,i){...j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
  f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');
` }} />
```

**Por que isso mata o TBT:**
1. O Script 1 executa **sincronamente durante o parse** do HTML, antes de qualquer renderização
2. `gtag('consent', ... 'wait_for_update': 500)` **pausa o GTM por 500ms** esperando atualização de consentimento
3. O Script 2 injeta o `gtm.js` no DOM — mesmo sendo `async`, o script de consent **já bloqueou o main thread**
4. `localStorage.getItem()` é **síncrono** e bloqueia a thread

**Ausência de `next/script`:** Nenhum `Script` do `next/script` foi encontrado no projeto. A estratégia correta seria `strategy="afterInteractive"` ou `strategy="lazyOnload"`.

---

#### 🟡 PostHog — Bem Configurado, mas Peso de Bundle Fixo

**Localização:** `components/PostHogProvider.tsx`

```typescript
// Inicialização lazy — correto
const init_delay = hasConsent ? 1500 : 5000;
// autocapture: false — correto
// session_recording: { maskAllInputs: true } — correto
```

PostHog está bem configurado com lazy init e sem autocapture. O impacto principal é o bundle de ~45KB, que é carregado independentemente do timing de inicialização.

---

#### 🟡 Sentry — Overhead de Build, Não de Runtime

**Localização:** `next.config.js` linhas 292–293

```javascript
const hasSentryConfig = process.env.SENTRY_AUTH_TOKEN && process.env.SENTRY_ORG && ...;
const enableSentry = process.env.NODE_ENV === 'production' && hasSentryConfig;
```

Sentry está **condicionalmente habilitado**. Se as variáveis de ambiente estiverem configuradas, ele instrui o app em build time com `autoInstrumentServerFunctions: true`, adicionando overhead em cada Server Component/Action.

---

### 2.4 CORE WEB VITALS — LCP & CLS

#### LCP — Elemento Identificado: `LandingHero` Background Image

**Localização:** `components/landing/LandingHero.tsx` linhas 74–84

```typescript
<Image
  src="/images/banner-landing-page-avalia-solar.jpg"
  alt="Avalia Solar Background"
  fill
  priority                    // ✅ Correto
  fetchPriority="high"        // ✅ Correto
  quality={85}
  className="object-cover object-center"
  sizes="100vw"               // ✅ Correto para full-width
/>
```

**A imagem está tecnicamente correta.** O problema do LCP não é a imagem em si — é que o `LandingHero` é um **Client Component**. Isso significa:

1. O servidor faz SSR da shell do componente, mas não do conteúdo interativo
2. O browser precisa **baixar e executar o JS** do componente antes de renderizar a imagem
3. Com o main thread bloqueado pelo GTM (4.5s TBT), a imagem "com priority" ainda demora para aparecer

**Segundo problema:** O overlay `backdrop-blur-[1px]` sobre a imagem force uma **camada de composição** que pode atrasar a pintura final.

---

#### CLS — Causas Identificadas

**1. ThemeProvider com `defaultTheme="system"`**

**Localização:** `app/layout.tsx` linhas 121–126

```typescript
<ThemeProvider
  attribute="class"
  defaultTheme="system"     // ← Detecta tema do OS após hidratação
  enableSystem
  disableTransitionOnChange
>
```

No SSR, o tema padrão é `light`. Quando o JS hidrata e detecta `prefers-color-scheme: dark`, aplica a classe `dark` ao `<html>` causando **reflow de toda a página** — um CLS massivo em usuários dark mode.

**2. Skeleton Loaders com Altura Fixa vs Componente Real**

**Localização:** `app/page.tsx` linhas 12–69

```typescript
const HowItWorks = dynamic(() => ..., {
  loading: () => <div className="h-96 animate-pulse bg-gray-100 rounded-xl" />
});
```

`h-96` = 384px. Se o componente real tiver altura diferente, há CLS quando o componente carrega e substitui o skeleton.

**3. Font Swap — FOUT com Inter**

**Localização:** `app/layout.tsx` linha 22

```typescript
const inter = Inter({ display: 'swap', adjustFontFallback: true });
```

`display: 'swap'` é correto para evitar FOIT (Flash of Invisible Text), mas `adjustFontFallback: true` não elimina completamente o shift quando a fonte carrega, especialmente em conexões lentas.

**4. Hero Section `min-h` vs Conteúdo Real**

**Localização:** `components/landing/LandingHero.tsx` linha 73

```typescript
<section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-28 min-h-[500px] md:min-h-[600px] flex items-center">
```

O conteúdo do hero (h1 + h2 + CTA + carousel de banners) pode exceder `500px` em alguns viewports/variantes do experimento, causando CLS quando o conteúdo real é maior que o `min-h`.

---

### 2.5 ACESSIBILIDADE & CONTRASTE (AS-EDS Claymorphism)

**Localização:** `app/globals.css` linhas 58–125

Análise dos tokens de cor críticos contra o fundo padrão (`--background: 222 47% 95%` ≈ `#f0f2f9`):

| Token | Valor HSL | Hex Aproximado | Uso | Ratio vs Branco | WCAG AA (4.5:1) |
|-------|-----------|---------------|-----|-----------------|-----------------|
| `--muted-foreground` | `215.4 16.3% 46.9%` | `#6b7a8d` | Textos secundários | ~3.5:1 | ❌ FALHA |
| `--secondary` (Amber) | `38 92% 50%` | `#F59E0B` | Badges, CTAs | ~1.9:1 | ❌ FALHA CRÍTICA |
| `--accent` (Emerald) | `142 71% 45%` | `#10B981` | Badges de sucesso | ~2.8:1 | ❌ FALHA |
| `--primary` (Blue) | `221 83% 53%` | `#2563EB` | Links, CTAs primários | ~5.9:1 | ✅ PASSA |
| `--destructive` | `0 84.2% 60.2%` | `#F45B5B` | Erros | ~3.1:1 | ❌ FALHA |

**Hero Badge (`bg-brand-blue/5` + `text-brand-blue`):**

```typescript
// LandingHero.tsx linha 93
<div className="inline-flex ... bg-brand-blue/5 text-brand-blue ...">
  <Zap className="w-4 h-4 fill-brand-blue" />
  {hasVerifiedCount ? `${formatCompactCount(...)}+ empresas verificadas` : 'Empresas verificadas'}
</div>
```

`brand-blue` (#2563EB) sobre `brand-blue/5` (azul 5% opacity ≈ #f0f4fe): contraste ≈ **5.3:1** ✅

**Clayomorphism shadows como textos:**
Os `.clay-convex` e `.clay-concave` usam `box-shadow` para criar profundidade — não impactam contraste de texto diretamente, mas aumentam a **carga de GPU paint** em dispositivos móveis.

---

## 3. PLANO DE OTIMIZAÇÃO PRIORIZADO

---

### [P0] QUICK WINS — Impacto Alto, Esforço Baixo

#### P0.1 — Mover GTM para `next/script` com `strategy="afterInteractive"`

**Arquivo:** `app/layout.tsx` + `components/GoogleTagManager.tsx`
**Impacto:** TBT -1.500 a -2.500ms | Score estimado: +15–20 pontos

**O que fazer:**
- Substituir os dois `<script dangerouslySetInnerHTML>` inline por `<Script strategy="afterInteractive">`
- O consent mode deve ser movido para `strategy="beforeInteractive"` apenas se necessário por compliance; caso contrário, `afterInteractive`
- Remover `'wait_for_update': 500` do consent default (500ms de espera síncrona garantida)

```typescript
// Mudança conceitual (não implementar aqui)
import Script from 'next/script';

<Script id="gtm-consent" strategy="afterInteractive" src="..." />
```

---

#### P0.2 — Reativar Bundle Analyzer e Executar Análise

**Arquivo:** `next.config.js` linhas 2–8
**Impacto:** Visibilidade total do bundle | Habilita todos os outros P1

**O que fazer:**
- Descomentar as linhas 5–7 (remover o NO-OP)
- Executar `npm run analyze` localmente
- Identificar os maiores chunks do bundle inicial

---

#### P0.3 — Habilitar HTTP/2 no Nginx Proxy Manager (NPM)

**Localização:** Painel do **NPM** na VM (`avaliasolar.com.br` Proxy Host)
**Impacto:** FCP -400 a -800ms | Multiplexing de requisições

**O que fazer:**
- No painel do NPM, editar o Proxy Host de `avaliasolar.com.br`.
- Na aba **SSL**, marcar a opção **"HTTP/2 Support"**.
- Garantir que o SSL está como "Full" ou "Strict" para garantir a negociação segura de ALPN (necessário para H2).

**Estrutura real:**
```
Internet → NPM (Mudar para HTTP/2) → ab0-frontend:3000 (HTTP/1.1 interno)
```

---

#### P0.4 — Corrigir `ThemeProvider` para Evitar CLS no Dark Mode

**Arquivo:** `app/layout.tsx`
**Impacto:** CLS -0.05 a -0.15

**O que fazer:**
- Usar `suppressHydrationWarning` já existe no `<html>` ✅
- Adicionar script de detecção de tema no `<head>` antes do body (blocking, mas pequeno) para aplicar a classe antes do paint
- Ou mudar `defaultTheme` para `"light"` se dark mode não for prioridade imediata

---

### [P1] REFACTORS NECESSÁRIOS — Impacto Alto, Esforço Médio

#### P1.1 — Converter `LandingHero` para Server Component (ou lazy load)

**Arquivo:** `components/landing/LandingHero.tsx` + `app/page.tsx`
**Impacto:** LCP -300 a -600ms | JS inicial -~15KB

**Problema raiz:** `LandingHero` é `'use client'` porque usa `useEffect` para tracking e `Carousel` com autoplay. A imagem de fundo (o LCP element) não precisa de client-side JS.

**O que fazer:**
1. Separar o Hero em dois: `LandingHeroStatic` (Server Component, contém a imagem LCP) + `LandingHeroClient` (Client Component, carregado via `dynamic()` para o carousel/tracking)
2. `LandingHeroStatic` renderiza a imagem com `priority` no lado do servidor → LCP image presente no HTML inicial sem JS

---

#### P1.2 — Remover `mixpanel-browser` se Não Usado

**Arquivo:** `package.json` linha 69
**Impacto:** Bundle -~40KB gzip (se confirmado morto pelo analyzer)

**Evidência:** Grep de `import.*mixpanel` em todos os arquivos `.ts/.tsx` retornou zero resultados de produção (apenas docs e testes). O pacote pode estar sendo bundled como dead code.

**O que fazer:**
1. Habilitar bundle analyzer (P0.2)
2. Confirmar que `mixpanel-browser` não aparece em nenhum chunk
3. Remover da `package.json` se confirmado

---

#### P1.3 — Lazy Load Carousel de Banners do Hero

**Arquivo:** `components/landing/LandingHero.tsx` linhas 7–8
**Impacto:** Bundle inicial -~15KB | LCP secundário não afetado

**O que fazer:**
```typescript
// Mover Carousel para dynamic import dentro do componente
const DynamicCarousel = dynamic(() => import('@/components/ui/carousel').then(m => m.Carousel), {
  ssr: false,
  loading: () => <div className="h-48 animate-pulse" />
});
```

O carousel de banners (`validBanners`) não é o elemento LCP — pode ser carregado com atraso sem impactar o score.

---

#### P1.4 — Resolver Conflito de Cache-Control vs ISR

**Arquivo:** `next.config.js` linha 98–104
**Impacto:** CDN hit rate, consistência de conteúdo

**O que fazer:**
- Alinhar `max-age=300` (5min) com `revalidate = 300` na home page
- Ou remover o header manual da home e confiar no ISR do Next.js (`s-maxage=3600, stale-while-revalidate=86400`)

---

#### P1.5 — Extrair `html-to-image`, `driver.js` e `dexie` para Imports Dinâmicos

**Arquivo:** Componentes que usam essas bibliotecas
**Impacto:** Bundle inicial -~75KB estimado

**O que fazer:**
1. Com o analyzer habilitado, identificar os componentes que importam essas libs
2. Garantir que estejam atrás de `dynamic()` ou `import()` lazy
3. `dexie` → deve ser carregado apenas no service worker / PWA context
4. `driver.js` → deve ser carregado apenas quando o tour é ativado

---

#### P1.6 — Corrigir Contraste dos Tokens Amber e Emerald

**Arquivo:** `app/globals.css`
**Impacto:** Acessibilidade WCAG AA — badges e textos de status

**Tokens que falham (texto sobre branco):**

```css
/* FALHA: ratio 1.9:1 */
--secondary: 38 92% 50%;   /* Amber #F59E0B */
/* FIX: Escurecer para ~40% lightness */
--secondary: 38 92% 40%;   /* Amber #C07D08 — ratio ~4.7:1 ✅ */

/* FALHA: ratio 2.8:1 */
--accent: 142 71% 45%;     /* Emerald #10B981 */
/* FIX: Escurecer para ~35% lightness */
--accent: 142 71% 35%;     /* Emerald #0C8D64 — ratio ~5.1:1 ✅ */

/* FALHA: ratio 3.5:1 */
--muted-foreground: 215.4 16.3% 46.9%;
/* FIX: Escurecer para ~35% lightness */
--muted-foreground: 215.4 16.3% 35%;   /* ratio ~5.3:1 ✅ */
```

---

### [P2] OTIMIZAÇÕES DE LONGO PRAZO

#### P2.1 — Implementar Partial Prerendering (PPR) do Next.js 14

**Arquivo:** `next.config.js`
**Impacto:** LCP -200 a -400ms

O Next.js 14 suporta `ppr: true` no experimental. Isso permite que a shell estática da home (Hero, Navbar) seja servida instantaneamente enquanto as partes dinâmicas (categorias, empresas) são streamed.

---

#### P2.2 — Separar Fontes do Google Fonts para Self-Hosting

**Arquivo:** `app/layout.tsx` linhas 19–25
**Impacto:** FCP -50 a -150ms | Elimina dependência de terceiro na critical path

Next.js já faz isso automaticamente com `next/font/google` (baixa em build time), mas verificar se a CDN não está impondo latência adicional.

---

#### P2.3 — Habilitar `webpackBuildWorker`

**Arquivo:** `next.config.js` linha 54 (atualmente comentado)

```javascript
// experimental: {
//   webpackBuildWorker: true,  // ← DESCOMENTADO
```

Reduz tempo de build em ~40% usando workers paralelos. Não afeta runtime performance mas acelera o CI/CD.

---

#### P2.4 — Service Worker para Cache Offline

**Arquivo:** Novo `public/sw.js`
**Impacto:** Visitas recorrentes: LCP -500 a -1000ms

O projeto já tem `dexie` (IndexedDB) e `PwaOfflineController`. Implementar cache de shell (App Shell pattern) via Service Worker para que visitas recorrentes não precisem fazer round-trip para o servidor.

---

#### P2.5 — Implementar Content Security Policy (CSP)

**Arquivo:** `next.config.js` headers
**Impacto:** Segurança + leve melhoria de score Lighthouse Best Practices

O projeto tem todos os security headers **exceto CSP**. GTM, PostHog e Sentry precisam de `script-src` entries explícitas.

---

#### P2.6 — Migrar Claymorphism de `box-shadow` para CSS Filter

**Arquivo:** `app/globals.css` classes `.clay-convex`, `.clay-concave`
**Impacto:** CLS e jank em mobile -30 a -60ms

`box-shadow` com múltiplas camadas força repaint em cada hover/focus. `filter: drop-shadow()` é acelerado por GPU. Especialmente importante para dispositivos Android de médio range.

---

## 4. CONCLUSÃO TÉCNICA

### Previsão de Score Após Implementações

| Fase | Implementações | Score Estimado | TBT | LCP | CLS |
|------|---------------|---------------|-----|-----|-----|
| **Atual** | — | **41** | ~4.5s | ~3.5s | ~0.15 |
| **P0 completo** | GTM lazy + HTTP/2 + Bundle Analyzer | **~62** | ~2.0s | ~2.5s | ~0.10 |
| **P0 + P1 completo** | + Hero refactor + mixpanel removal + contraste | **~78** | ~0.8s | ~1.5s | ~0.05 |
| **P0 + P1 + P2 completo** | + PPR + SW + CSP | **~88–92** | ~0.3s | ~0.8s | ~0.02 |

### Ordem de Execução Recomendada

```
Semana 1:  P0.2 (Bundle Analyzer) → P0.1 (GTM lazy) → P0.3 (Habilitar HTTP/2 no NPM)
Semana 2:  P0.4 (ThemeProvider) → P1.1 (LandingHero split) → P1.2 (mixpanel)
Semana 3:  P1.3 (Carousel lazy) → P1.5 (libs dinâmicas) → P1.4 (cache conflito)
Semana 4+: P1.6 (contraste WCAG) → P2.1 (PPR) → P2.4 (Service Worker)
```

### Root Cause em Uma Linha

> O score 41 é causado primariamente por **dois scripts inline síncronos do GTM no `<head>` bloqueando o main thread por 4.5s**, agravado pela **ausência de HTTP/2** que força serialização de todos os assets JS — em um contexto onde o bundle analyzer está desabilitado, tornando o problema invisível para o time.

---

*Auditoria realizada sem alterações de código. Todos os diagnósticos são baseados em análise estática do código-fonte.*
*Arquivos inspecionados: `next.config.js`, `package.json`, `app/layout.tsx`, `app/page.tsx`, `components/landing/LandingHero.tsx`, `components/GoogleTagManager.tsx`, `components/PostHogProvider.tsx`, `app/globals.css`, `Dockerfile.frontend`, `docker-compose.yml`*
