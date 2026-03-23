---
quick_id: 260323-nej
description: "Reducao Agressiva de Bundle 4155KB JS Nao Utilizado"
date: 2026-03-23
status: planned
---

# Redução de Bundle - 4,155 KiB JS Não Utilizado

## Contexto
Lighthouse aponta 4,155 KiB de JS não utilizado no carregamento inicial.
Principais culpados:
- `framer-motion`: ~150KB gzip — carregado em 20+ componentes no critical path
- `recharts`: ~200KB gzip — usado apenas no dashboard (nunca na home)  
- `posthog-js`: ~100KB gzip — scripts de recorder carregados mesmo sem sessão
- Bundle de componentes de company profile carregado na home

## Tarefas

### Tarefa 1: Lazy load de framer-motion na home (MAIOR IMPACTO)

O `framer-motion` é importado staticamente em componentes da landing page como
`LandingHero`, `SavingsCalculator`, `CategoryCard`, etc.

No `app/page.tsx`, os componentes dinâmicos já usam `dynamic()`, mas os
componentes filhos importam framer-motion diretamente.

**Ação:** Nos componentes da landing page que usam `motion.*`, verificar se
estão dentro de `dynamic(() => import(...), { ssr: false })`. Se não estiverem,
mover para isso.

**Componentes críticos na landing page:**
- `components/landing/LandingHero.tsx` — se usar motion, envolver em dynamic
- `components/landing/SavingsCalculator.tsx` — já está em dynamic (ok!)
- `components/landing/HowItWorks.tsx` — já está em dynamic (ok!)

### Tarefa 2: Garantir que recharts NUNCA carrega na home

Recharts é usado exclusivamente no dashboard. Mas se algum componente da home
importar indiretamente algo que usa recharts, o bundle vai pagar o preço.

**Verificação:**
- `app/page.tsx` não deve importar nada do dashboard
- Recharts só deve aparecer em rotas `/dashboard/*`

### Tarefa 3: Adicionar `ssr: false` nos componentes pesados da landing

Componentes que usam framer-motion e são carregados na home mas não precisam
de SSR:
- `CompanyCard.tsx` — já tem dynamic com loading skeleton (ok!)
- `BannerByLocation.tsx` — já tem dynamic (ok!)
- `TrustRow.tsx` — já tem dynamic com ssr:false (ok!)

### Tarefa 4: Remover importação desnecessária de `framer-motion` em LandingHero

Se `LandingHero` usa motion.div com animações, ele precisa do framer-motion.
Mas se for apenas para fade-in, podemos substituir por `@keyframes` CSS como
alternativa zero-JS para o SSR.

### Tarefa 5: Verificar CLS (de 0 → 0.027)

CLS novo de 0.027 indica que algum elemento está mudando de posição após o
carregamento inicial. Provavelmente um skeleton que não tem a mesma altura que
o conteúdo real.

**Verificação:** Adicionar `min-h` fixo nos Suspense boundaries da home.
