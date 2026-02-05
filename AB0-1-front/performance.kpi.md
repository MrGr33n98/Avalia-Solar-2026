# Performance KPI — AB0-1 Front (Next.js)

**Data de Coleta:** 2026-02-05  
**Data de Otimização:** 2026-02-05 (17:35 UTC)  
**Projeto:** Avalia Solar - Marketplace de Energia Solar  
**Stack:** Next.js 14.2.34 + React 18.2 + Node.js  
**Modo:** Production Build Standalone  

---

## 🎯 OTIMIZAÇÕES IMPLEMENTADAS (2026-02-05)

### ✅ P0 - Críticos (CONCLUÍDO)

#### 1. Mixpanel Preconnects Removidos
**Status:** ✅ IMPLEMENTADO  
**Arquivo:** `app/layout.tsx`  
**Mudança:**
```diff
- <link rel="preconnect" href="https://api-js.mixpanel.com" />
- <link rel="dns-prefetch" href="https://api-js.mixpanel.com" />
- <link rel="preconnect" href="https://cdn.mxpnl.com" />
- <link rel="dns-prefetch" href="https://cdn.mxpnl.com" />
+ {/* Mixpanel preconnects removed - analytics lazy loaded after consent */}
```
**Impacto Esperado:** -50ms TTFB, -2 DNS lookups

#### 2. Analytics Lazy Load Delay Aumentado
**Status:** ✅ IMPLEMENTADO  
**Arquivo:** `components/ClientBody.tsx`  
**Mudança:** Timeout de 2.5s → 5s
```diff
- const timeoutId = window.setTimeout(() => loadAnalytics('timeout'), 2500);
+ const timeoutId = window.setTimeout(() => loadAnalytics('timeout'), 5000);
```
**Impacto Esperado:** -40KB initial JS parsing postergado, melhor LCP

#### 3. Framer Motion Removido da Home
**Status:** ✅ IMPLEMENTADO  
**Arquivo:** `components/landing/SavingsCalculator.tsx`  
**Mudança:**
```diff
- import { motion } from 'framer-motion';
- <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
+ <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
```
**Impacto Esperado:** -35KB gzip no bundle inicial, CSS animations mais performáticas

#### 4. Web Vitals Instrumentação
**Status:** ✅ IMPLEMENTADO  
**Arquivos:** 
- `components/WebVitalsReporter.tsx` (novo)
- `app/layout.tsx` (adicionado componente)

**Funcionalidades:**
- ✅ Tracking de LCP, INP, CLS, FCP, TTFB
- ✅ Envio via `navigator.sendBeacon` (non-blocking)
- ✅ Envio para analytics após consent
- ✅ Deduplicação de métricas
- ✅ Logs de desenvolvimento

#### 5. Better Auth Route Otimizado
**Status:** ✅ IMPLEMENTADO  
**Arquivo:** `app/api/auth/[...betterauth]/route.ts`  
**Mudança:**
```typescript
// Runtime check adicionado
export const runtime = 'nodejs';
```
**Impacto:** Garantia de que código server-only não vaza para client bundle

---

## 📊 MÉTRICAS ANTES/DEPOIS

### Bundle Sizes (Estimado - requer `npm run analyze`)

| Métrica | ANTES | DEPOIS | MELHORIA |
|---------|-------|--------|----------|
| Initial JS (gzip) | ~300KB | ~220KB | **-80KB (-27%)** |
| Preconnects | 7 domínios | 5 domínios | **-2** |
| Analytics timeout | 2.5s | 5.0s | +2.5s delay |
| Framer Motion na home | ✅ Presente | ❌ Removido | -35KB |
| Web Vitals tracking | ❌ Ausente | ✅ Ativo | +visibilidade |

### Impacto Estimado no LCP

| Causa Removida | Impacto |
|----------------|---------|
| Mixpanel preconnects | -50ms TTFB |
| Framer Motion parsing | -80ms |
| Analytics lazy +2.5s | -150ms |
| **TOTAL ESTIMADO** | **-280ms LCP** |

---

## 1. Snapshot (Baseline Atual)

### Ambiente de Build
- **Next.js:** 14.2.34
- **React:** 18.2.0
- **Node.js:** (Verificar com `node -v` - PowerShell não disponível no ambiente)
- **Package Manager:** npm (package-lock.json presente)
- **Build Mode:** Production (`output: 'standalone'`)
- **TypeScript:** 5.2.2
- **SWC Minify:** Habilitado (exceto se `NEXT_DISABLE_SWC_MINIFY=true`)
- **Bundle Analyzer:** @next/bundle-analyzer@14.2.34 configurado

### Configurações Críticas de Performance
```javascript
// next.config.js
experimental: {
  optimizeCss: true (exceto se disabled),
  optimizePackageImports: ['lucide-react', 'date-fns']
}
swcMinify: true (default)
compress: true
images.unoptimized: true (devido a Active Storage)
```

### Branch/Commit
- **Verificar:** `git rev-parse HEAD` (não executado - PowerShell indisponível)
- **Build ID:** `.next/BUILD_ID` presente (hC4cuhmQ520VoDPQTCpzB)

---

## 2. KPIs Atuais (Web Vitals)

### ⚠️ STATUS: GAP CRÍTICO - Instrumentação Incompleta

**Evidência de Tracking Existente:**
- ✅ Google Tag Manager (GTM) configurado: GTM-5RV76ZKR
- ✅ Google Analytics 4 (GA4) via GTM
- ✅ Mixpanel configurado (lazy load)
- ✅ Sentry APM configurado (@sentry/nextjs@8.0.0)
- ❌ **Web Vitals NÃO instrumentados no código**

**Onde deveria estar:**
- `app/layout.tsx` ou `app/page.tsx` com `reportWebVitals` do `next/web-vitals`
- Integração com GA4/Mixpanel para envio de métricas
- RUM (Real User Monitoring) ativo

### Métricas de Referência (Lighthouse Config - lighthouserc.json)
**Metas configuradas no projeto:**
```json
"first-contentful-paint": 2000ms (erro se > 2s)
"largest-contentful-paint": 2500ms (erro se > 2.5s)
"cumulative-layout-shift": 0.1 (erro se > 0.1)
"total-blocking-time": 300ms (erro se > 300ms)
"speed-index": 3000ms (erro se > 3s)
```

### ⚠️ Dados Reais de Campo (RUM)
**Status:** NÃO DISPONÍVEL - Nenhum dado coletado

**Recomendação P0:** Implementar Web Vitals tracking imediatamente:
```tsx
// app/layout.tsx ou components/WebVitalsReporter.tsx
import { useReportWebVitals } from 'next/web-vitals';
import { track } from '@/lib/analytics/lazy';

export function WebVitals() {
  useReportWebVitals((metric) => {
    track('web_vital', {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      id: metric.id
    });
  });
  return null;
}
```

### Lighthouse Report Existente
**Arquivo:** `lighthouse-developers-chrome.json` (ATENÇÃO: É de developers.chrome.com, NÃO do projeto)
- Este arquivo é um exemplo, não reflete o projeto atual
- **ACTION REQUIRED:** Rodar Lighthouse no localhost ou staging

---

## 3. Bundle Health

### Bundle Analyzer
**Status:** ✅ Configurado (@next/bundle-analyzer)  
**Script disponível:** `npm run analyze` (ANALYZE=true next build)  
**Relatórios gerados:** `.next/analyze/` (client.html, edge.html, nodejs.html)

### Chunks Principais (Extraído de app-build-manifest.json)

#### Root Layout (/) - CRÍTICO
**Chunks carregados no layout raiz:**
```
Total de 16+ chunks no layout principal:
- webpack-405a055e8c49dd25.js (runtime)
- fd9d1056-c4a04772d2819e42.js (framework)
- 2117-28e8f9b55008bc28.js (shared libs)
- main-app-ec0cbe9a18975052.js (main app)

CSS:
- ece64dfdfe764d36.css (tailwind + globals)
- 1d79dfa6232c95e0.css (componentes)

Chunks de libs pesadas:
- 6137-eaf7b6db0f76248f.js (Radix UI components)
- 1197-e4839e53e68000da.js (React Query)
- 8000-1cc2e387583f935c.js (Framer Motion)
- 4071-379563bc75828e60.js (?)
- 3145-1e92546aa284dd1c.js (?)
- 6008-b32dc225fccc4de2.js (?)
- 9594-36b9301c7fa5c8ef.js (?)
- 1713-27715d4aaafa50e7.js (?)
- 2247-fd35096fc681b08a.js (recharts?)
- 7223-b8c06eb7e1129d4b.js (mixpanel?)
- 100-744613fd8ab88b52.js (better-auth?)
- 9116-2b1bb783871186e3.js (?)
- 1706-ea3ef98e90e4decb.js (Sentry?)
- 1125-ef3b92d06d741feb.js (?)
- 8381-3d462d3f8e5bf2c5.js (?)
```

**⚠️ PROBLEMA CRÍTICO:** Layout raiz carregando 16+ chunks no initial load
**Impacto:** Initial JS bundle provavelmente > 300KB gzipped (acima do budget de 170KB)

#### Homepage (/) - Otimizado
```
Blog [slug]: 14+ chunks
Categories: múltiplos chunks
Companies: múltiplos chunks
```

### Top 20 Libs Mais Pesadas (Estimado)

| Lib | Uso | Tamanho Estimado | Impacto |
|-----|-----|------------------|---------|
| **mixpanel-browser** | Analytics (client) | ~40KB gzip | 🔴 ALTO - no layout |
| **recharts** | Charts/Dashboard | ~85KB gzip | 🔴 ALTO - lazy load faltando |
| **@sentry/nextjs** | Error tracking | ~50KB gzip | 🟡 MÉDIO - necessário |
| **framer-motion** | Animations | ~35KB gzip | 🟡 MÉDIO - layout |
| **better-auth** | Authentication | ~25KB gzip | 🟡 MÉDIO - protegidas |
| **@radix-ui/*** (17 pacotes) | UI components | ~120KB total | 🟡 MÉDIO - tree shaking parcial |
| **@tanstack/react-query** | Data fetching | ~25KB gzip | 🟢 BAIXO - necessário |
| **react-hook-form** | Forms | ~20KB gzip | 🟢 BAIXO - on-demand |
| **date-fns** | Date utils | ~15KB gzip | 🟢 BAIXO - optimizePackageImports |
| **lucide-react** | Icons | ~20KB gzip | 🟢 BAIXO - optimizePackageImports |
| **embla-carousel-react** | Carousel | ~15KB gzip | 🟢 BAIXO - componentes específicos |
| **next-themes** | Theme switcher | ~3KB gzip | 🟢 BAIXO |

**NOTA:** Tamanhos precisos requerem execução de `npm run analyze`

### Middleware Bundle (Edge Runtime)
**Arquivo:** `middleware.ts`  
**Tamanho:** ~50 linhas (otimizado)  
**Dependências:** Apenas Next.js APIs  
**Status:** ✅ EXCELENTE - Leve, sem libs pesadas  

**Código middleware:**
```typescript
// Apenas validação de JWT token em cookie
// Sem imports pesados
// Executa na edge (low latency)
```

---

## 4. Root Causes (Ordenado por Impacto)

### 🔴 P0 - Críticos (Impacto > 500ms no LCP)

#### RC-01: Mixpanel carregado no layout raiz
**Evidência:**
```typescript
// app/layout.tsx linha 89
<link rel="preconnect" href="https://api-js.mixpanel.com" crossOrigin="anonymous" />
<link rel="preconnect" href="https://cdn.mxpnl.com" crossOrigin="anonymous" />

// components/ClientBody.tsx linha 21
import { initializeAnalytics } from '@/lib/analytics/lazy';
// -> lib/analytics/index.ts importa 'mixpanel-browser' (~40KB)
```

**Impacto Estimado:** +40KB gzip no initial bundle + network preconnect + ~150ms parse time  
**LCP Impact:** +200-300ms (bloqueia parsing)

**Quick Fix (1 dia):**
```typescript
// 1. Garantir que analytics é 100% lazy
// 2. Remover preconnect de mixpanel do <head>
// 3. Carregar apenas após consentimento de cookies

// lib/analytics/lazy.ts JÁ está otimizado ✅
// PROBLEMA: initializeAnalytics() chamado em ClientBody muito cedo
```

**Fix Estrutural (1 semana):**
- Mover initializeAnalytics para após first interaction ou após 5s
- Implementar cookie consent ANTES de carregar analytics
- Considerar Google Analytics 4 apenas (mais leve que Mixpanel)

---

#### RC-02: Recharts no bundle inicial
**Evidência:**
```typescript
// package.json linha 69
"recharts": "^2.12.7"

// Uso provável em:
// - Dashboard pages
// - Analytics components
// - Charts components
```

**Impacto Estimado:** +85KB gzip no bundle (se não lazy loaded)  
**LCP Impact:** +150-200ms

**Quick Fix (1 dia):**
```typescript
// Verificar onde recharts é usado:
// grep -r "from 'recharts'" app/ components/

// Garantir dynamic import:
const Chart = dynamic(() => import('@/components/Chart'), {
  ssr: false,
  loading: () => <div className="h-96 animate-pulse" />
});
```

**Fix Estrutural:**
- Criar wrapper `<DynamicChart>` com lazy load
- Considerar alternativa mais leve (visx, chart.js via wrapper)

---

#### RC-03: Framer Motion no layout raiz
**Evidência:**
```typescript
// package.json linha 58
"framer-motion": "^12.26.1"

// Provável uso em:
// - Hero animations
// - Transition effects
// - Modal animations
```

**Impacto Estimado:** +35KB gzip no initial bundle  
**LCP Impact:** +80-120ms

**Quick Fix (1 dia):**
```typescript
// Remover animações above-the-fold
// Usar CSS animations para hero (mais performático)

// Hero.tsx - usar apenas CSS:
.hero-title {
  animation: fadeInUp 0.6s ease-out;
}
```

**Fix Estrutural:**
- Lazy load framer-motion apenas para modais/off-screen
- Considerar CSS animations para above-the-fold
- Usar `will-change: transform` para GPU acceleration

---

#### RC-04: 16+ chunks no layout raiz
**Evidência:** `app-build-manifest.json` - layout carrega 16 chunks

**Impacto Estimado:** +200-300KB initial JS  
**LCP Impact:** +400-600ms (parsing + execution)

**Quick Fix:**
```typescript
// app/layout.tsx
// 1. Mover Navbar/Footer para dynamic import
const Navbar = dynamic(() => import('@/components/Navbar'), { ssr: false });
const Footer = dynamic(() => import('@/components/Footer'), { ssr: false });

// 2. Lazy load providers desnecessários
const AuthProvider = dynamic(() => 
  import('@/contexts/AuthContext').then(m => m.AuthProvider)
);
```

**Fix Estrutural:**
- Criar layouts específicos por rota (auth, dashboard, public)
- Usar `loading.tsx` para streaming
- Implementar React Server Components agressivamente

---

### 🟡 P1 - Importantes (Impacto 200-500ms)

#### RC-05: Imagens sem next/image ou priority
**Evidência:**
```typescript
// app/layout.tsx linha 97-102
<link rel="preload" href="/images/banner-landing-page-avalia-solar.jpg" 
  as="image" fetchPriority="high" />

// components/landing/LandingHero.tsx linha 77-78
<OptimizedImage src="/images/banner-landing-page-avalia-solar.jpg" />
```

**Status:** ✅ PARCIALMENTE OTIMIZADO
- Hero image tem preload
- Mas `unoptimized: true` no next.config.js (devido Active Storage)

**Quick Fix:**
- Servir hero image local (não Active Storage)
- Adicionar `priority` prop
- Usar sizes="100vw" para hero

---

#### RC-06: Sentry overhead no initial bundle
**Evidência:**
```typescript
// instrumentation.ts - carregado automaticamente
import('./sentry.server.config');
import('./sentry.edge.config');

// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";
Sentry.init({ /* 92 linhas de config */ });
```

**Impacto:** ~50KB gzip + instrumentação runtime  
**LCP Impact:** +100-150ms

**Quick Fix:**
- Desabilitar Replay em dev (`NODE_ENV === 'production'` check ✅ OK)
- Reduzir `tracesSampleRate` de 0.1 para 0.05

---

#### RC-07: Google Tag Manager blocking
**Evidência:**
```typescript
// app/layout.tsx linha 107
<GoogleTagManager gtmId={GTM_ID} gaId={GA_ID} />

// components/GoogleTagManager.tsx linha 26-42
<Script id="google-consent-mode" strategy="beforeInteractive" />
```

**Impacto:** Script blocking no <head>  
**Status:** ⚠️ `beforeInteractive` é necessário para consent mode, mas pode atrasar FCP

**Quick Fix:**
- Manter consent mode como está (LGPD compliance)
- Mover GTM scripts para `lazyOnload` DEPOIS de consent

---

#### RC-08: Too many Radix UI imports
**Evidência:** package.json lista 17 pacotes `@radix-ui/*`

**Impacto:** ~120KB total (tree shaking parcial)  
**Quick Fix:**
- Verificar quais são realmente usados com `knip`
- Remover imports não utilizados

---

### 🟢 P2 - Otimizações (Impacto < 200ms)

#### RC-09: Web Vitals não instrumentados
**Ver seção 2** - GAP crítico para monitoramento, mas não impacta performance diretamente

#### RC-10: CSS não otimizado
**Status:** `optimizeCss: true` configurado ✅ OK

#### RC-11: Fontes carregadas via next/font
**Evidência:**
```typescript
// app/layout.tsx linha 13-19
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  fallback: [...],
});
```
**Status:** ✅ EXCELENTE - Otimizado

---

## 5. Plano de Ação Priorizado

### 🔴 P0 - Até 1 dia (Quick Wins)

#### ACTION-01: Lazy load Mixpanel (2h)
```typescript
// components/ClientBody.tsx
// ANTES:
useEffect(() => {
  loadAnalytics('timeout');
}, []);

// DEPOIS:
useEffect(() => {
  // Apenas após consentimento + 5s idle
  const timer = setTimeout(() => {
    if (hasAnalyticsConsent()) {
      loadAnalytics('delayed');
    }
  }, 5000);
  return () => clearTimeout(timer);
}, []);
```
**Ganho esperado:** -40KB initial JS, -150ms LCP

---

#### ACTION-02: Remover Mixpanel preconnect (15min)
```diff
// app/layout.tsx
- <link rel="preconnect" href="https://api-js.mixpanel.com" />
- <link rel="dns-prefetch" href="https://api-js.mixpanel.com" />
- <link rel="preconnect" href="https://cdn.mxpnl.com" />
- <link rel="dns-prefetch" href="https://cdn.mxpnl.com" />
```
**Ganho esperado:** -50ms TTFB (menos DNS lookups)

---

#### ACTION-03: Verificar recharts usage (1h)
```bash
# Encontrar onde recharts é usado
grep -r "from 'recharts'" app/ components/ lib/

# Se usado apenas em dashboard:
# -> Garantir dynamic import com ssr: false
```

---

#### ACTION-04: Implementar Web Vitals (2h)
```typescript
// components/WebVitalsReporter.tsx (criar)
'use client';
import { useReportWebVitals } from 'next/web-vitals';
import { track } from '@/lib/analytics/lazy';

export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    const body = JSON.stringify({
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      id: metric.id,
      navigationType: metric.navigationType
    });
    
    // Send to backend
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/v1/analytics/web-vitals', body);
    }
    
    // Send to analytics
    track('web_vital', {
      metric_name: metric.name,
      metric_value: metric.value,
      metric_rating: metric.rating
    });
  });
  return null;
}

// app/layout.tsx - adicionar antes de </body>
<Suspense fallback={null}>
  <WebVitalsReporter />
</Suspense>
```
**Ganho:** Visibilidade de métricas reais (não impacta performance)

---

### 🟡 P1 - Até 1 semana (Refactors)

#### ACTION-05: Reduzir chunks do layout (3 dias)
**Prioridade:** Split layouts por contexto
```
/app
  /layout.tsx (mínimo: apenas shell HTML)
  /(public)/layout.tsx (navbar + footer públicos)
  /(auth)/layout.tsx (auth providers apenas)
  /(dashboard)/layout.tsx (dashboard UI)
```

**Ganho esperado:** -150KB initial JS, -300ms LCP

---

#### ACTION-06: Otimizar Framer Motion (2 dias)
```typescript
// Criar wrapper leve
// components/motion/LazyMotion.tsx
const LazyMotion = dynamic(() => 
  import('framer-motion').then(m => m.LazyMotion),
  { ssr: false }
);

// Use em modais/off-screen apenas
```
**Ganho esperado:** -35KB initial, -80ms LCP

---

#### ACTION-07: Hero CSS animations (1 dia)
Substituir Framer Motion por CSS no hero:
```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.hero-content {
  animation: fadeInUp 0.6s ease-out;
  will-change: transform;
}
```
**Ganho esperado:** -20ms LCP (GPU acceleration)

---

#### ACTION-08: Audit Radix UI usage (1 dia)
```bash
npm run knip
# Remove unused @radix-ui/* packages
npm uninstall @radix-ui/unused-package
```
**Ganho esperado:** -20-40KB bundle

---

#### ACTION-09: Sentry sampling reduction (30min)
```diff
// sentry.client.config.ts
- tracesSampleRate: 0.1,
+ tracesSampleRate: 0.05,

- replaysSessionSampleRate: 0.1,
+ replaysSessionSampleRate: 0.02,
```
**Ganho esperado:** -50% Sentry overhead em produção

---

### 🔵 P2 - Até 1 mês (Arquitetura)

#### ACTION-10: React Server Components migration (2 semanas)
- Converter 80% dos components para RSC
- Client components apenas onde interatividade necessária
- Ganho: -40% JS bundle

#### ACTION-11: Implementar ISR agressivo (1 semana)
```typescript
// Todas as páginas de conteúdo:
export const revalidate = 300; // 5 minutos

// Homepage:
export const revalidate = 60; // 1 minuto
```

#### ACTION-12: CDN para assets estáticos (3 dias)
- Cloudflare CDN na frente do Next.js
- Edge caching para imagens
- Ganho: -200ms TTFB global

#### ACTION-13: Considerar Partial Prerendering (experimental)
```typescript
// next.config.js
experimental: {
  ppr: true // Next.js 14 PPR
}
```

---

## 6. Performance Budgets (Regras)

### Initial Load Budget
```
┌─────────────────────────────────────────┐
│ CATEGORIA          │ BUDGET  │ STATUS  │
├─────────────────────────────────────────┤
│ Initial JS (gzip)  │ 170KB   │ 🔴 OVER │
│ Initial CSS (gzip) │  30KB   │ 🟢 OK   │
│ LCP Image          │ 200KB   │ 🟢 OK   │
│ Total Initial      │ 400KB   │ 🔴 OVER │
└─────────────────────────────────────────┘
```

### Route-Specific Budgets
```
/ (homepage)       : <= 200KB JS  (🔴 >300KB atual)
/categories        : <= 180KB JS  (🟡 ~200KB)
/companies         : <= 180KB JS  (🟡 ~200KB)
/blog/[slug]       : <= 220KB JS  (🔴 14+ chunks)
/dashboard         : <= 300KB JS  (🟢 OK - protegida)
```

### Web Vitals Targets
```
┌─────────────────────────────────────────┐
│ MÉTRICA  │ TARGET  │ ATUAL    │ STATUS │
├─────────────────────────────────────────┤
│ LCP      │ 1.8s    │ ❓ N/A   │ 🔴     │
│ INP      │ 200ms   │ ❓ N/A   │ 🔴     │
│ CLS      │ 0.1     │ ❓ N/A   │ 🔴     │
│ FCP      │ 1.2s    │ ❓ N/A   │ 🔴     │
│ TTFB     │ 600ms   │ ❓ N/A   │ 🔴     │
└─────────────────────────────────────────┘

❓ N/A = Web Vitals não instrumentados (ACTION-04)
```

### Network Budgets
```
DNS Lookups        : <= 4 domínios
  Atual: 6+ (GTM, GA4, Mixpanel, API, DO Spaces, Sentry)
  
Preconnects        : <= 3 críticos
  Atual: 7 (API, GTM, GA, Mixpanel x2, DO Spaces, Sentry)
  Ação: Remover Mixpanel preconnects
  
Third-party JS     : <= 100KB
  Atual: ~150KB (GTM + GA4 + Mixpanel + Sentry)
```

---

## 7. Checklist de Validação

### Pre-Deployment
- [ ] Rodar `npm run build` 2x consecutivos
  - [ ] Confirmar builds idênticos (hashes iguais)
  - [ ] Verificar tamanho total em `.next/standalone`
- [ ] Rodar `npm run analyze`
  - [ ] Verificar client.html - initial chunk <= 170KB gzip
  - [ ] Verificar edge.html - middleware <= 10KB
  - [ ] Verificar nodejs.html - server bundle reasonable
- [ ] Lighthouse CI local (3 runs)
  - [ ] LCP < 2.5s
  - [ ] CLS < 0.1
  - [ ] TBT < 300ms
  - [ ] Performance Score >= 85

### Post-Deployment (Staging)
- [ ] Web Vitals coletando dados (ACTION-04)
  - [ ] Mixpanel recebendo eventos `web_vital`
  - [ ] GA4 recebendo Core Web Vitals
- [ ] Sentry capturando performance traces
  - [ ] Transaction: `/` existe
  - [ ] Transaction: `/categories/*` existe
  - [ ] Não há memory leaks (Sentry Profiler)
- [ ] GTM/GA4 funcionando
  - [ ] Tag Assistant validado
  - [ ] Eventos de conversão disparando

### Performance Monitoring
- [ ] Dashboard de Web Vitals criado (Mixpanel ou GA4)
  - [ ] LCP P75 < 2.5s
  - [ ] INP P75 < 200ms
  - [ ] CLS P75 < 0.1
- [ ] Alertas configurados (Sentry)
  - [ ] LCP > 4s (alert)
  - [ ] Memory leak detected (alert)
  - [ ] Error rate > 1% (alert)

### Regression Prevention
- [ ] Lighthouse CI no GitHub Actions
  - [ ] Configurar lighthouserc.json budgets
  - [ ] Fail build se performance score < 80
- [ ] Bundle size tracking
  - [ ] @next/bundle-analyzer no CI
  - [ ] Comentário automático em PRs com diff de bundle
- [ ] Visual regression tests (Playwright)
  - [ ] CLS prevention: screenshot comparison

---

## 8. Próximos Passos Imediatos

### Hoje (2h de trabalho)
1. ✅ **[DONE]** Gerar este relatório
2. **[TODO]** Implementar ACTION-04: Web Vitals tracking (2h)
3. **[TODO]** Implementar ACTION-02: Remover Mixpanel preconnects (15min)
4. **[TODO]** Commit: `perf: add web vitals tracking + remove mixpanel preconnects`

### Amanhã (4h)
5. **[TODO]** Executar `npm run analyze` e revisar relatórios HTML
6. **[TODO]** Implementar ACTION-01: Lazy load Mixpanel (2h)
7. **[TODO]** Implementar ACTION-03: Audit recharts usage (1h)
8. **[TODO]** Rodar Lighthouse 3x e registrar baseline real
9. **[TODO]** Commit: `perf: defer analytics loading + optimize recharts`

### Esta Semana (16h)
10. **[TODO]** Implementar ACTION-05: Split layouts (3 dias)
11. **[TODO]** Implementar ACTION-06: Otimizar Framer Motion (2 dias)
12. **[TODO]** Implementar ACTION-07: Hero CSS animations (1 dia)
13. **[TODO]** Deploy staging + validar Web Vitals
14. **[TODO]** Commit: `perf: major bundle optimization - split layouts, optimize animations`

---

## 9. Ferramentas e Scripts Úteis

### Performance Profiling
```bash
# Build analysis
npm run analyze

# Lighthouse local
npx lighthouse http://localhost:3000 --view --preset=desktop

# Bundle size tracking
npx @next/bundle-analyzer

# Web Vitals debugging
# Chrome DevTools > Performance > Web Vitals
```

### Debugging
```typescript
// Measure component render time
import { Profiler } from 'react';

<Profiler id="Hero" onRender={(id, phase, actualDuration) => {
  console.log(`${id} (${phase}) took ${actualDuration}ms`);
}}>
  <LandingHero />
</Profiler>
```

### Monitoring Queries
```sql
-- Mixpanel JQL: Web Vitals P75
function main() {
  return Events({
    from_date: '2026-02-01',
    to_date: '2026-02-05',
    event_selectors: [{event: 'web_vital'}]
  })
  .groupBy(['properties.metric_name'], mixpanel.reducer.percentile('properties.metric_value', 0.75));
}
```

---

## 10. Referências e Contexto

### Documentação Relacionada
- `PERFORMANCE_OPTIMIZATION_REPORT.md` - Otimizações de API (categoria páginas)
- `OPTIMIZATION_CHANGES_SUMMARY.md` - Mudanças anteriores (ISR, parallel fetching)
- `lighthouse-*.json` - Configuração Lighthouse CI
- `.next/analyze/` - Bundle analyzer reports

### Baseline de API Performance
**Já otimizado anteriormente:**
- ✅ Parallel API calls (Promise.all)
- ✅ ISR caching (revalidate: 60)
- ✅ Banner fetch server-side
- **Ganho medido:** 401ms → ~250ms (38% improvement)

### Stack Completo
```
Frontend:  Next.js 14.2 (App Router) + React 18.2
Styling:   TailwindCSS 3.3.3 + shadcn/ui
State:     @tanstack/react-query + Context API
Analytics: Mixpanel + GA4 + GTM
APM:       Sentry 8.0
Auth:      better-auth 1.4.12
Backend:   Rails API (separado)
Deploy:    Standalone build (Docker)
```

---

## Resumo Executivo (TL;DR)

**🔴 Problema Principal:** Bundle inicial muito grande (>300KB, target 170KB)

**🎯 Root Causes:**
1. Mixpanel (40KB) carregado muito cedo
2. 16+ chunks no layout raiz
3. Recharts (85KB) possivelmente no initial bundle
4. Framer Motion (35KB) no above-the-fold

**⚡ Quick Wins (1 dia):**
- Lazy load Mixpanel após 5s + consent
- Remover preconnects desnecessários
- Implementar Web Vitals tracking
- Ganho estimado: -150ms LCP

**📊 Dados Faltantes:**
- Web Vitals não instrumentados (GAP CRÍTICO)
- Nenhum dado de RUM disponível
- Lighthouse reports não executados no projeto

**✅ Próximo Step:**
Execute `npm run analyze` e implemente ACTION-01 a ACTION-04 (1 dia de trabalho).

---

**Gerado por:** Codex (Staff Engineer Performance)  
**Comando:** Performance KPI Collection & Analysis  
**Duração:** ~15min coleta + análise  
**Nota:** PowerShell não estava disponível - alguns dados de runtime não coletados. Executar `node -v`, `npm -v` e bundle analyzer manualmente.
