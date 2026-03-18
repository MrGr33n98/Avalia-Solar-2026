# Solar Intelligence Audit 2026: Revenue & Data-Driven Strategy

**Project:** Avalia Solar (Trust as a Service)  
**Status:** Audit Complete - Phase 1  
**Lead:** @data-engineer & @ux-design-expert  

---

## 1. Matriz de Intensidade de Dados (High-Level)

| Target | Core Interaction | Intent Signal | Gating Opportunity |
| :--- | :--- | :--- | :--- |
| **B2C (Client)** | ROI Simulation | "Can I afford this?" | Blur advanced ROI charts until login. |
| **B2C (Client)** | Reading Negative Reviews | "What is the risk?" | "Log in to see verified risk alerts." |
| **B2C (Client)** | Comparing 3+ Companies | "I'm ready to choose." | Force registration for "Comparison PDF". |
| **B2B (Partner)** | Competitor Benchmarking | "Am I competitive?" | Lock "Market Average Price" behind Pro. |
| **B2B (Partner)** | Lead Response Time | "My SLA performance." | Alerts on "Opportunity Decay" (Intent Score drop). |

---

## 2. Page-By-Page Mapping & Intel Signal

### A. Página de Empresa (`/companies/[slug]`)
- **[Interação]**: Clique no botão "WhatsApp/Contato".
- **[Sinal de Intenção]**: `HIGH_CONVERSION_INTENT`.
- **[Gatilho de Identidade]**: Antes de revelar o número, abrir modal: *"Deseja que o AvaliaSolar monitore esta instalação para sua segurança? Informe seu e-mail/telefone"*.

### B. Comparador (`/compare`)
- **[Interação]**: Adição de 3ª empresa à comparação.
- **[Sinal de Intenção]**: `DECISION_PHASE`.
- **[Gatilho de Identidade]**: **Blur Effect** na linha de "Preço Médio Estimado" e "Score de Pós-Venda". "Desbloqueie dados reais de mercado via conta grátis".

### C. Blog e Materiais (`/blog`)
- **[Interação]**: Scroll de 80% em artigo sobre "Financiamento Solar".
- **[Sinal de Intenção]**: `FINANCIAL_EDUCATION_NEED`.
- **[Gatilho de Identidade]**: Slide-in modal: *"Baixe nossa planilha de Simulação de Financiamento (XLS) - Grátis para usuários logados"*.

---

## 3. Blueprint de Eventos PostHog (A+++)

Para maximizar o **Data Pool**, implementaremos os seguintes eventos via `posthog-js`:

| Event Name | Trigger | Properties | Intent Tier |
| :--- | :--- | :--- | :--- |
| `intent_roi_advanced_dwell` | Mouse > 5s sobre gráfico borrado de ROI | `company_id`, `bill_value` | Hot |
| `intent_competitor_deep_look` | Clique em "Ver mais desta categoria" no Dashboard B2B | `category`, `competitor_id` | B2B Alpha |
| `friction_identity_drop` | Close no modal de login vindo do Wizard | `wizard_step`, `last_successful_field` | Abandonment |
| `trust_seal_interaction` | Click/Hover em selos de verificação | `seal_type`, `verified_status` | Risk-Averse |
| `revenue_cta_copy_whatsapp` | Copiar número de celular no profile | `company_id`, `position` | Conversion |

---

## 4. Estratégia "The Blur Effect" (Intelligence Gating)

**Onde esconder para vender:**
1.  **Price Gating:** Na listagem de busca, mostre "A partir de R$ 1X.XXX". O valor exato `X` fica borrado. O clique abre o cadastro.
2.  **Trust Health Gating:** O breakdown do **Trust Score** (Base + Verification + Performance) deve ser visível apenas para usuários logados. Usuários anônimos veem apenas o número total.
3.  **PDF Leads:** Todo download de "Manual do Consumidor" ou "Guia de Impostos" focado por região deve capturar o CEP e E-mail.

---

## 5. Implementation Roadmap (UI/UX)

1.  **Sprint 1:** Implementar `OverlayBlur` component no Next.js para proteger dados de ROI e Preço.
2.  **Sprint 2:** Criar `IntentBridgeModal` que aparece quando o usuário atinge o limite de 3 ações de alta intenção em 10 minutos.
3.  **Sprint 3:** Sincronizar micro-cliques com o Ruby on Rails para atualizar o `intent_score` do lead em tempo real.

---

---

> **Audit Insight:** O Dado não é o produto. O **sinal de intenção** é o produto. O AvaliaSolar deve vender "Oportunidades com Identidade" para os instaladores.
