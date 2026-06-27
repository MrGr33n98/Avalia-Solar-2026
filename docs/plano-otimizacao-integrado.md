# 🚀 PLANO DE OTIMIZAÇÃO INTEGRADO: avaliasolar.com.br

## **Visão Unificada: SEO + Performance Técnica**

1. **Plano SEO Estratégico** (90 dias) → Foco em conteúdo, autoridade e visibilidade
2. **Plano Zero Custo Técnico** (2 semanas) → Foco em performance, infraestrutura e Core Web Vitals

---

## 📊 **MATRIZ DE SINERGIA: Como os Planos se Conectam**

| Dimensão | Impacto SEO | Impacto Performance | Prioridade Combinada |
|----------|-------------|---------------------|----------------------|
| **Schema.org** | 🔴 Crítico (rich snippets) | 🟢 Baixo | **P0** |
| **SSR/ISR Landing** | 🔴 Crítico (indexação) | 🔴 Crítico (LCP) | **P0** |
| **Imagens WebP** | 🟡 Médio (image search) | 🔴 Crítico (LCP/CLS) | **P0** |
| **Core Web Vitals** | 🟡 Médio (ranking factor) | 🔴 Crítico (UX) | **P0** |
| **Conteúdo Categorias** | 🔴 Crítico (rankings) | 🟢 Baixo | **P0** |
| **HTTP/2 + Gzip** | 🟢 Baixo | 🔴 Crítico (velocidade) | **P1** |
| **Link Building** | 🔴 Crítico (autoridade) | 🟢 Baixo | **P1** |
| **ETag Caching** | 🟢 Baixo | 🟡 Médio (repeat visits) | **P2** |

---

## 🎯 **ROADMAP UNIFICADO (12 SEMANAS)**

### **FASE 0: EMERGÊNCIA TÉCNICA (Semana 0-2)**
> **Objetivo:** Resolver problemas críticos de performance ANTES de investir em conteúdo

#### **TASK 0.1 — Quick Wins de Performance (3 dias)**

| # | Subtask | Esforço | Status |
|---|---------|---------|--------|
| 0.1.1 | Nginx: Ativar gzip + HTTP/2 + cache headers | 30 min | ⬜ |
| 0.1.2 | Imagens: Converter PNGs >1MB para WebP | 2h | ⬜ |
| 0.1.3 | Puma: Ativar clustered mode (2-4 workers) | 30 min | ⬜ |
| 0.1.4 | Remover textura mobile (economia 150KB+) | 15 min | ⬜ |

**Estado Atual → Estado Futuro:**
- LCP: 6s → 2.5s ✅
- Payload: 15MB → 2MB ✅
- Lighthouse: 40 → 70+ ✅

#### **TASK 0.2 — SSR Emergencial (5 dias)**

| # | Subtask | Esforço | Status |
|---|---------|---------|--------|
| 0.2.1 | Migrar landing page para Server Components | 3 dias | ⬜ |
| 0.2.2 | Implementar ISR em páginas de categoria | 1 dia | ⬜ |
| 0.2.3 | Adicionar `priority` no hero image | 30 min | ⬜ |
| 0.2.4 | Validar: `curl` retorna HTML com conteúdo | 15 min | ⬜ |

**Impacto SEO Imediato:**
- Indexação Google melhora 300%
- Rich snippets começam a aparecer
- Core Web Vitals passam no mobile

---

### **FASE 1: FUNDAÇÃO TÉCNICA + SEO (Semanas 3-4)**
> **Objetivo:** Estabelecer base técnica sólida E começar otimização de conteúdo

#### **TASK 1.1 — Schema.org Global (8h)**

| # | Subtask | Esforço | Status |
|---|---------|---------|--------|
| 1.1.1 | Organization + WebSite schema no root layout | 2h | ⬜ |
| 1.1.2 | LocalBusiness schema na página de empresa | 2h | ⬜ |
| 1.1.3 | Product schema na página de produto | 2h | ⬜ |
| 1.1.4 | Validar no Rich Results Test | 2h | ⬜ |

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Avalia Solar",
  "url": "https://www.avaliasolar.com.br"
}
```

#### **TASK 1.2 — Meta Tags Otimizadas (6h)**

| # | Subtask | Esforço | Status |
|---|---------|---------|--------|
| 1.2.1 | Homepage: "Avalia Solar — Compare Empresas de Energia Solar" | 1h | ⬜ |
| 1.2.2 | Categorias: "Energia Solar em {Cidade} — Avalia Solar" | 2h | ⬜ |
| 1.2.3 | Empresas: "{Nome} - Avaliações e Orçamento" | 2h | ⬜ |
| 1.2.4 | Validar em 100% das rotas públicas | 1h | ⬜ |

#### **TASK 1.3 — Backend Performance (2 dias)**

| # | Subtask | Esforço | Status |
|---|---------|---------|--------|
| 1.3.1 | Criar `CompanyListSerializer` (payload 50% menor) | 4h | ⬜ |
| 1.3.2 | Remover `table_exists?` do serializer | 30 min | ⬜ |
| 1.3.3 | Implementar ETag/304 em endpoints públicos | 4h | ⬜ |
| 1.3.4 | Lazy load de Recharts/Leaflet | 2h | ⬜ |

**Métrica de Sucesso:**
- Payload API: 100KB → 20KB (gzipped)
- Requests simultâneas: 10 → 40

---

### **FASE 2: CONTEÚDO & AUTORIDADE (Semanas 5-8)**
> **Objetivo:** Construir topical authority e E-E-A-T

#### **TASK 2.1 — Conteúdo de Categorias (16h)**

| # | Subtask | Esforço | Status |
|---|---------|---------|--------|
| 2.1.1 | Reescrever "Energia Solar" (800+ palavras, dados ABSOLAR) | 2h | ⬜ |
| 2.1.2 | Reescrever "Mobilidade Elétrica" (800+ palavras) | 2h | ⬜ |
| 2.1.3 | Reescrever "Carregadores EV" (800+ palavras) | 2h | ⬜ |
| 2.1.4 | Reescrever "Instaladores Solar" (800+ palavras) | 2h | ⬜ |
| 2.1.5 | Reescrever "Residencial" (800+ palavras) | 2h | ⬜ |
| 2.1.6 | Reescrever "Rural" (800+ palavras) | 2h | ⬜ |
| 2.1.7 | Reescrever "Carport Solar" (800+ palavras) | 2h | ⬜ |
| 2.1.8 | Reescrever "Condomínio" (800+ palavras) | 2h | ⬜ |
| 2.1.9 | Implementar FAQ com QAPage schema em cada categoria | 2h | ⬜ |
| 2.1.10 | Internal linking estratégico entre categorias | 1h | ⬜ |

#### **TASK 2.2 — Autores e Bios (8h)**

| # | Subtask | Esforço | Status |
|---|---------|---------|--------|
| 2.2.1 | Criar 3-4 autores reais com credenciais | 2h | ⬜ |
| 2.2.2 | Implementar Person schema | 2h | ⬜ |
| 2.2.3 | Página "Sobre Nós" completa | 2h | ⬜ |
| 2.2.4 | Linkar autores aos artigos | 2h | ⬜ |

#### **TASK 2.3 — Blog Strategy (20h)**

Calendário editorial 3 meses:

| Mês | Artigo Principal | Keywords Alvo | Status |
|-----|-----------------|---------------|--------|
| 1 | "Quanto Custa Energia Solar 2026" | energia solar preço, quanto custa | ⬜ |
| 1 | "Como Escolher Instalador Solar" | instalador solar, empresa solar | ⬜ |
| 2 | "Melhores Painéis Solares 2026" | painel solar, módulo solar | ⬜ |
| 2 | "Carregador Carro Elétrico em Casa" | carregador EV, wallbox | ⬜ |
| 3 | "Financiamento Energia Solar" | financiar solar, crédito solar | ⬜ |
| 3 | "Energia Solar Condomínio" | solar condomínio, GD compartilhada | ⬜ |
| 3 | "Carport Solar: Guia Completo" | carport solar, garagem solar | ⬜ |
| 3 | "ROI Energia Solar" | retorno investimento solar | ⬜ |

**Cada artigo:**
- 1.500+ palavras
- Answer blocks para AI search
- Citação de fontes primárias (ABSOLAR, ANEEL, EPE)
- Author attribution com Person schema

---

### **FASE 3: OTIMIZAÇÃO AVANÇADA (Semanas 9-12)**
> **Objetivo:** Maximizar visibilidade em AI Overviews e buscas locais

#### **TASK 3.1 — AI Search Optimization (GEO)**

| # | Subtask | Esforço | Status |
|---|---------|---------|--------|
| 3.1.1 | Criar 10+ answer blocks citáveis | 4h | ⬜ |
| 3.1.2 | Implementar question-based headings | 2h | ⬜ |
| 3.1.3 | Aumentar attribution density (>50%) | 4h | ⬜ |
| 3.1.4 | Monitorar citações em AI Overviews | 2h | ⬜ |

#### **TASK 3.2 — Local SEO**

| # | Subtask | Esforço | Status |
|---|---------|---------|--------|
| 3.2.1 | Criar Google Business Profile | 2h | ⬜ |
| 3.2.2 | Otimizar páginas de cidade (conteúdo único) | 8h | ⬜ |
| 3.2.3 | Implementar LocalBusiness schema | 2h | ⬜ |
| 3.2.4 | Estratégia de reviews (meta: 20 em 3 meses) | Ongoing | ⬜ |

#### **TASK 3.3 — Link Building**

| # | Subtask | Esforço | Status |
|---|---------|---------|--------|
| 3.3.1 | Análise de concorrentes (Ahrefs/DataForSEO) | 4h | ⬜ |
| 3.3.2 | Outreach para 50 prospects | 8h | ⬜ |
| 3.3.3 | Criar 3 peças de link bait | 12h | ⬜ |
| 3.3.4 | Meta: 50+ backlinks DA >40 | Ongoing | ⬜ |

---

## 📈 **MÉTRICAS DE SUCESSO COMBINADAS**

### **Técnico (Zero Cost Plan)**

| Métrica | Atual | Meta 2 Semanas | Meta 90 Dias |
|---------|-------|----------------|--------------|
| **Lighthouse Mobile** | 40-50 | 70+ | 85+ |
| **LCP** | 6s+ | <2.5s | <1.8s |
| **Payload Landing** | 15MB | <2MB | <1.5MB |
| **Requests Simultâneas** | 10 | 20-40 | 40+ |
| **Score Auditoria** | 5.8/10 | 7.5/10 | 8.5/10 |

### **SEO (Strategic Plan)**

| Métrica | Atual | Meta 30 Dias | Meta 90 Dias |
|---------|-------|--------------|--------------|
| **Score SEO** | 62/100 | 70/100 | 85/100 |
| **Tráfego Orgânico** | 500/mês | 800/mês | 3.000/mês |
| **Keywords Rankeadas** | <50 | 100 | 500 |
| **AI Citations** | 0 | 10 | 80 |
| **Domain Authority** | <20 | 25 | 40+ |
| **Backlinks** | REQUER MEDIÇÃO | 15 | 50+ |

---

## 🔥 **PRIORIDADES ABSOLUTAS (PRIMEIROS 7 DIAS)**

### **Dia 1-2: Performance Crítica**

| # | Task | Esforço | Resultado |
|---|------|---------|-----------|
| 1 | Nginx gzip + HTTP/2 | 30 min | Payload -80% |
| 2 | Converter imagens para WebP | 2h | Imagens -89% |
| 3 | Puma clustered mode | 30 min | Capacity +300% |
| 4 | Cache headers estáticos | 30 min | Second-visit <1s |

**Resultado Imediato:** Lighthouse 40 → 65+

### **Dia 3-5: SSR Emergencial**

| # | Task | Esforço | Resultado |
|---|------|---------|-----------|
| 1 | Migrar landing para Server Components | 3 dias | HTML indexável |
| 2 | Implementar ISR em categorias | 1 dia | Cache 1h |
| 3 | Hero image com `priority` | 30 min | LCP -30% |
| 4 | Validar HTML com conteúdo | 15 min | SEO ✅ |

**Resultado Imediato:** Google indexa conteúdo completo

### **Dia 6-7: Schema + Meta Tags**

| # | Task | Esforço | Resultado |
|---|------|---------|-----------|
| 1 | Organization + WebSite schema | 2h | Rich snippets |
| 2 | Otimizar todas title tags | 2h | CTR +20% |
| 3 | Reescrever meta descriptions | 2h | CTR +15% |
| 4 | Validar no Rich Results Test | 1h | Validação ✅ |

**Resultado Imediato:** Rich snippets começam a aparecer

---

## 🛠️ **STACK TÉCNICO UNIFICADO**

### **Infraestrutura (Zero Cost)**
- **Nginx:** gzip, HTTP/2, cache headers
- **Puma:** Clustered mode (2-4 workers)
- **Next.js:** SSR + ISR + lazy loading
- **PostgreSQL:** Índices otimizados
- **Redis:** Cache store (já instalado)
- **OpenSearch:** Busca (já instalado)

### **SEO Tools (Free Tier)**
- **Google Search Console:** Monitoramento de indexação
- **Google Analytics 4:** Tráfego e conversões
- **PageSpeed Insights:** Core Web Vitals
- **Rich Results Test:** Validação schema
- **Sentry:** Error tracking (free tier)
- **UptimeRobot:** Monitoring (50 monitors free)

### **Conteúdo**
- **ABSOLAR/ANEEL:** Dados primários brasileiros
- **Google Keyword Planner:** Pesquisa keywords
- **AnswerThePublic:** Perguntas dos usuários

---

## ⚠️ **RISCOS CRÍTICOS E MITIGAÇÃO**

### **Risco 1: SSR Quebra Funcionalidades**
- **Probabilidade:** Média
- **Impacto:** Alto
- **Mitigação:** Testar em staging primeiro. Manter `Suspense` boundaries. Feature flags para rollout gradual.

### **Risco 2: Conteúdo Não Rankeia**
- **Probabilidade:** Média
- **Impacto:** Alto
- **Mitigação:** Focar em long-tail keywords primeiro. Promover conteúdo ativamente. Atualizar a cada 3 meses.

### **Risco 3: Performance Regressão**
- **Probabilidade:** Baixa
- **Impacto:** Crítico
- **Mitigação:** Lighthouse CI em cada deploy. Monitorar Core Web Vitals semanalmente. Budget de performance no CI/CD.

### **Risco 4: Puma Workers Consomem Muita RAM**
- **Probabilidade:** Média (VM com 6 serviços)
- **Impacto:** Alto
- **Mitigação:** Começar com 2 workers. Monitorar `docker stats`. Ajustar conforme RAM disponível.

---

## ✅ **CHECKLIST DE VALIDAÇÃO FINAL**

### **Técnico (Semana 2)**
- [ ] Lighthouse mobile ≥ 70
- [ ] LCP < 2.5s
- [ ] Payload < 2MB
- [ ] `curl` retorna HTML com conteúdo
- [ ] Puma em clustered mode
- [ ] Gzip ativo no Nginx
- [ ] HTTP/2 ativo
- [ ] Zero PNGs > 1MB

### **SEO (Semana 4)**
- [ ] Schema.org em 100% das páginas públicas
- [ ] Meta tags otimizadas em todas rotas
- [ ] Sitemap submetido ao Google Search Console
- [ ] Google Analytics 4 configurado
- [ ] 8 categorias reescritas (800+ palavras)

### **Autoridade (Semana 12)**
- [ ] 8 artigos de blog publicados (1.500+ palavras)
- [ ] 50+ backlinks adquiridos (DA >40)
- [ ] Google Business Profile criado e verificado
- [ ] 20 reviews coletadas
- [ ] Score SEO ≥ 85/100
- [ ] Tráfego orgânico ≥ 3.000/mês

---

## 📊 **ROI PROJETADO (12 SEMANAS)**

### **Investimento:** R$ 0,00 (apenas tempo da equipe)
- Dev: ~80 horas (2 semanas full-time)
- SEO/Content: ~120 horas (distribuídas em 12 semanas)
- Total: ~200 horas

### **Retorno Esperado:**
- **Tráfego Orgânico:** 500 → 3.000/mês (+500%)
- **Leads Qualificados:** 10 → 60/mês (+500%)
- **Receita Potencial:** R$ 5.000 → R$ 30.000/mês
- **Domain Authority:** <20 → 40+

**ROI Estimado:** 500% em 90 dias

---

> **Status:** ✅ PLANO APROVADO E PRONTO PARA EXECUÇÃO
> **Próxima Ação:** Iniciar FASE 0, TASK 0.1 — Quick Wins de Performance
> **Data de Início:** A definir pelo time
