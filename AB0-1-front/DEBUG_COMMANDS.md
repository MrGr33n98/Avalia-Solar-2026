# Performance Debugging Commands

Comandos úteis para validar e debugar as otimizações de performance.

---

## 🔍 BUILD & ANALYSIS

### Clean Build
```bash
# Remove cache e rebuilda do zero
npm run clean:next
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Bundle Analysis
```bash
# Gera relatórios HTML em .next/analyze/
npm run analyze

# Abrir relatórios (Windows)
start .next/analyze/client.html
start .next/analyze/edge.html
start .next/analyze/nodejs.html

# Abrir relatórios (Mac/Linux)
open .next/analyze/client.html
open .next/analyze/edge.html
open .next/analyze/nodejs.html
```

### Verificar Bundle Sizes
```bash
# Ver tamanho dos chunks
ls -lh .next/static/chunks/*.js | sort -k5 -hr | head -20

# Ver tamanho total do build
du -sh .next

# Ver tamanho do standalone output
du -sh .next/standalone
```

---

## 🧪 TESTING WEB VITALS

### Local Development
```bash
# 1. Start dev server
npm run dev

# 2. Abrir no navegador
open http://localhost:3000

# 3. Console do navegador deve mostrar:
# [WebVitals] LCP: { value: 1234, rating: 'good', ... }
# [WebVitals] CLS: { value: 0.05, rating: 'good', ... }
# [WebVitals] INP: { value: 150, rating: 'good', ... }
```

### Production Build Local
```bash
# 1. Build production
npm run build

# 2. Start production server
npm run start

# 3. Abrir no navegador
open http://localhost:3000
```

### Simular Slow Network
```javascript
// Chrome DevTools > Console
// Throttle to Slow 3G
navigator.connection.effectiveType // "slow-2g"

// Force reload
location.reload(true)
```

---

## 📊 LIGHTHOUSE AUDITS

### Single Run
```bash
npx lighthouse http://localhost:3000 --view --preset=desktop
```

### Multiple Runs (Average)
```bash
# 3 runs para média mais precisa
npx lighthouse http://localhost:3000 --output=html --output-path=./lighthouse1.html --preset=desktop
npx lighthouse http://localhost:3000 --output=html --output-path=./lighthouse2.html --preset=desktop
npx lighthouse http://localhost:3000 --output=html --output-path=./lighthouse3.html --preset=desktop

# Calcular média manualmente dos scores
```

### Mobile Performance
```bash
npx lighthouse http://localhost:3000 --view --preset=mobile --throttling.cpuSlowdownMultiplier=4
```

### Specific Pages
```bash
# Homepage
npx lighthouse http://localhost:3000 --view

# Category page
npx lighthouse http://localhost:3000/categories/paineis-solares --view

# Company page
npx lighthouse http://localhost:3000/companies --view

# Dashboard (requires auth)
npx lighthouse http://localhost:3000/dashboard --view --extra-headers='{"Cookie":"jwt_token=YOUR_TOKEN"}'
```

---

## 🔎 BUNDLE INSPECTION

### Search for Libraries in Bundle
```bash
# Mixpanel in bundle?
grep -r "mixpanel" .next/static/chunks/*.js

# Framer Motion in bundle?
grep -r "framer-motion" .next/static/chunks/*.js

# Recharts in bundle?
grep -r "recharts" .next/static/chunks/*.js
```

### Analyze Specific Chunk
```bash
# Ver conteúdo de um chunk específico
cat .next/static/chunks/CHUNK_ID.js | head -100

# Ver tamanho
ls -lh .next/static/chunks/CHUNK_ID.js

# Procurar imports específicos
grep -o "from '[^']*'" .next/static/chunks/CHUNK_ID.js | sort | uniq
```

### Source Map Explorer (se source maps habilitados)
```bash
npx source-map-explorer .next/static/chunks/*.js --html source-map-report.html
```

---

## 📡 NETWORK DEBUGGING

### Check Analytics Loading

**DevTools > Network > Filter: "mixpanel"**
```javascript
// Console
// Deve mostrar requests APENAS após 5s + consent
performance.now() / 1000 // segundos desde page load
```

**DevTools > Network > Filter: "web-vitals"**
```javascript
// Verificar POST para /api/v1/analytics/web-vitals
// Payload deve conter: { name, value, rating, id, url }
```

### Monitor DNS Lookups
```javascript
// Chrome DevTools > Network > Right-click header > Domain
// Contar quantos domínios únicos

// Deve ser apenas:
// - api.avaliasolar.com.br (backend)
// - www.googletagmanager.com (GTM)
// - www.google-analytics.com (GA4)
// - nyc3.digitaloceanspaces.com (images)
// - (api-js.mixpanel.com - apenas após consent)
```

### Preconnect Verification
```bash
# Ver preconnects no HTML
curl http://localhost:3000 | grep "preconnect"

# Não deve incluir:
# - api-js.mixpanel.com
# - cdn.mxpnl.com
```

---

## 🐛 DEBUGGING ISSUES

### Analytics Not Loading
```javascript
// Console
localStorage.getItem('analytics_consent') // deve ser "true"
localStorage.getItem('cookies_accepted')  // deve ser "true"

// Force load
import('@/lib/analytics/lazy').then(m => m.initializeAnalytics())
```

### Web Vitals Not Tracking
```javascript
// Console
import('next/web-vitals').then(m => {
  m.useReportWebVitals(metric => console.log(metric))
})

// Verificar se componente está renderizado
document.querySelector('[data-web-vitals]')
```

### CSS Animations Not Working
```javascript
// Console - verificar Tailwind classes
document.querySelector('.animate-in')?.classList

// Forçar animação
element.style.animation = 'fadeIn 0.3s ease-out'
```

---

## 📈 PERFORMANCE PROFILING

### Chrome DevTools Performance
```javascript
// 1. DevTools > Performance
// 2. Click Record
// 3. Reload page
// 4. Stop recording
// 5. Analyze:
//    - Look for long tasks (> 50ms)
//    - Check main thread blocking
//    - Verify LCP element timing
```

### React DevTools Profiler
```javascript
// 1. Install React DevTools extension
// 2. DevTools > Profiler tab
// 3. Click Record
// 4. Interact with page
// 5. Stop recording
// 6. Analyze:
//    - Flamegraph view
//    - Ranked chart
//    - Component render times
```

### Measure Component Render Time
```javascript
// Add to component
import { Profiler } from 'react';

<Profiler id="SavingsCalculator" onRender={(id, phase, actualDuration) => {
  console.log(`${id} (${phase}) took ${actualDuration}ms`);
}}>
  <SavingsCalculator />
</Profiler>
```

---

## 🔐 AUTH DEBUGGING

### Check Better Auth Route
```bash
# Test auth endpoints
curl http://localhost:3000/api/auth/session

# Check runtime
curl -I http://localhost:3000/api/auth/session | grep "x-nextjs-runtime"
# Should be: nodejs (not edge)
```

### Verify JWT Cookie
```javascript
// Console
document.cookie.split(';').find(c => c.includes('jwt_token'))

// DevTools > Application > Cookies
// Should see: jwt_token, httpOnly=true
```

---

## 📦 DEPENDENCIES AUDIT

### Check Package Sizes
```bash
npx package-size-analyzer

# Or manual:
du -sh node_modules/* | sort -hr | head -20
```

### Find Unused Packages
```bash
npm run knip

# Or:
npx depcheck
```

### Check for Duplicates
```bash
npx npm-check-updates

# Or:
npm ls mixpanel-browser
npm ls recharts
npm ls framer-motion
```

---

## 🎨 CSS DEBUGGING

### Check Tailwind Classes
```javascript
// Console
Array.from(document.styleSheets)
  .find(s => s.href?.includes('tailwind'))
  ?.cssRules

// Verify animate-in class exists
document.styleSheets[0].cssRules[0].selectorText
```

### CSS Coverage
```javascript
// Chrome DevTools > Coverage tab
// 1. Start recording
// 2. Reload page
// 3. Stop recording
// 4. Check CSS coverage %
// Target: > 70% used
```

---

## 📝 LOGS

### Enable Verbose Logging
```bash
# .env.local
NEXT_PUBLIC_DEBUG_ANALYTICS=true
NODE_ENV=development
```

### Filter Logs
```javascript
// Console
console.log = new Proxy(console.log, {
  apply(target, thisArg, args) {
    if (args[0]?.includes('[Analytics]') || args[0]?.includes('[WebVitals]')) {
      target.apply(thisArg, args);
    }
  }
});
```

---

## 🚀 PRODUCTION CHECKS

### Verify Optimizations in Production
```bash
# Check bundle sizes on production
curl -I https://avaliasolar.com.br/_next/static/chunks/main.js | grep content-length

# Check preconnects
curl https://avaliasolar.com.br | grep preconnect

# Check Web Vitals endpoint
curl -X POST https://avaliasolar.com.br/api/v1/analytics/web-vitals \
  -H "Content-Type: application/json" \
  -d '{"name":"LCP","value":1234,"rating":"good"}'
```

### Monitor RUM Data
```javascript
// Mixpanel query (browser console on mixpanel.com)
// Events > web_vital
// Group by: properties.metric_name
// Aggregation: percentile(properties.metric_value, 0.75)
```

---

**Última atualização:** 2026-02-05  
**Versão:** 1.0
