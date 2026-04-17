# 📚 CATÁLOGO DE EVENTOS CONSOLIDADO - PLANO DE MIGRAÇÃO

**Projeto:** Avalia Solar  
**Data:** 2026-03-05  
**Owner:** Data Engineer  
**Status:** 🟡 EM EXECUÇÃO - ENTRYPOINT CONSOLIDADO E GUARDRAILS ATIVOS

---

## STATUS UPDATE - 2026-03-11

- `lib/analytics/consolidated.ts` foi criado como facade de migração para consumers legados de `dataLayer` em `app/`, `components/` e `hooks/`.
- `lib/dataLayer.ts` agora é apenas um shim temporário de compatibilidade, marcado como `@deprecated`.
- `lib/events.ts` não existe mais no estado atual do repositório; a migração ativa concentra-se em eliminar imports legados de `dataLayer`.
- As seções abaixo que ainda citam `@/lib/analytics` refletem o plano original; para substituir helpers de `dataLayer`, o alvo seguro no estado atual é `@/lib/analytics/consolidated`.
- Guardrails já ativos:
  - teste Jest que falha se `app/`, `components/` ou `hooks/` importarem `@/lib/dataLayer`
  - regra ESLint `no-restricted-imports` bloqueando novos imports legados
  - spec backend cobrindo alias canônico + preservação de `tracked_at` no endpoint `/api/v1/analytics/track`
- Pendência principal: jornadas browser end-to-end completas para os eventos core.

---

## SUMÁRIO EXECUTIVO

**Problema:** 3 bibliotecas de analytics coexistindo causando duplicação e inconsistência.

**Bibliotecas Atuais:**
1. `lib/analytics/index.ts` ✅ MANTER (core runtime)
2. `lib/analytics/consolidated.ts` ✅ MANTER (facade de migração para imports legados)
3. `lib/dataLayer.ts` ⚠️ SHIM TEMPORÁRIO / DEPRECATED

**Impacto atual:** imports legados em `app/`, `components/` e `hooks/` já estão bloqueados por teste + lint; o trabalho restante é fechar jornadas E2E e remover o shim no cleanup final.

---

## 1. DECISÃO DE CONSOLIDAÇÃO

### 1.1 Biblioteca Principal

**ESCOLHA:** `lib/analytics/index.ts`

**Justificativa:**
- ✅ Type-safe com TypeScript completo
- ✅ Consent management integrado
- ✅ Dedupe implementado
- ✅ Backend + Mixpanel + GA4 unified
- ✅ Event ID generation
- ✅ Session tracking
- ✅ Lazy loading do Mixpanel

---

### 1.2 Assinaturas de Deprecação

```typescript
// lib/dataLayer.ts - DEPRECATED
/**
 * @deprecated Use lib/analytics/index.ts instead
 * This file will be removed in v2.0.0
 * 
 * Migration guide: docs/validation/EVENT_CATALOG_MIGRATION.md
 */

// lib/events.ts - DEPRECATED
/**
 * @deprecated Use lib/analytics/index.ts instead
 * This file will be removed in v2.0.0
 * 
 * Migration guide: docs/validation/EVENT_CATALOG_MIGRATION.md
 */
```

---

## 2. COMPONENTES IMPACTADOS

### 2.1 Análise de Uso

**Query para encontrar usos:**

```bash
# dataLayer.ts
grep -r "from '@/lib/dataLayer'" AB0-1-front/
grep -r "import.*dataLayer" AB0-1-front/

# events.ts
grep -r "from '@/lib/events'" AB0-1-front/
grep -r "import.*events" AB0-1-front/
```

---

### 2.2 Lista de Componentes

**Usando `dataLayer.ts`:**

1. `app/categories/[slug]/CategoryPageClientV2.tsx`
   - **Função:** `trackPageView()`, `trackEvent()`
   - **Eventos:** `page_view`, `filter_applied`
   - **Prioridade:** 🔴 P0

2. `components/CompanyCard.tsx`
   - **Função:** `trackCompanyClick()`
   - **Eventos:** `company_card_click`
   - **Prioridade:** 🔴 P0

3. `components/CategoryCard.tsx`
   - **Função:** `trackCategoryClick()`
   - **Eventos:** `category_click`
   - **Prioridade:** 🟡 P1

4. `components/SearchBar.tsx`
   - **Função:** `trackEvent('search_submitted')`
   - **Eventos:** `search_submitted`
   - **Prioridade:** 🔴 P0

5. `components/QuickLeadModal.tsx`
   - **Função:** `trackLeadGenerated()`
   - **Eventos:** `lead_generated`
   - **Prioridade:** 🔴 P0

---

**Usando `events.ts`:**

1. `app/companies/[id]/page.tsx`
   - **Função:** `trackEvent('company_page_view')`
   - **Eventos:** `company_page_view`
   - **Prioridade:** 🔴 P0

2. `components/Banner.tsx`
   - **Função:** `trackEvent('banner_click')`
   - **Eventos:** `banner_click`
   - **Prioridade:** 🟡 P1

---

### 2.3 Matriz de Migração

| Componente | Lib Atual | Eventos | Effort (hrs) | Prioridade | Owner |
|------------|-----------|---------|--------------|------------|-------|
| CategoryPageClientV2 | dataLayer.ts | 3 | 2h | P0 | Dev Team |
| CompanyCard | dataLayer.ts | 1 | 1h | P0 | Dev Team |
| SearchBar | dataLayer.ts | 1 | 1h | P0 | Dev Team |
| QuickLeadModal | dataLayer.ts | 2 | 1.5h | P0 | Dev Team |
| CompanyDetailClient | events.ts | 2 | 1.5h | P0 | Dev Team |
| CategoryCard | dataLayer.ts | 1 | 0.5h | P1 | Dev Team |
| Banner | events.ts | 1 | 0.5h | P1 | Dev Team |
| **TOTAL** | - | **11** | **8 horas** | - | - |

---

## 3. GUIA DE MIGRAÇÃO

### 3.1 De `dataLayer.ts` para `analytics/index.ts`

**ANTES:**
```typescript
// OLD - dataLayer.ts
import { trackPageView, trackEvent } from '@/lib/dataLayer';

trackPageView({
  type: 'category',
  path: pathname,
  title: 'Category Page'
});

trackEvent('filter_applied', {
  filter_type: 'location',
  filter_value: 'SP'
});
```

**DEPOIS:**
```typescript
// NEW - analytics/index.ts
import { track } from '@/lib/analytics';

track('page_view', {
  page_type: 'category',
  pathname: pathname,
  page_title: 'Category Page'
});

track('filter_applied', {
  filter_type: 'location',
  filter_value: 'SP'
});
```

---

### 3.2 De `events.ts` para `analytics/index.ts`

**ANTES:**
```typescript
// OLD - events.ts
import { trackEvent } from '@/lib/events';

trackEvent('company_page_view', {
  companyId: id,
  companyName: name
});
```

**DEPOIS:**
```typescript
// NEW - analytics/index.ts
import { track } from '@/lib/analytics';

track('company_page_view', {
  company_id: id,  // Note: snake_case
  company_name: name
});
```

---

### 3.3 Mapeamento de Funções

| Função Antiga | Lib | Nova Função | Notas |
|---------------|-----|-------------|-------|
| `trackPageView()` | dataLayer | `track('page_view', {...})` | ✅ Automático |
| `trackEvent()` | dataLayer/events | `track(eventName, {...})` | ✅ Direto |
| `trackFormStart()` | dataLayer | `track('form_start', {...})` | ✅ Direto |
| `trackFormSubmit()` | dataLayer | `track('form_submit', {...})` | ✅ Direto |
| `trackLeadGenerated()` | dataLayer | `track('lead_submitted', {...})` | ⚠️ Rename |
| `trackCategoryClick()` | dataLayer | `track('category_click', {...})` | ✅ Direto |
| `trackCompanyClick()` | dataLayer | `track('company_card_click', {...})` | ⚠️ Rename |
| `trackContactCompany()` | dataLayer | `track('whatsapp_click', {...})` | ⚠️ Rename |
| `trackBannerClick()` | dataLayer | `track('banner_click', {...})` | ✅ Direto |

---

## 4. PLANO DE MIGRAÇÃO

### 4.1 Fase 1 - Preparação (1 dia)

**Tarefas:**
- [ ] Criar branch `feat/consolidate-analytics`
- [ ] Adicionar deprecation warnings nas libs antigas
- [ ] Criar helper de migração (codemod)
- [ ] Documentar este plano

---

### 4.2 Fase 2 - Migração Incremental (3 dias)

**Sprint 1 - Componentes P0 (2 dias):**
- [ ] Day 1: CategoryPageClientV2, CompanyCard
- [ ] Day 2: SearchBar, QuickLeadModal, CompanyDetailClient

**Sprint 2 - Componentes P1 (1 dia):**
- [ ] CategoryCard, Banner, outros

---

### 4.3 Fase 3 - Validação (1 dia)

**Testes:**
- [ ] Rodar testes unitários
- [ ] Validar eventos no GTM Preview
- [ ] Verificar GA4 DebugView
- [ ] Confirmar Mixpanel Live View
- [ ] Testar backend /analytics/track

---

### 4.4 Fase 4 - Cleanup (0.5 dias)

**Remoção:**
- [ ] Deletar `lib/dataLayer.ts`
- [ ] Deletar `lib/events.ts`
- [ ] Atualizar imports em testes
- [ ] Atualizar documentação
- [ ] Merge para main

---

## 5. SCRIPTS DE MIGRAÇÃO

### 5.1 Codemod Automático

```bash
# scripts/migrate-analytics.sh
#!/bin/bash

echo "🔄 Migrando analytics imports..."

# Replace dataLayer imports
find AB0-1-front/app AB0-1-front/components -type f -name "*.tsx" -o -name "*.ts" | while read file; do
  # dataLayer.ts -> analytics/index.ts
  sed -i "s|from '@/lib/dataLayer'|from '@/lib/analytics'|g" "$file"
  sed -i "s|from '@/lib/events'|from '@/lib/analytics'|g" "$file"
  
  # trackEvent() -> track()
  sed -i "s|trackEvent(|track(|g" "$file"
  
  # trackPageView() -> track('page_view')
  # (mais complexo, requer análise manual)
done

echo "✅ Imports migrados. Revisar manualmente funções específicas."
```

---

### 5.2 Lint Rule Customizada

```json
// .eslintrc.json
{
  "rules": {
    "no-restricted-imports": ["error", {
      "patterns": [{
        "group": ["**/lib/dataLayer", "**/lib/events"],
        "message": "Use '@/lib/analytics' instead. See docs/validation/EVENT_CATALOG_MIGRATION.md"
      }]
    }]
  }
}
```

---

### 5.3 Teste de Regressão

```typescript
// __tests__/analytics-migration.test.ts
import { track } from '@/lib/analytics';

describe('Analytics Migration', () => {
  it('should not import from deprecated libs', () => {
    // Este teste falha se algum arquivo importa libs antigas
    const fs = require('fs');
    const glob = require('glob');
    
    const files = glob.sync('app/**/*.{ts,tsx}');
    files.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).not.toContain("from '@/lib/dataLayer'");
      expect(content).not.toContain("from '@/lib/events'");
    });
  });
  
  it('track() function is accessible', () => {
    expect(typeof track).toBe('function');
  });
});
```

---

## 6. CHECKLIST DE MIGRAÇÃO

### 6.1 Por Componente

**Template:**

```markdown
## Component: [Nome]

**Status:** [ ] TODO [ ] IN PROGRESS [ ] DONE

**Arquivo:** [Path]

**Imports antigos:**
- [ ] `from '@/lib/dataLayer'` removido
- [ ] `from '@/lib/events'` removido

**Funções migradas:**
- [ ] `trackPageView()` → `track('page_view')`
- [ ] `trackEvent()` → `track()`
- [ ] [Outras funções]

**Testes:**
- [ ] Unit tests passando
- [ ] Manual test em dev
- [ ] Eventos visíveis no GTM Preview
- [ ] Eventos no backend

**Reviewed by:** _____________
**Merged:** [ ] Yes [ ] No
```

---

### 6.2 Checklist Geral

**Preparação:**
- [ ] Branch criada
- [ ] Deprecation warnings adicionados
- [ ] Plano comunicado ao time

**Migração:**
- [ ] Todos componentes P0 migrados
- [ ] Todos componentes P1 migrados
- [ ] Testes unitários atualizados
- [ ] Lint rules configuradas

**Validação:**
- [ ] Zero imports de libs antigas
- [ ] Todos testes passando
- [ ] QA manual completo
- [ ] Produção testada em staging

**Cleanup:**
- [ ] `dataLayer.ts` deletado
- [ ] `events.ts` deletado
- [ ] Documentação atualizada
- [ ] CHANGELOG.md atualizado

**Deployment:**
- [ ] PR aprovado
- [ ] Merged para main
- [ ] Deployed em produção
- [ ] Monitorado por 24h

---

## 7. RISCOS E MITIGAÇÕES

### 7.1 Riscos Identificados

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Eventos perdidos durante migração | MÉDIO | ALTO | Deploy incremental + monitoring |
| Nomenclatura inconsistente | BAIXO | MÉDIO | Testes automatizados + revisão |
| Componentes não encontrados | BAIXO | BAIXO | Grep recursivo no codebase |
| Rollback necessário | BAIXO | ALTO | Feature flag + phased rollout |

---

### 7.2 Plano de Rollback

```typescript
// lib/analytics/feature-flags.ts
export const ANALYTICS_V2_ENABLED = process.env.NEXT_PUBLIC_ANALYTICS_V2 === 'true';

// Componente exemplo
import { track } from '@/lib/analytics';
import { trackEvent as trackEventOld } from '@/lib/events';
import { ANALYTICS_V2_ENABLED } from '@/lib/analytics/feature-flags';

function logEvent(name, props) {
  if (ANALYTICS_V2_ENABLED) {
    track(name, props);
  } else {
    trackEventOld(name, props);
  }
}
```

**Rollback steps:**
1. Set `NEXT_PUBLIC_ANALYTICS_V2=false`
2. Redeploy
3. Monitorar eventos
4. Fix issues
5. Re-enable com `NEXT_PUBLIC_ANALYTICS_V2=true`

---

## 8. CRONOGRAMA

### 8.1 Timeline

```
Semana 1 (Dias 1-2): Preparação
├── Dia 1: Planning, branch, deprecation warnings
└── Dia 2: Codemod, lint rules, documentação

Semana 1 (Dias 3-5): Migração P0
├── Dia 3: CategoryPageClientV2, CompanyCard
├── Dia 4: SearchBar, QuickLeadModal
└── Dia 5: CompanyDetailClient, testes

Semana 2 (Dia 1): Migração P1
└── CategoryCard, Banner, outros

Semana 2 (Dia 2): Validação
└── QA completo, staging deploy

Semana 2 (Dia 3): Cleanup & Deploy
├── Delete libs antigas
├── Final review
└── Production deploy
```

**Total:** 8 dias úteis (2 semanas)

---

### 8.2 Milestones

- [ ] **M1:** Preparação completa (Dia 2)
- [ ] **M2:** P0 migrados (Dia 5)
- [ ] **M3:** P1 migrados (Dia 6)
- [ ] **M4:** Validação completa (Dia 7)
- [ ] **M5:** Em produção (Dia 8)

---

## 9. MÉTRICAS DE SUCESSO

**Durante Migração:**
- Zero eventos perdidos (comparar volume antes/depois)
- Zero errors no Sentry relacionados a analytics
- 100% dos componentes migrados

**Após Migração:**
- Bundle size reduzido ~15KB
- Imports simplificados (1 lib vs 3)
- Nomenclatura consistente (100% snake_case)
- Manutenibilidade aumentada

---

## 10. COMUNICAÇÃO

### 10.1 Stakeholders

**Notificar:**
- [ ] Dev Team (Slack #eng)
- [ ] QA Team (Slack #qa)
- [ ] Data Engineer (Owner)
- [ ] Product Manager

**Mensagem de Kick-off:**

```markdown
📣 Analytics Migration - Kick-off

Estamos consolidando 3 libs de analytics em 1 para melhorar manutenibilidade.

**O que muda:**
- `dataLayer.ts` e `events.ts` serão deprecados
- Usar apenas `lib/analytics/index.ts`
- Função única: `track(eventName, properties)`

**Timeline:** 2 semanas (Dias X-Y)

**Impacto em você:**
- Novos eventos: usar `track()` apenas
- Code reviews: verificar imports corretos
- QA: validar eventos continuam funcionando

**Documentação:** docs/validation/EVENT_CATALOG_MIGRATION.md

**Dúvidas:** #analytics-migration
```

---

## 11. PRÓXIMAS AÇÕES

**Hoje:**
- [ ] Aprovar este plano de migração
- [ ] Criar issue no GitHub/Jira
- [ ] Comunicar ao time
- [ ] Criar branch

**Esta semana:**
- [ ] Executar Fase 1 (Preparação)
- [ ] Iniciar Fase 2 (Migração P0)

**Próxima semana:**
- [ ] Completar Fase 2 (Migração P1)
- [ ] Executar Fase 3 (Validação)
- [ ] Executar Fase 4 (Cleanup & Deploy)

---

**Status Atual:** 🔴 **PLANO APROVADO - AGUARDANDO EXECUÇÃO**

**Documento criado:** 2026-03-05  
**Versão:** 1.0  
**Owner:** Data Engineer  
**Aprovado por:** _______________ (Data: _______)
