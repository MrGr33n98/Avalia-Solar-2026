# STORY M-006: Mobile Dashboard IA Redesign

**ID:** M-006 | **Epic:** [EPIC-MOBILE-001](../EPIC-MOBILE-001_MOBILE_FIRST_READINESS.md)
**Sprint:** 3 | **Points:** 13 | **Priority:** 🟠 High
**Created:** 2026-03-10
**Status:** 🔄 In Review

**Predecessor:** M-002 (Touch-Safe Navigation)

---

## User Story

**Como** usuário mobile do dashboard empresarial,  
**Quero** ver imediatamente as 3-5 tarefas principais da minha rotina,  
**Para que** eu conclua ações críticas sem navegar por uma IA desktop-centric.

---

## Context

**Problema Atual:**

- o dashboard mobile ainda herda uma IA densa do desktop em `AB0-1-front/app/dashboard/components/EnterpriseDashboard.tsx`
- ações centrais como busca global e exportação ficam escondidas em breakpoints desktop em `AB0-1-front/app/dashboard/components/EnterpriseHeader.tsx`
- informação contextual da empresa também some em telas menores no header

**Sintoma de UX:**

- muitas seções concorrem pela atenção no mobile
- tarefas principais não ficam evidentes acima da dobra
- a navegação exige mais passos do que o necessário para leads, performance e gestão básica

**Business Impact:**

- reduz task completion mobile no dashboard
- aumenta tempo para executar tarefas primárias
- mantém percepção de produto “desktop reduzido”

**MFRI Impact:**

- +5 → +8

---

## Acceptance Criteria

### AC1: Tarefas Primárias Visíveis
- [x] Dashboard mobile exibe 3-5 tarefas primárias acima da dobra
- [x] Priorização explícita para ações recorrentes de mobile
- [x] Conteúdo secundário sai do fluxo principal

### AC2: Ações Secundárias Reorganizadas
- [x] Funcionalidades secundárias ficam em `More` menu ou camada equivalente
- [x] Busca global e ações utilitárias têm padrão mobile consistente
- [x] IA mobile deixa clara a diferença entre ação primária e ação de suporte

### AC3: Navegação Mobile-First
- [x] Navigation drawer mobile implementado ou refinado para uso touch-first
- [x] Header mobile preserva contexto essencial da empresa
- [x] Fluxo de mudança de seção exige menos passos do que hoje

### AC4: Outcome de Uso
- [ ] Task completion mobile >65%
- [ ] Tempo para tarefa principal <2 minutos
- [ ] Zero regressions desktop

---

## Scope

### In Scope
✅ Redesenhar IA mobile do dashboard  
✅ Reduzir densidade e priorizar tarefas críticas  
✅ Reorganizar ações secundárias  
✅ Ajustar navegação/header mobile  
✅ Validar impacto em task completion

### Out of Scope
❌ Novas capabilities de backend  
❌ Reescrever analytics do dashboard  
❌ Refactor completo de todas as tabs internas  
❌ Mudanças de billing/plano

---

## Tasks

### Task 6.1: Research & Task Analysis
- [x] Mapear as tarefas mobile mais frequentes no dashboard atual
- [x] Identificar quais ações precisam ficar acima da dobra
- [x] Validar quais seções podem migrar para `More`

### Task 6.2: IA Redesign
- [x] Definir 3-5 tarefas primárias mobile
- [x] Desenhar hierarquia mobile do dashboard
- [x] Refinar padrão de navegação lateral/drawer para mobile

### Task 6.3: Implementation
- [x] Ajustar layout mobile do dashboard
- [x] Reorganizar header e ações rápidas
- [x] Reposicionar acessos secundários em camada apropriada

### Task 6.4: Validation
- [ ] Testar fluxo completo em iOS Safari e Android Chrome
- [ ] Medir task completion dos fluxos primários
- [ ] Executar smoke de regressão desktop

---

## Dev Notes

### Candidate Files
- `AB0-1-front/app/dashboard/components/EnterpriseDashboard.tsx`
- `AB0-1-front/app/dashboard/components/EnterpriseHeader.tsx`
- `AB0-1-front/app/dashboard/components/EnterpriseSidebar.tsx`
- `AB0-1-front/app/dashboard/components/LeadsOpportunities.tsx`
- `AB0-1-front/app/dashboard/components/MobileDashboardQuickAccess.tsx`
- `AB0-1-front/config/navigation.ts`

### Mobile Constraints
- priorizar thumb zone para ações principais
- evitar replicar a hierarquia desktop no mobile
- manter rastreamento existente se ações forem reposicionadas

---

## Definition of Done

- [x] 3-5 tarefas principais priorizadas no mobile
- [x] ações secundárias reorganizadas
- [x] navegação mobile ajustada
- [ ] validação mobile executada
- [x] story documentada com checklist e file list

---

## File List
- [x] `AB0-1-front/app/dashboard/components/EnterpriseDashboard.tsx`
- [x] `AB0-1-front/app/dashboard/components/EnterpriseHeader.tsx`
- [ ] `AB0-1-front/app/dashboard/components/EnterpriseSidebar.tsx`
- [ ] `AB0-1-front/app/dashboard/components/LeadsOpportunities.tsx`
- [x] `AB0-1-front/app/dashboard/components/MobileDashboardQuickAccess.tsx`
- [x] `AB0-1-front/config/navigation.ts`
- [x] `AB0-1-front/app/dashboard/components/CommandMenu.tsx`
- [x] `AB0-1-front/__tests__/components/MobileDashboardQuickAccess.test.tsx`
- [x] `AB0-1-front/__tests__/components/EnterpriseHeader.test.tsx`
- [x] `AB0-1-front/__tests__/navigation.test.ts`
- [x] `docs/stories/M-006_mobile_dashboard_ia_redesign.md`

---

## Validation
- [ ] QA manual em iOS Safari
- [ ] QA manual em Android Chrome
- [ ] benchmark de task completion mobile
- [ ] smoke de regressão desktop

**Validation Notes (2026-03-10):**
- story materializada a partir de `docs/MOBILE_PRODUCT_BACKLOG.md`
- requisitos derivados do epic e do backlog, sem implementação iniciada
- quick access mobile implementado com 5 ações prioritárias (`overview`, `reviews`, `leads`, `ranking-performance`, `trust-widget`)
- ações secundárias migradas para a camada de navegação mobile via botão `Mais`
- header mobile agora preserva contexto da empresa e expõe ações utilitárias antes restritas ao desktop
- `npx jest __tests__/navigation.test.ts __tests__/components/EnterpriseHeader.test.tsx __tests__/components/MobileDashboardQuickAccess.test.tsx --runInBand` ✅
- `npm run lint` ✅ com warnings preexistentes

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-03-10 | 1.0 | Draft story created from epic and backlog | Codex |
| 2026-03-10 | 1.1 | Mobile quick actions and header utility menu implemented | Codex |

---

**Generated by:** Codex
