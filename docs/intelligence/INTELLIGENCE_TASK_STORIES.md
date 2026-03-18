# Intelligence Implementation Tasks: Solar Data Pool

Este documento detalha as histórias de usuário e tarefas técnicas para implementar a estratégia do `REVENUE_DATA_DRIVEN_AUDIT.md`.

---

## 🛠️ Sprint: Identidade e Gating

### [TS-001] Componente de UI: GatedDataOverlay (The Blur Effect)
**Descrição:** Como desenvolvedor frontend, quero criar um componente reutilizável que aplique um desfoque (blur) a elementos de UI e exija login/cadastro para visualização.
- **Tarefas:**
    - [ ] Criar `components/ui/GatedBlur.tsx`.
    - [ ] Adicionar overlay com botão "Entrar para Ver Dados".
    - [ ] Integrar com o estado de autenticação do `PostHogProvider` e `AuthProvider`.
    - [ ] **Data Intent:** Disparar `overlap_interaction` ao clicar no componente.

### [TS-002] Gating de ROI em Profiles de Empresa
**Descrição:** Aplicar o `GatedDataOverlay` aos gráficos de ROI avançado e payback nas páginas de empresa.
- **Página:** `app/companies/[slug]/page.tsx`
- **Regra:** Mostrar ROI básico. Borrar ROI detalhado de 25 anos.
- **Conversão:** Usuário deve logar para ver a performance de longo prazo.

---

## 🚀 Sprint: Advanced B2C Tracking

### [TS-003] Tracking de Micro-Click em Review & Risco
**Descrição:** Monitorar quando o consumidor foca em reviews de 1 a 3 estrelas para identificar medo.
- **Tarefas:**
    - [ ] Adicionar trigger no frontend para detectar clique em filtros de reviews negativos.
    - [ ] Enviar evento `intent_risk_investigation`.
    - [ ] Propriedades: `company_id`, `rating_filtered`, `scroll_depth_on_reviews`.

### [TS-004] Lead Identification no "CTA Reveal"
**Descrição:** Capturar o lead antes de ele clicar para ver o WhatsApp da empresa.
- **Fluxo:** 
    1. Usuário clica em "Ver Telefone".
    2. Se deslogado: Abrir modal de identificação simplificada (Email/CEP).
    3. Se logado: Revelar número e disparar `revenue_conversion_lead`.

---

## 🏢 Sprint: B2B Strategic Insights

### [TS-005] Monitoring Competitor Benchmarking
**Descrição:** No dashboard da empresa, rastrear quando o empresário solar investiga outras empresas.
- **Dashboard:** `app/company-dashboard/ranking/page.tsx`
- **Evento:** `intent_competitor_analysis`.
- **Métrica:** Qual competitor o empresário mais clica no Magic Quadrant?

### [TS-006] Intent Decay Backend Sync
**Descrição:** Como Data Engineer, quero criar um worker que reduza o score de intenção se o usuário ficar inativo por mais de 15 dias.
- **Backend:** `app/workers/analytics/intent_decay_worker.rb`
- **Lógica:** Se `last_activity > 15.days`, reduzir `intent_score` em 0.8x.

---

## 📄 Sprint: Documentation
### [TS-007] Media Kit Auto-Generator Template
**Descrição:** Criar uma view administrativa que resuma esses novos dados para exportação de PDF.
- **Métrica:** "Nossa plataforma possui X usuários com intenção de compra imediata na região Y".
- **Filtro:** Baseado nos eventos `intent_roi_advanced_dwell` e `quote_wizard_step`.

---

> **Atenção Development Team:** Priorizar as tarefas de GATING (TS-001 e TS-002) para aumentar a base de usuários registrados imediatamente.
