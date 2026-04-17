# 🗺️ Category Page v2 — Roadmap & Decision Tree

**Para:** Product Owner + Leadership  
**Objetivo:** Decisão clara do caminho forward  
**Status:** 🟡 DECISION REQUIRED

---

## 🤔 Sua Decisão: Qual Caminho?

```
Hoje (27/02 | 2026)
       ↓
  ┌────────────────────────────────────────────┐
  │   Você recebeu análise crítica + plano     │
  │   Qual é a próxima ação?                   │
  └────────────────────────────────────────────┘
       ↓
  ╭────────────────────────────────────────╮
  │                                        │
  ├─ 🟢 OPÇÃO A: Quick-Win (2-3 dias)    │
  │  (Fix críticos + Ship rápido)         │
  │                                        │
  ├─ 🔵 OPÇÃO B: Redesign Completo       │
  │  (5 dias dev = 2 sprints)             │
  │  (Dominante + monetização)            │
  │                                        │
  ├─ 🔴 OPÇÃO C: Não fazer nada           │
  │  (Manter como está)                   │
  │                                        │
  ╰────────────────────────────────────────╯
```

---

## 📊 Comparação: Quick-Win vs Completo

### Quick-Win (Opção A)
**Tempo:** 2-3 dias dev (~15-20h)  
**Esforço:** Sprint 1 only  
**ROI:** Médio (perf + UX local)

| Feature | Quick-Win | Completo |
|---------|-----------|----------|
| Remover componentes mortos | ✅ | ✅ |
| Reduzir altura card (240→160px) | ✅ | ✅ |
| Imagem 1:1 (16:9 → quadrado) | ✅ | ✅ |
| Remover botão "Explorar" | ✅ | ✅ |
| Fix acessibilidade básica | ✅ | ✅ |
| Decision Layer (chips) | ❌ | ✅ |
| Top Ranking section | ❌ | ✅ |
| Sponsored section | ❌ | ✅ |
| Lead modal interno | ❌ | ✅ |
| Lead routing (interno vs direto) | ❌ | ✅ |
| Toolbar sticky | ❌ | ✅ |
| Dark mode | ❌ | ✅ |
| Analytics completo | ❌ | ✅ |
| E2E testes | ❌ | ✅ |

### Impacto:

| Métrica | Quick-Win | Completo |
|---------|-----------|----------|
| **Lighthouse** | +5 | +7 |
| **Card altura** | 160px | 160px |
| **Cards visíveis** | 6-8 | 6-8 |
| **WCAG compliance** | AA+ | AAA |
| **Conversão (CTR)** | +0% | +15-20% esperado |
| **Lead modal ROI** | ❌ | ✅ |
| **Monetização** | ❌ | ✅ |
| **Mobile UX** | ~same | Muito melhor |
| **Analytics** | Parcial | Completo |

---

## 🎯 Qual Opção Escolher?

### Escolha **Quick-Win (Opção A)** SE:

✅ Tempo é crítico (deadline próximo)  
✅ Quer testar rápido se mudança ajuda  
✅ Equipe pequena (1-2 devs)  
✅ Monetização NÃO é prioridade imediata  
✅ Backend não está pronto para novas fields  

**Risco:** Vai precisar refazer tudo em 2-3 meses para adicionar monetização

---

### Escolha **Redesign Completo (Opção B)** SE:

✅ Conversão/monetização é prioridade  
✅ Tem 2 semanas para execution  
✅ Backend pode ser preparado em paralelo  
✅ Quer padrão replicável em TODAS categorias  
✅ Investe em produto long-term  

**Benefício:** Padrão dominante, pronto para monetização, escalável

---

### Escolha **Não Fazer (Opção C)** SE:

⚠️ Outras prioridades > categorias  
⚠️ Não há orçamento/pessoas  
⚠️ Acha que design atual está OK  

**Risco:** Concorrentes com melhor UX vão ganhar tráfego

---

## 📅 Timeline Detalhado por Opção

### **OPÇÃO A: Quick-Win (2-3 dias)**

```
SEMANA 1 (27/02 - 03/03)
├─ TER 27/02: Validação análise crítica (0.5h)
├─ QUA 28/02: Sprint Planning (1h)
└─ QUI-SEX 01-03/03: Sprint 1 (15h)
   ├─ Code cleanup (3h)
   ├─ CardV2 refactor (3h)
   ├─ Hero + Chips (2h)
   ├─ Grid + Page (2h)
   ├─ Tests + QA (3h)
   └─ Deploy staging (1h)

SEMANA 2 (03-07/03)
├─ SEG-TER 04-05/03: QA + fixes (4h)
└─ QUA 06/03: Deploy produção

Status: 📊 Live em ~1 semana
```

### **OPÇÃO B: Redesign Completo (5 dias dev = 2 sprints)**

```
SEMANA 1 (27/02 - 03/03)
├─ TER 27/02: Validação análise crítica (0.5h)
├─ QUA 28/02: Sprint Planning (1h)
└─ QUI-SEX 01-03/03: Sprint 1 (15.5h)
   ├─ Code cleanup (3h)
   ├─ Hero + Chips (2.5h)
   ├─ CardV2 + LeadCTA (3.5h)
   ├─ Grid + Page integration (4h)
   ├─ API integration + tests (2.5h)

SEMANA 2 (03-07/03)
├─ SEG-TER 04-05/03: Refinamentos S1 (2h)
├─ QUA 06/03: Sprint Planning 2 (1h)
└─ QUI-SEX 07-08/03: Sprint 2 (21.5h)
   ├─ TopRanking + Sponsored (3.5h)
   ├─ Toolbar + LeadModal (5h)
   ├─ Skeletons + Analytics (4h)
   ├─ Dark mode + A11y (4h)
   ├─ Responsividade + Tests (3h)
   └─ Refinamentos (2h)

SEMANA 3 (10-14/03)
├─ SEG-TER 11-12/03: QA + fixes (4h)
├─ QUA 13/03: Staging + perf validation
└─ QUI 14/03: Deploy produção

Status: 📊 Live em ~2.5 semanas (5 dias dev)
```

---

## 🎬 Decision Tree — Próximos Passos

```
                    ┌──── HOJE ────┐
                    │   Análise OK? │
                    └──────┬────────┘
                           │
                  ┌────────┴────────┐
                  │                 │
          ❌ Disagree       ✅ Agree
                  │                 │
              FEEDBACK          ┌───┴─────────┐
              TO TEAM           │             │
                  │       Quick-Win    Completo
                  │           │           │
                  │      ┌─────┴─────┐    │
                  │      │           │    │
                  │   S1 Done   S1+S2 Done
                  │      │           │
                  │  Deploy in   Deploy in
                  │  ~1 week     ~2.5 weeks
```

---

## 📋 What to Do RIGHT NOW (Next 24h)

### Step 1: Read (60 min)
- [ ] ANALISE_CRITICA_CATEGORIES.md (read full)
- [ ] CATEGORY_PAGE_V2_IMPLEMENTATION_PLAN.md (skim for architecture)
- [ ] CATEGORY_PAGE_V2_EXECUTIVE_SUMMARY.md (this section)

### Step 2: Decide (30 min)
- [ ] **A** (Quick-Win 2-3 days) OR **B** (Completo 2 weeks)?
- [ ] Quem vai implementar?
- [ ] Quando start?

### Step 3: Communicate (30 min)
- [ ] Slack/email to team: "Decision is A/B, start Monday"
- [ ] Block calendar: Sprint Planning (if A→1h) or (if B→2h)
- [ ] Notify backend: "Need to prepare X fields by DATE"

---

## 🚀 IF YOU CHOOSE OPTION A (Quick-Win)

### Monday (03/03) Sprint Planning (1h)

**Attendees:** PO, Tech Lead, 1-2 Devs, QA  
**Agenda:**
1. Explain changes (code cleanup + card refactor)
2. Break into 3 tasks:
   - **Dev 1:** Code cleanup + CardV2 refactor (6h)
   - **Dev 2:** Hero + Chips + Grid (5h)
   - **QA:** Setup test plan (2h)
3. Setup branch + CI
4. Go!

### Tue-Fri (04-07/03) Sprint Execution

- **Daily:** 10min standup (blockers?)
- **Wed EOD:** Code review + testing
- **Fri EOD:** Merge to main + deploy to staging

### Next Week (10/03) Deploy

- **Mon-Tue:** QA final validation
- **Wed:** Deploy to production
- **Thu:** Monitor analytics

---

## 🚀 IF YOU CHOOSE OPTION B (Redesign Completo)

### Monday (03/03) Sprint Planning S1 (2h)

**Attendees:** PO, Tech Lead, Dev (1-2), QA, Designer  
**Agenda:**
1. Present full architecture (20 min)
2. Walkthrough stories S1-001 to S1-008 (40 min)
3. Estimate + assign (30 min)
4. Dependencies review (15 min)
5. Go!

### Tue-Fri (04-07/03) Sprint 1 Execution

- **Daily:** 10min standup
- **Wed EOD:** Code review
- **Fri EOD:** Sprint 1 complete (code ready, deploy staging)

### Next Monday (10/03) Sprint 2 Planning (2h)

- Review S1 feedback
- Plan S2-001 to S2-010
- Assign + estimate

### Tue-Fri (11-14/03) Sprint 2 Execution

- Same rhythm
- Fri: All features ready

### Week 3 (17-21/03) QA + Deploy

- **Mon-Tue:** Final QA validation
- **Wed:** Performance audit
- **Thu:** Deploy production
- **Fri:** Monitor + celebrate

---

## 💡 Pro Tips

### If Quick-Win:
```javascript
// Day 1: MUST commit to git
- Remove CategoriesGrid.tsx
- Remove CategoryColumn.tsx
- Remove backups

// Day 1-2: MUST implement
- CompanyCardV2 (height 160px, image 1:1)
- Adjust grid responsive (md: breakpoint)
- Remove "Explorar" button

// Day 2-3: MUST fix
- aria-label on cards
- Contrast WCAG AA
- Test mobile
- Deploy
```

### If Redesign Completo:
```javascript
// Week 1 (Sprint 1): Code foundation
- All 8 components working
- API integration done
- Cards render correctly
- No monetization yet

// Week 2 (Sprint 2): Monetization + polish
- Lead modal ready
- Sponsored section
- Analytics firing
- Dark mode + a11y

// Week 3: QA + Deploy
- E2E tests passing
- Lighthouse 90+
- WCAG AAA
- Production ready
```

---

## 🎯 Success Metrics (After Deploy)

### If Quick-Win:
```
GOAL: UX improvement + code cleanup
MEASURE:
- Lighthouse score: +5 points
- WCAG: AA compliance
- Card height: 160px
- User engagement: TBD
```

### If Redesign Completo:
```
GOAL: Conversão dominante + monetização
MEASURE:
- Card height: 160px
- Lighthouse score: +7 points
- WCAG: AAA compliance
- Lead modal CTR: 3%+
- Lead submit rate: 20%+
- Bounce rate: -2%
- Time on page: +33%
```

---

## 🎓 Decision Frameworks

### RICE Scoring (Effort vs Impact)

**Quick-Win (A):**
- Reach: 100% (all users)
- Impact: Medium (+5 points UX)
- Confidence: High (low risk)
- Effort: 2-3 days
- RICE = (100 × M × H) / 3d = **HIGH priority**

**Redesign Completo (B):**
- Reach: 100% (all users)
- Impact: Large (+7 points + monetization)
- Confidence: High (well planned)
- Effort: 2 weeks
- RICE = (100 × L × H) / 14d = **HIGH priority**

**Both are high priority. Choose based on timeline + team size.**

---

## ❓ FAQ Final

**P: Pode fazer A agora e B depois?**  
R: Sim! A é pré-requisito de B. Mas se fazer A, refaz em B (2h waste). Recomendação: pula direto a B se tempo permite.

**P: Backend precisa estar pronto?**  
R: Para A: não. Para B: sim (campos `direct_lead_enabled`, `direct_lead_url`). Coordene com backend.

**P: Quanto custa em $ terms?**  
R: Quick-Win ~2-3 dev dias (~$1-2K). Completo ~5 dev dias (~$4-6K). ROI esperado: +3-20% conversão (muitos $).

**P: Risk?**  
R: A: baixo risk (componentes isolados). B: médio risk (integração + monetização). Mitigação: testes E2E, staging QA.

**P: Timeline ideal?**  
R: A: ship em 1 semana. B: ship em 2.5 semanas. Ambos realistas.

---

## 🎬 FINAL DECISION FORM

### YOUR CHOICE:

```markdown
## Category Page v2 — Decision Log

**Date:** ____________  
**Decided by:** ____________  

**OPTION CHOSEN:**
- [ ] **A: Quick-Win** (2-3 days, core fixes only)
- [ ] **B: Redesign Completo** (2 weeks, full monetization)
- [ ] **C: Not doing this** (keep as is)

**REASONING:**
_____________________________________________________
_____________________________________________________

**GO DATE:**
- Start: ____________
- Sprint Planning: ____________
- Expected Deploy: ____________

**OWNER ASSIGNMENT:**
- Product: ____________
- Tech Lead: ____________
- Dev Lead: ____________
- QA Lead: ____________

**BACKEND DEPENDENCIES:**
- Need fields by: ____________
- Owner: ____________

**SIGNATURE:**
____________ (PO)  
____________ (Tech Lead)
```

---

## 📞 Next Call to Action

**You have 3 options:**

1. **Email this decision form** → team@slack
2. **Schedule 15min sync** → confirm direction
3. **Start Monday** → if decision already made

---

## 📚 Reference Documents

- ✅ ANALISE_CRITICA_CATEGORIES.md
- ✅ CATEGORY_PAGE_V2_IMPLEMENTATION_PLAN.md  
- ✅ CATEGORY_PAGE_V2_STORIES.md
- ✅ STORY_VALIDATION_CHECKLIST.md
- ✅ CATEGORY_PAGE_V2_EXECUTIVE_SUMMARY.md
- ✅ CATEGORY_PAGE_V2_ROADMAP.md (this file)

---

**Roadmap prepared by:** Technical Product Owner  
**Status:** 🟡 AWAITING YOUR DECISION  
**Next step:** You reply with Option A/B/C

Good luck! 🚀

---
