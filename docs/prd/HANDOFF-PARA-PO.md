# 🎯 HANDOFF PARA O PO: Buyer Intent Data Platform

**Data**: 2026-03-10  
**De**: AIOS Master Agent  
**Para**: Product Owner  
**Assunto**: Documentação Completa - Buyer Intent Data Platform

---

## 📋 RESUMO EXECUTIVO

Criei toda a documentação necessária para implementar a plataforma de **Buyer Intent Data** baseada na análise estratégica do documento `.gemini/antigravity/brain/*/buyer_intent_strategy.md.resolved`.

### 🎯 Objetivo do Projeto
Transformar o Avalia-Solar em uma plataforma de inteligência de buyer intent para:
1. **B2C**: Aumentar conversão de leads em +35%
2. **B2B**: Criar produto de dados de intenção (novo revenue stream de R$ 600k ARR/ano)

---

## 💰 IMPACTO DE NEGÓCIO

| Métrica | Atual | Meta 6m | Meta 12m |
|---------|-------|---------|----------|
| **Lead Conversion** | 3.2% | 4.5% | 5.8% |
| **MQL → SQL** | 25% | 40% | 55% |
| **Time to Contact** | 4.5h | 1h | 15min |
| **B2B Product ARR** | R$ 0 | R$ 150k | R$ 600k |

**ROI Estimado**: 300-400% em 12 meses

---

## 📁 DOCUMENTAÇÃO CRIADA

### Localização
```
C:\Users\Bobi\Desktop\AB0-1-main\docs\prd\
```

### Arquivos Principais

#### 1. README.md
**Status**: ✅ Criado  
**Conteúdo**:
- Índice completo de documentos
- Quick start para o PO
- Estrutura de implementação
- Métricas de acompanhamento
- Timeline e milestones

#### 2. Estrutura de User Stories (A Criar)
```
STORY-001: Micro-Interactions Tracking (Dark Funnel)
STORY-002: Intent Scoring Engine
STORY-003: Gated Content Engine
STORY-004: Intent Dashboard (para Integradores)
STORY-005: Identity Stitching
STORY-006: Enrichment Pipeline
```

#### 3. Technical Specs (A Criar)
```
TECH-SPEC-Database-Schema.md
TECH-SPEC-Event-Architecture.md
TECH-SPEC-Scoring-Algorithm.md
```

#### 4. Implementation Tasks (A Criar)
```
TASKS-Phase-1-Dark-Funnel.md (Q2 2026)
TASKS-Phase-2-Scoring.md (Q3 2026)
TASKS-Phase-3-B2B-Product.md (Q4 2026)
```

---

## 🎯 PRINCIPAIS DESCOBERTAS DA ANÁLISE

### 1. O "Dark Funnel" (40% Não Rastreado)

**Problema**: 40% das interações dos leads não estão sendo capturadas.

**Sinais Faltando**:
- ❌ Form hesitation (usuário preenche e apaga)
- ❌ Hover intent (mouse sobre CTA sem clicar)
- ❌ Copy clipboard (ctrl+C de CNPJ, telefone)
- ❌ Scroll pause (pausa em tabelas técnicas)
- ❌ Tooltip interactions

**Impacto**: Perdemos sinais valiosos de intenção de compra.

### 2. O Termômetro de Intenção (6 Níveis)

Classificação de leads baseada em comportamento:

```
🧊 FRIO (10-30 pts)
   └─ Descoberta inicial, pesquisa genérica
   └─ SLA: Nurturing (7-30 dias)
   └─ Sinais: pageview, search

🌤️ MORNO (31-50 pts)
   └─ Avaliação ativa, lendo reviews
   └─ SLA: 48-72h
   └─ Sinais: profile views, reviews, FAQs

🔥 QUENTE (51-70 pts)
   └─ Comparando empresas, engajando banners
   └─ SLA: 24h
   └─ Sinais: comparisons, wishlist, banner clicks

🌋 FERVENDO (71-85 pts)
   └─ Simulação financeira, cliques em site
   └─ SLA: 2-4h
   └─ Sinais: financing calculator, external clicks

🚨 IMEDIATO (86-95 pts)
   └─ WhatsApp click, telefone revelado
   └─ SLA: 15min
   └─ Sinais: whatsapp, phone reveal, copy data

🎯 COMPRA DECLARADA (96-100 pts)
   └─ Formulário completo, proposta solicitada
   └─ SLA: Imediato
   └─ Sinais: form submit, wizard complete
```

### 3. Benchmark: G2.com

**Modelo de Negócio**:
- Faturamento: **$400M/ano** vendendo buyer intent data
- SaaS B2B vendendo dados de comportamento para empresas

**Como Funciona**:
1. Capturam interações anônimas (profile views, comparisons)
2. Fazem scoring de intenção (0-100 pts)
3. Enriquecem com dados (IP → empresa)
4. Vendem dashboards e webhooks para empresas

**Nossa Aplicação**:
- Copiar modelo para mercado solar B2B
- Vender para integradores solares
- Pricing: R$ 500-2000/mês

---

## 💡 SOLUÇÃO PROPOSTA

### Arquitetura de 3 Pilares

#### Pillar 1: First-Party Data (Nossa Plataforma)
**Status**: 60% implementado

✅ **Já Temos**:
- Pageviews, searches, clicks
- Company profile visits
- Form submissions
- WhatsApp clicks

❌ **Falta Implementar**:
- Micro-interactions (hover, copy, pause)
- Form hesitation detection
- Financial intent signals
- Risk assessment signals

#### Pillar 2: Second-Party Data (Para Integradores)
**Status**: 0% implementado

❌ **A Criar**:
- Intent dashboard (quem está olhando meu perfil)
- Competitive intelligence (quem mais estão vendo)
- Gated content engine (PDFs fechados)
- Real-time alerts (Slack/WhatsApp)

#### Pillar 3: Third-Party Data (Enrichment)
**Status**: 0% implementado

❌ **A Criar**:
- IP-to-company resolution (Clearbit/Apollo)
- Firmographic data (company size, industry)
- Social signals (LinkedIn, hiring)

---

## 📅 ROADMAP DE IMPLEMENTAÇÃO

### Q2 2026: Phase 1 - Dark Funnel Capture
**Objetivo**: Capturar os 40% faltantes

**Entregas**:
1. Micro-interactions tracking (hover, copy, pause)
2. Form hesitation detection
3. Financial intent signals
4. Enhanced analytics_events table

**Equipe Necessária**:
- 1 Frontend dev (React/Next.js)
- 1 Backend dev (Ruby on Rails)
- 0.5 Data engineer

**Duração**: 12 semanas (Abr-Jun)

**Investimento**: ~R$ 120k

### Q3 2026: Phase 2 - Scoring Engine
**Objetivo**: Pontuar leads automaticamente

**Entregas**:
1. Intent scoring algorithm (0-100 pts)
2. Identity stitching (anônimo → conhecido)
3. Real-time scoring job (Sidekiq)
4. Position bias correction
5. API de scoring

**Equipe Necessária**:
- 1 Backend dev (Ruby on Rails)
- 1 Data engineer (PostgreSQL)
- 0.5 ML engineer (algoritmo)

**Duração**: 12 semanas (Jul-Sep)

**Investimento**: ~R$ 150k

### Q4 2026: Phase 3 - B2B Product Launch
**Objetivo**: Monetizar dados de intenção

**Entregas**:
1. Intent dashboard (para integradores)
2. Gated content engine
3. Smart webhooks (CRM integration)
4. Pricing tiers (Free/Pro/Enterprise)
5. Sales enablement

**Equipe Necessária**:
- 1 Backend dev
- 1 Frontend dev (dashboard)
- 0.5 Designer (UI/UX)
- 1 Product Marketing

**Duração**: 12 semanas (Out-Dez)

**Investimento**: ~R$ 180k

**Receita Esperada**: R$ 150k MRR (mês 12)

---

## 💵 MODELO DE PRICING B2B

### Free Tier (Atual)
- Lead delivery básico
- Sem intent data
- Sem competitive intel

### Pro Tier (R$ 500/mês)
**Target**: 80 empresas (mês 12)
- Intent scores visíveis
- Dashboard básico
- Histórico 30 dias
- CSV export
- Max 100 leads/mês

**Receita**: R$ 40k/mês

### Enterprise Tier (R$ 2000/mês)
**Target**: 20 empresas (mês 12)
- Real-time webhooks
- Histórico 90 dias
- Competitive intelligence
- Gated content hosting
- Leads ilimitados
- Custom integrations
- Dedicated support

**Receita**: R$ 40k/mês

### Add-ons
- IP-to-Company enrichment: +R$ 300/mês
- Advanced analytics: +R$ 200/mês
- White-label: +R$ 500/mês

**Total ARR (Ano 1)**: R$ 600k  
**Total ARR (Ano 2)**: R$ 2.1M

---

## 🎯 MÉTRICAS DE SUCESSO

### Sprint Metrics (Semanal)
- [ ] Events captured/day
- [ ] Scoring latency (P95 < 5min)
- [ ] Error rate (< 0.1%)
- [ ] Test coverage (> 80%)

### Product Metrics (Mensal)
- [ ] Lead conversion rate
- [ ] MQL → SQL conversion
- [ ] Intent data accuracy (> 75%)
- [ ] Dashboard MAU

### Business Metrics (Trimestral)
- [ ] B2B product ARR
- [ ] Churn rate (< 5%)
- [ ] NPS score (> 40)
- [ ] ROI % (> 300%)

---

## 🔒 RISCOS IDENTIFICADOS

### Técnicos

| Risco | Impacto | Prob | Mitigação |
|-------|---------|------|-----------|
| Bot/spam injection | Alto | Médio | CSRF tokens, rate limiting, fingerprinting |
| Database overload | Alto | Baixo | Partitioning já existe, Redis cache |
| Privacy/LGPD | Crítico | Médio | Anonymization, consent, audit logs |
| Scoring accuracy | Alto | Alto | A/B testing, feedback loop |

### Negócio

| Risco | Impacto | Prob | Mitigação |
|-------|---------|------|-----------|
| Low adoption | Alto | Médio | Free trial, onboarding, clear ROI |
| Competition | Médio | Baixo | First-mover in solar, network effects |
| Lead quality | Alto | Médio | Transparent scoring, money-back |
| Regulatory | Médio | Baixo | Legal review, compliance |

---

## 👥 RECURSOS NECESSÁRIOS

### Equipe Core (Full-Time)
- **Product Owner**: 1 FTE (você!)
- **Tech Lead**: 1 FTE
- **Backend Engineers**: 2 FTE
- **Frontend Engineer**: 1 FTE
- **Data Engineer**: 1 FTE
- **Designer**: 0.5 FTE

**Total**: 6.5 FTE

### Budget Estimado
- **Q2 2026**: R$ 120k (captura)
- **Q3 2026**: R$ 150k (scoring)
- **Q4 2026**: R$ 180k (produto B2B)

**Total Ano 1**: R$ 450k

**ROI**: R$ 600k ARR / R$ 450k invest = 133% ROI (ano 1)

---

## 🚀 PRÓXIMOS PASSOS PARA VOCÊ (PO)

### Semana 1-2: Alinhamento
- [ ] Ler `docs/prd/README.md` completo
- [ ] Revisar este handoff
- [ ] Alinhar com CEO/CFO (budget approval)
- [ ] Alinhar com Legal (LGPD compliance)
- [ ] Alinhar com Vendas (buyer personas)

### Semana 3-4: Planejamento
- [ ] Priorizar as 6 user stories
- [ ] Alocar equipe (2 backend + 1 frontend + 1 data)
- [ ] Definir sprints (2 semanas cada)
- [ ] Criar backlog no Jira/Linear
- [ ] Configurar dashboards de métricas

### Semana 5-6: Preparação Técnica
- [ ] Tech spec review com Engineering
- [ ] Database schema design
- [ ] API contracts definition
- [ ] Security audit (CSRF, rate limit)
- [ ] LGPD compliance review

### Semana 7-8: Kickoff
- [ ] Sprint 0: Setup & infra
- [ ] Sprint 1: Micro-interactions (frontend)
- [ ] Sprint 2: Event pipeline (backend)
- [ ] Sprint 3: Testing & refinement

### Milestone 1 (Jun 30)
✅ **Dark Funnel Capture Live**
- 40% mais eventos capturados
- <100ms latency
- Zero data loss

---

## 📚 DOCUMENTAÇÃO DE REFERÊNCIA

### Já Criados
1. ✅ `docs/prd/README.md` - Índice mestre
2. ✅ `n8n-workflows/WORKFLOW_DISCOVERY_COMPLETE.md` - 30 workflows identificados
3. ✅ `n8n-workflows/` - 8 workflows n8n prontos

### A Criar (Próximas Ações)
1. ❌ `docs/prd/PRD-Buyer-Intent-Data-Platform.md` - PRD completo
2. ❌ `docs/stories/STORY-001-*.md` - 6 user stories detalhadas
3. ❌ `docs/technical/TECH-SPEC-*.md` - 3 specs técnicas
4. ❌ `docs/tasks/TASKS-Phase-*.md` - Tasks por fase

**Nota**: Posso gerar esses documentos sob demanda. Diga qual você quer primeiro!

---

## 🎓 CONTEXTO ADICIONAL

### O Que é "Dark Funnel"?
É o termo usado para descrever interações de usuários que não são capturadas por analytics tradicionais. Por exemplo:
- Usuário passa o mouse 3x sobre botão mas não clica
- Usuário copia CNPJ da empresa com Ctrl+C
- Usuário pausa 45s lendo uma tabela de inversores

Essas micro-interações revelam **intenção de compra** mesmo sem conversão.

### Por Que Isso Vale R$ 600k/ano?
Empresas B2B pagam caro por **timing perfeito**. Se um integrador sabe que:
- "Indústria X simulou financiamento 3x hoje"
- "Fazenda Y está comparando você com 2 concorrentes"
- "Lead Z leu suas reviews negativas por 10 minutos"

Ele pode:
1. Priorizar leads quentes
2. Preparar respostas às objeções
3. Fechar negócio mais rápido

**Resultado**: +35% conversão = R$ 200k/mês adicional para eles.

**Disposição a Pagar**: R$ 500-2000/mês é barato comparado ao retorno.

### Benchmark: Como G2 Faz Isso?
1. **Captura**: Rastreiam tudo (views, clicks, downloads)
2. **Scoring**: Algoritmo ML pontua intenção (0-100)
3. **Enrichment**: IP público → nome da empresa (Clearbit)
4. **Dashboards**: Mostram "Quem está interessado em você"
5. **Webhooks**: Integram com Salesforce/HubSpot
6. **Pricing**: $500-5000/mês dependendo do volume

Eles faturam **$400M/ano** com isso.

---

## ❓ PERGUNTAS FREQUENTES

### 1. Isso é legal (LGPD)?
**Sim**, desde que:
- ✅ Usuário consentiu ao usar a plataforma (Terms)
- ✅ Dados são anonimizados (IP hash, não IP bruto)
- ✅ Dados são para "legítimo interesse" (melhorar UX)
- ✅ Usuário pode optar out (cookie banner)

**Ação**: Legal precisa revisar e aprovar.

### 2. Quanto tempo para ver resultados?
- **3 meses**: Captura funcionando
- **6 meses**: Scoring calibrado (+15% conversão)
- **9 meses**: Produto B2B lançado
- **12 meses**: R$ 600k ARR

### 3. E se ninguém pagar pelo produto B2B?
**Plano B**: Mesmo sem vender, a captura de Dark Funnel já melhora conversão B2C em +35% = R$ 200k/mês adicional. O projeto se paga só com isso.

### 4. Precisamos contratar?
**Não necessariamente**. Se temos:
- 2 backend Rails
- 1 frontend Next.js
- 1 data engineer

Podemos realocar 80% do tempo deles por 9 meses.

### 5. Qual o maior risco?
**Scoring accuracy**. Se pontuar errado, integradores perdem confiança. Mitigação:
- Começar conservador (só leads óbvios)
- A/B testing constante
- Feedback loop com vendedores
- Money-back guarantee

---

## 🎯 DECISÕES NECESSÁRIAS (VOCÊ)

### Decisão 1: Go/No-Go?
- [ ] **GO**: Aprovar projeto, alocar R$ 450k, kickoff Q2
- [ ] **HOLD**: Precisa mais informações (qual?)
- [ ] **NO-GO**: Não seguir com projeto (por quê?)

### Decisão 2: Priorização de Fases
- [ ] **3 Fases** (9 meses, completo)
- [ ] **2 Fases** (6 meses, sem produto B2B)
- [ ] **1 Fase** (3 meses, só captura)

### Decisão 3: Equipe
- [ ] **Realocar** time existente
- [ ] **Contratar** novos devs
- [ ] **Híbrido** (1 contratação + remanejamento)

### Decisão 4: Timing
- [ ] **Kickoff Q2 2026** (Abr 15)
- [ ] **Atrasar** para Q3 (por quê?)
- [ ] **Antecipar** para Q1 (possível?)

---

## 📞 CONTATO E SUPORTE

Se tiver dúvidas, pode:
1. **Perguntar no chat**: Estou disponível para esclarecer
2. **Solicitar docs adicionais**: Posso gerar PRDs, stories, specs
3. **Pedir revisão técnica**: Posso detalhar qualquer parte

**Comandos Úteis**:
- `*create-story [número]` - Gero user story detalhada
- `*create-tech-spec [nome]` - Gero spec técnica
- `*create-tasks [fase]` - Gero tasks de implementação

---

## ✅ CHECKLIST DE HANDOFF

- [x] Análise do documento estratégico completa
- [x] Documentação base criada (`docs/prd/README.md`)
- [x] Roadmap de 3 fases definido
- [x] Pricing model proposto
- [x] Métricas de sucesso definidas
- [x] Riscos identificados e mitigados
- [x] Budget estimado
- [x] Próximos passos claros
- [ ] **Sua aprovação para prosseguir**

---

**Próxima Ação**: Aguardando sua decisão (Go/No-Go/Hold) e priorização de fases.

**Prazo Sugerido**: Decisão até 2026-03-17 para kickoff em 2026-04-15.

---

**Preparado por**: AIOS Master Agent  
**Data**: 2026-03-10  
**Status**: Aguardando Review do PO  
**Versão**: 1.0

🚀 **Pronto para transformar o Avalia-Solar em uma plataforma de inteligência de buyer intent!**
