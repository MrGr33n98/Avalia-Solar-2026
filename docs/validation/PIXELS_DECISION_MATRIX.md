# 🎯 DECISÃO DE PIXELS AUSENTES - META, LINKEDIN, GOOGLE ADS

**Projeto:** Avalia Solar  
**Data:** 2026-03-05  
**Owner:** Head of Marketing + Data Engineer  
**Status:** 🔴 DECISÃO PENDENTE

---

## SUMÁRIO EXECUTIVO

Três pixels estratégicos estão ausentes:
1. **Meta Pixel** (Facebook/Instagram Ads)
2. **LinkedIn Insight Tag** (LinkedIn Ads)
3. **Google Ads Conversion Tracking** (Google Ads)

**Impacto estimado:** ~$15k/mês em perda de ROI por falta de otimização de campanhas.

---

## 1. META PIXEL (Facebook/Instagram)

### 1.1 Decisão Requerida

**IMPLEMENTAR OU EXCEÇÃO DE RISCO?**

- [ ] **IMPLEMENTAR** - Prazo: _____ / Owner: _____
- [ ] **EXCEÇÃO DE RISCO** - Justificativa: _____

---

### 1.2 Business Case

**Investimento Atual em Meta Ads:** $______/mês (verificar)

**ROI Esperado com Pixel:**
- Retargeting de visitantes: +25% conversão
- Lookalike audiences: +40% ROAS
- Otimização automática de lances: +15% eficiência
- **Total estimado:** +$10k/mês em receita

**Custo de Implementação:**
- Desenvolvimento: 8 horas (~$800)
- QA: 4 horas (~$400)
- **Total:** ~$1,200

**Payback:** ~3 dias

---

### 1.3 Detalhes Técnicos

**Pixel ID:** A definir (obter do Meta Business Manager)

**Implementação:**

```typescript
// components/MetaPixel.tsx
'use client';

import Script from 'next/script';
import { useEffect } from 'react';
import { hasMarketingConsent } from '@/lib/analytics/consent';

export default function MetaPixel() {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  
  if (!pixelId) return null;
  
  useEffect(() => {
    if (!hasMarketingConsent()) return;
    
    // @ts-ignore
    window.fbq('init', pixelId);
    window.fbq('track', 'PageView');
  }, [pixelId]);
  
  return (
    <>
      <Script
        id="meta-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
          `
        }}
      />
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  );
}
```

**Eventos a implementar:**
- [x] PageView (base)
- [ ] ViewContent (company profile)
- [ ] Lead (lead submission)
- [ ] AddToWishlist (favorites)
- [ ] Search (search bar)

---

### 1.4 Riscos se NÃO Implementar

| Risco | Probabilidade | Impacto | Custo Anual |
|-------|---------------|---------|-------------|
| CAC 40% maior | ALTO | ALTO | ~$120k |
| Sem retargeting | CERTO | MÉDIO | ~$60k |
| Competitor advantage | ALTO | ALTO | Incalculável |

**Total estimado:** $180k/ano em perda de eficiência

---

### 1.5 Exceção de Risco (se não implementar)

```markdown
## Registro de Exceção de Risco

**ID:** RISK-2026-001  
**Data:** [Data da decisão]  
**Risco:** Perda de eficiência em campanhas Meta Ads por ausência de pixel

**Justificativa:**
[Preencher se decidir NÃO implementar]

**Mitigações alternativas:**
- [ ] Aumentar orçamento de teste (+20%)
- [ ] Usar apenas targeting amplo (menor precisão)
- [ ] Focar em outros canais (Google, LinkedIn)

**Aprovado por:**
- Head of Marketing: _______________
- CFO: _______________
- Data Engineer: _______________

**Revisão:** Trimestral
```

---

## 2. LINKEDIN INSIGHT TAG

### 2.1 Decisão Requerida

**IMPLEMENTAR OU EXCEÇÃO DE RISCO?**

- [ ] **IMPLEMENTAR** - Prazo: _____ / Owner: _____
- [ ] **EXCEÇÃO DE RISCO** - Justificativa: _____

---

### 2.2 Business Case

**Investimento Atual em LinkedIn Ads:** $______/mês (verificar)

**Público-alvo:**
- Empresas instaladoras (B2B)
- Decisores de energia solar
- Engenheiros e arquitetos

**ROI Esperado com Tag:**
- Retargeting de visitantes B2B: +30% conversão
- Lookalike de empresas: +35% ROAS
- Otimização de lances: +20% eficiência
- **Total estimado:** +$5k/mês em receita

**Custo de Implementação:**
- Desenvolvimento: 4 horas (~$400)
- QA: 2 horas (~$200)
- **Total:** ~$600

**Payback:** ~4 dias

---

### 2.3 Detalhes Técnicos

**Partner ID:** A definir (obter do LinkedIn Campaign Manager)

**Implementação:**

```typescript
// components/LinkedInInsightTag.tsx
'use client';

import Script from 'next/script';
import { useEffect } from 'react';
import { hasMarketingConsent } from '@/lib/analytics/consent';

export default function LinkedInInsightTag() {
  const partnerId = process.env.NEXT_PUBLIC_LINKEDIN_PARTNER_ID;
  
  if (!partnerId) return null;
  
  return (
    <Script
      id="linkedin-insight"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          _linkedin_partner_id = "${partnerId}";
          window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
          window._linkedin_data_partner_ids.push(_linkedin_partner_id);
          
          (function(l) {
            if (!l){window.lintrk = function(a,b){window.lintrk.q.push([a,b])};
            window.lintrk.q=[]}
            var s = document.getElementsByTagName("script")[0];
            var b = document.createElement("script");
            b.type = "text/javascript";b.async = true;
            b.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
            s.parentNode.insertBefore(b, s);
          })(window.lintrk);
        `
      }}
    />
  );
}
```

**Eventos a implementar:**
- [x] PageView (base)
- [ ] Lead (lead submission)
- [ ] CompanyProfileView

---

### 2.4 Riscos se NÃO Implementar

| Risco | Probabilidade | Impacto | Custo Anual |
|-------|---------------|---------|-------------|
| Perda de leads B2B qualificados | MÉDIO | ALTO | ~$40k |
| Sem otimização de campanhas | CERTO | MÉDIO | ~$20k |

**Total estimado:** $60k/ano

---

## 3. GOOGLE ADS CONVERSION TRACKING

### 3.1 Decisão Requerida

**IMPLEMENTAR OU EXCEÇÃO DE RISCO?**

- [ ] **IMPLEMENTAR** - Prazo: _____ / Owner: _____
- [ ] **EXCEÇÃO DE RISCO** - Justificativa: _____

---

### 3.2 Business Case

**Investimento Atual em Google Ads:** $______/mês (verificar)

**ROI Esperado com Conversion Tracking:**
- Otimização automática de lances (Smart Bidding): +25% eficiência
- Exclusão de keywords não convertem: +15% economia
- Melhor atribuição: +10% conversões detectadas
- **Total estimado:** +$8k/mês em receita

**Custo de Implementação:**
- Via GTM (já existe): 2 horas (~$200)
- Enhanced Conversions (backend): 12 horas (~$1,200)
- **Total:** ~$1,400

**Payback:** ~5 dias

---

### 3.3 Detalhes Técnicos

**Conversion ID:** A definir (obter do Google Ads)  
**Conversion Label:** A definir (obter do Google Ads)

**Implementação via GTM:**

```markdown
## GTM Tag Configuration

**Tag Name:** Google Ads - Lead Conversion

**Tag Type:** Google Ads Conversion Tracking

**Configuration:**
- Conversion ID: AW-XXXXXXXXXX
- Conversion Label: xxxxxxxxxxxxxx
- Conversion Value: Dynamic ({{Lead Value}})
- Transaction ID: {{Event ID}} (para dedupe)

**Trigger:**
- Custom Event: lead_submitted

**Variables:**
- Lead Value: {{dlv - lead_value}}
- Event ID: {{dlv - event_id}}
```

**Enhanced Conversions (Backend):**

Já documentado em `AUDITORIA_GOVERNANCA_SEGURANCA_COMPLETA.md` seção 20.2

---

### 3.4 Riscos se NÃO Implementar

| Risco | Probabilidade | Impacto | Custo Anual |
|-------|---------------|---------|-------------|
| Lances não otimizados | CERTO | ALTO | ~$80k |
| Desperdício de budget | ALTO | MÉDIO | ~$40k |
| Perda competitiva | ALTO | ALTO | Incalculável |

**Total estimado:** $120k/ano

---

## 4. DECISÃO CONSOLIDADA

### 4.1 Matriz de Priorização

| Pixel | ROI Anual | Custo Impl. | Payback | Prioridade | Decisão |
|-------|-----------|-------------|---------|------------|---------|
| **Meta Pixel** | $120k | $1,200 | 3 dias | 🔴 P0 | [ ] IMPLEMENTAR / [ ] EXCEÇÃO |
| **Google Ads** | $120k | $1,400 | 5 dias | 🔴 P0 | [ ] IMPLEMENTAR / [ ] EXCEÇÃO |
| **LinkedIn** | $60k | $600 | 4 dias | 🟡 P1 | [ ] IMPLEMENTAR / [ ] EXCEÇÃO |

---

### 4.2 Roadmap de Implementação (se aprovado)

**Sprint 1 (Semana 1-2):**
- [ ] Meta Pixel - Base + PageView + Lead
- [ ] Google Ads Conversion - Via GTM

**Sprint 2 (Semana 3-4):**
- [ ] Meta Pixel - Eventos avançados (ViewContent, Search)
- [ ] LinkedIn Insight Tag - Base + Lead
- [ ] Google Ads Enhanced Conversions (Backend)

**Sprint 3 (Semana 5-6):**
- [ ] Meta CAPI (Server-Side)
- [ ] Testes e otimização
- [ ] Documentação

---

### 4.3 Responsáveis

**Owner Geral:** [Nome] - Head of Marketing

**Implementação:**
- Frontend: [Nome] - Senior Frontend Engineer
- Backend: [Nome] - Data Engineer
- GTM: [Nome] - Marketing Analyst
- QA: [Nome] - QA Engineer

**Aprovadores:**
- [ ] Head of Marketing: _______________
- [ ] Data Engineer: _______________
- [ ] CFO (se > $5k investment): _______________
- [ ] DPO/Legal (privacy implications): _______________

---

### 4.4 Exceções de Risco (se aplicável)

```markdown
## Registro de Exceções

### Meta Pixel

**Status:** [ ] APROVADO [ ] REJEITADO

**Justificativa (se rejeitado):**
[Preencher]

**Mitigações alternativas:**
[Preencher]

**Revisão:** [Data]

---

### LinkedIn Insight Tag

**Status:** [ ] APROVADO [ ] REJEITADO

**Justificativa (se rejeitado):**
[Preencher]

**Mitigações alternativas:**
[Preencher]

**Revisão:** [Data]

---

### Google Ads Conversion

**Status:** [ ] APROVADO [ ] REJEITADO

**Justificativa (se rejeitado):**
[Preencher]

**Mitigações alternativas:**
[Preencher]

**Revisão:** [Data]
```

---

## 5. TRACKING DE PROGRESSO

### 5.1 Checklist de Implementação

**Meta Pixel:**
- [ ] Pixel ID obtido
- [ ] ENV var configurada
- [ ] Componente criado
- [ ] Integrado no layout
- [ ] Testado em staging
- [ ] Deployed em produção
- [ ] Validado no Meta Events Manager
- [ ] Documentado

**LinkedIn Insight Tag:**
- [ ] Partner ID obtido
- [ ] ENV var configurada
- [ ] Componente criado
- [ ] Integrado no layout
- [ ] Testado em staging
- [ ] Deployed em produção
- [ ] Validado no LinkedIn Campaign Manager
- [ ] Documentado

**Google Ads Conversion:**
- [ ] Conversion ID/Label obtidos
- [ ] Tag GTM criada
- [ ] Trigger configurado
- [ ] Testado em GTM Preview
- [ ] Publicado em produção
- [ ] Validado no Google Ads
- [ ] Enhanced Conversions (backend) implementado
- [ ] Documentado

---

### 5.2 Métricas de Sucesso

**Meta Pixel (após 30 dias):**
- [ ] Pixel Health Score > 8/10
- [ ] Events Match Quality > 6/10
- [ ] Retargeting audiences > 1,000 users
- [ ] ROAS melhoria > 15%

**LinkedIn Insight Tag (após 30 dias):**
- [ ] Matched audiences > 500 companies
- [ ] Conversion rate melhoria > 10%
- [ ] CPL (Cost Per Lead) redução > 15%

**Google Ads (após 30 dias):**
- [ ] Conversions registradas > 50
- [ ] Smart Bidding habilitado
- [ ] CPA (Cost Per Acquisition) redução > 20%
- [ ] Conversion Rate melhoria > 15%

---

## 6. PRÓXIMAS AÇÕES

**Imediatas (hoje):**
1. [ ] Preencher decisões (IMPLEMENTAR ou EXCEÇÃO)
2. [ ] Definir owners e prazos
3. [ ] Obter aprovações necessárias

**Se IMPLEMENTAR:**
1. [ ] Obter IDs/tokens dos pixels
2. [ ] Criar issues no GitHub/Jira
3. [ ] Agendar sprint planning
4. [ ] Preparar ambientes de teste

**Se EXCEÇÃO:**
1. [ ] Documentar justificativa detalhada
2. [ ] Obter aprovações formais
3. [ ] Agendar revisão trimestral
4. [ ] Implementar mitigações alternativas

---

**Status Atual:** 🔴 **DECISÃO PENDENTE**

**Documento criado:** 2026-03-05  
**Versão:** 1.0  
**Aguardando:** Decisão de stakeholders
