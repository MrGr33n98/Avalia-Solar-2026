# Plano de Auditoria Analítica TaaS v2.0

## Tarefas P0 (Imediato)

### 1. Persistência de `is_internal`
- **Arquivo:** `AB0-1-front/lib/analytics/index.ts`
- **Ação:** No `initializeAnalytics`, verificar parâmetros `internal=true` ou `is_internal=true` e salvar `is_internal_team=true` no `localStorage`.

### 2. Sincronização de Visibilidade (IntersectionObserver)
- **Componentes:** `CompanyCard.tsx`, `PremiumBannerCarousel.tsx`, `TrustScoreDial.tsx`.
- **Regra:** `threshold: 0.5`, `delay: 1000ms`. O evento só dispara se o elemento estiver 50% visível por 1 segundo.

### 3. Expansão de Sanitização PII
- **Arquivo:** `AB0-1-front/lib/analytics/index.ts`
- **Ação:** Atualizar `sanitizeProperties` para remover `phone`, `cnpj`, `address`, `email`, `cpf` de forma profunda.

### 4. Mapeamento Web Vitals (FID -> first_input_delay)
- **Arquivo:** `AB0-1-front/components/PostHogProvider.tsx`
- **Ação:** No componente `WebVitals`, renomear métrica `FID` para `first_input_delay`.

## Tarefas de Expansão (Mapeamento de Negócio)

### 1. Newsletter & Leads
- **Componentes:** `NewsletterPopup.tsx`, `ContactForm`.
- **Eventos:** `newsletter_submit`, `contact_request`.

### 2. Atribuição de Blog
- **Componentes:** `StickyShareBar.tsx`, `ShareButtons.tsx`.
- **Evento:** `blog_social_share`.

### 3. Enriquecimento de CTA
- **Arquivo:** `AB0-1-front/lib/analytics/track-cta.ts`
- **Ação:** Adicionar `url_completa` e granularidade extra em `cta_type`.
