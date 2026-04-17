# ✅ Story Validation Checklist - Category Page v2

**Purpose:** Validar qualidade e completude de cada story antes de implementação  
**Audience:** PO, Tech Lead, QA  
**Status:** Template de Validação

---

## 📋 Pre-Development Validation (PO Activity)

### Checklist para CADA Story antes de ir para "In Development"

#### 1. **Story Clarity** ✓
- [ ] Título é claro e acionável?
- [ ] Descrição tem contexto suficiente (WHAT, WHY, HOW)?
- [ ] Nenhuma ambiguidade técnica?
- [ ] Linguagem é simples e sem jargão?

#### 2. **Acceptance Criteria** ✓
- [ ] Cada critério é testável e mensurável?
- [ ] Existem entre 3-8 critérios (ideal)?
- [ ] Nenhum critério é vago ("melhorar", "otimizar")?
- [ ] Critérios cobrem funcionalidade, UX, acessibilidade, performance?

#### 3. **Tasks** ✓
- [ ] Tasks decompõem story em passos executáveis?
- [ ] Cada task leva máximo 2h (se > 2h, quebrar mais)?
- [ ] Tasks têm owner claro (dev, designer, qa)?
- [ ] Sequência lógica definida?

#### 4. **Dependências** ✓
- [ ] Dependências externas identificadas?
- [ ] Bloqueadores conhecidos?
- [ ] Ordem de execução entre stories clara?

#### 5. **Definition of Done (DoD)** ✓
- [ ] DoD é específico (não genérico)?
- [ ] Inclui: code quality, tests, documentation, accessibility?
- [ ] Alinhado com padrões do projeto?

#### 6. **Estimativa** ✓
- [ ] Effort estimado é realista?
- [ ] Baseado em stories similares históricas?
- [ ] Buffer de 10% considerado?

---

## 🔍 Code Review Integration (CodeRabbit)

### Validação Automática via CodeRabbit PR

Cada PR deve passar por:

#### **Checklist Automático CodeRabbit:**
```yaml
# .github/coderabbit.yaml - Adicionar à config existente
rules:
  - rule: "TypeScript Type Safety"
    severity: error
    checks:
      - "No 'any' types"
      - "All props typed"
      - "Return types explicit"
  
  - rule: "Accessibility (WCAG AAA)"
    severity: error
    checks:
      - "aria-label present on interactive elements"
      - "No color-only differentiation"
      - "Contrast ratio >= 4.5:1"
  
  - rule: "Performance"
    severity: warning
    checks:
      - "Images have loading='lazy'"
      - "No console.log in production"
      - "Unused imports removed"
  
  - rule: "Testing"
    severity: warning
    checks:
      - "New components have tests"
      - "Test coverage >= 80%"
```

---

## 📝 Story Validation Template

Use este template para validar CADA story:

### Story: **[Story ID] - [Title]**

**Validado por:** _______________ **Data:** ___________

#### ✅ Clarity Check
- [ ] Título claro
- [ ] Contexto entendível
- [ ] Sem ambiguidade

**Notas:** ___________________________________________

#### ✅ Acceptance Criteria
- [ ] Testável
- [ ] Mensurável
- [ ] Sem vagueza
- [ ] 3-8 critérios

**Notas:** ___________________________________________

#### ✅ Tasks
- [ ] Decomposição lógica
- [ ] Cada task < 2h
- [ ] Owner assignado
- [ ] Sequência clara

**Notas:** ___________________________________________

#### ✅ Dependencies
- [ ] Sem bloqueadores
- [ ] Ordem clara com outras stories
- [ ] Externos documentados

**Notas:** ___________________________________________

#### ✅ Definition of Done
- [ ] Específico
- [ ] Cobertura completa
- [ ] Alinhado com DoD projeto

**Notas:** ___________________________________________

#### ✅ Estimate
- [ ] Realista (comparar históricas)
- [ ] Buffer incluído

**Notas:** ___________________________________________

#### 🎯 VALIDAÇÃO FINAL

- [ ] Story pronta para implementação
- [ ] Nenhum bloqueador identificado
- [ ] Approved by: PO / Tech Lead

**Status:** ⏳ READY / 🔴 NEEDS REFINEMENT

---

## 📊 Story Validation Metrics

Após validação, registrar:

```markdown
| Story | Clarity | AC Quality | Task Decomp | Dependencies | Estimate | Ready? |
|-------|---------|------------|-------------|--------------|----------|--------|
| S1-001 | ✅ | ✅ | ✅ | ✅ | 3.5h | ✅ |
| S1-002 | ✅ | ✅ | ✅ | ✅ | 2h | ✅ |
| ... | | | | | | |
```

---

## 🚀 Sprint Planning Meeting Agenda

**Duration:** 2h  
**Participants:** PO, Tech Lead, Dev Team, QA, Designer

### Agenda:
1. **Overview** (15 min)
   - Product goal recap
   - Success metrics
   
2. **Story Walkthrough** (60 min)
   - PO apresenta cada story
   - Dev discute feasibility
   - QA valida test plan
   - Refina AC se necessário

3. **Estimate & Commitment** (30 min)
   - Planning Poker para story points
   - Confirm commitment para sprint
   - Assign ownership

4. **Dependencies & Risks** (15 min)
   - Identifica blockers
   - Mitigation plan
   - Define escalation path

---

## 🎯 Key Checkpoints During Development

### Daily (Dev):
- [ ] Repo buildable? (`npm run build`)
- [ ] Tests passing? (`npm test`)
- [ ] No console errors?

### PR Review (Before Merge):
- [ ] CodeRabbit approval
- [ ] Manual code review (peer)
- [ ] AC checklist completed
- [ ] Tests >= 80% coverage
- [ ] Lighthouse >= 90 (perf check)
- [ ] axe-core scan (accessibility)
- [ ] No regression in existing features

### Story Closure (Before "Done"):
- [ ] All tasks checked ✅
- [ ] All AC validated ✅
- [ ] DoD met ✅
- [ ] PR merged ✅
- [ ] Tested in staging ✅
- [ ] Analytics firing ✅

---

## 📈 Quality Gates

### Build Quality Gate:
```bash
# Tudo deve passar antes de merge
npm run lint          # TypeScript + ESLint
npm run type-check    # Type safety
npm run test          # Unit tests
npm run build         # Production build
```

### Performance Gate:
```bash
# Lighthouse local validation
npm run lighthouse:mobile    # >= 90
npm run lighthouse:desktop   # >= 90
```

### Accessibility Gate:
```bash
# axe-core scan
npm run axe:scan    # 0 violations críticas
```

### Testing Gate:
```bash
# E2E tests
npm run test:e2e     # Todas passando
npm run test:coverage # >= 80%
```

---

## 🔴 Story Rejection Criteria

Story é **REJECTED** se:

- [ ] Acceptance Criteria é vago ("melhorar", "otimizar")
- [ ] Nenhuma AC é testável
- [ ] Tasks > 2h cada
- [ ] Dependência não documentada
- [ ] Estimate > 8h sem quebra
- [ ] Nenhuma AC de acessibilidade
- [ ] Nenhuma AC de performance
- [ ] Sem test plan claro

**Ação:** Retorna para PO para refinement

---

## ✨ Story Acceptance (Final)

### Story é ACCEPTED quando:

1. **Code Quality**
   - [ ] TypeScript 0 errors
   - [ ] ESLint 0 errors
   - [ ] Tests >= 80% coverage
   - [ ] No console errors

2. **Functionality**
   - [ ] Todas AC validadas ✅
   - [ ] Feature funciona em múltiplos navegadores
   - [ ] Nenhuma regression

3. **Performance**
   - [ ] Lighthouse >= 90
   - [ ] Bundle size delta <= 10KB
   - [ ] Imagens otimizadas

4. **Accessibility**
   - [ ] WCAG AAA
   - [ ] axe-core 0 violations
   - [ ] Keyboard navigation funciona

5. **Documentation**
   - [ ] Componentes documentados
   - [ ] README atualizado
   - [ ] PR description completo

6. **Analytics**
   - [ ] Events firing corretamente
   - [ ] Dashboard recebendo dados

### Sign-Off:
- [ ] **Dev:** Implementação completa
- [ ] **QA:** Testes passando
- [ ] **PO:** Funcionalidade validada
- [ ] **Tech Lead:** Arquitetura aprovada

**Story Status:** ✅ DONE (pronto para produção)

---

## 📋 Validação Pré-Sprint Planning

**Antes de Sprint Planning:**

Cada story deve passar por esta checklist:

```markdown
## Story Validation Pre-Sprint

- [ ] S1-001: Code Cleanup
  - [ ] Clarity ✅
  - [ ] AC quality ✅
  - [ ] Tasks ✅
  - [ ] Ready ✅

- [ ] S1-002: CategoryHero
  - [ ] Clarity ✅
  - [ ] AC quality ✅
  - [ ] Tasks ✅
  - [ ] Ready ✅

... (para cada story)
```

**Output:** Go/No-Go decision para Sprint Planning

---

## 🎓 Best Practices

### Para PO (Validação de Stories):
1. Sempre ter acceptance criteria testável
2. Quebrar stories > 5h em menores
3. Incluir acessibilidade/performance em AC
4. Validar com dev antes de sprint

### Para Dev (Implementação):
1. Entregar conforme AC definida
2. Não "escopo creep" fora da story
3. Manter DoD rigorosamente
4. Testar em múltiplos navegadores

### Para QA (Validação):
1. Testar apenas AC definida
2. Usar checklist (não improvisado)
3. Validar acessibilidade
4. Reportar findings com clareza

### Para Tech Lead:
1. Revisar arquitetura antes de dev
2. Escalar riscos cedo
3. Code review rigoroso
4. Validar performance antes de merge

---

## 📞 Contacts & Escalation

**Blocker de story?** Escalar para:
- **Tech Blocker:** Tech Lead
- **Design Blocker:** Designer
- **Backend Blocker:** Backend Lead
- **Business Blocker:** PO

---

**Template criado por:** Technical Product Owner  
**Última atualização:** 2026-02-27  
**Status:** Ready for Use

---
