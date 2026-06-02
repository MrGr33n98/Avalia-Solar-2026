# Plano de Melhorias de Analytics - Avalia Solar

Este documento detalha o plano de execução para 6 melhorias críticas na camada de analytics (Front-end e Back-end), focando em governança, atribuição, debugging e performance.

## 📋 Visão Geral
- **Objetivo**: Consolidar a infraestrutura de dados para suporte a decisões de marketing e produto.
- **Prioridades**: Conformidade LGPD, integridade de dados e correlação entre ferramentas (Sentry, PostHog, Backend).
- **Modo**: QUICK (Prototipagem funcional integrada).

---

## 🛠 Fase 1: Governança e Tipagem (Data Governance)
**Objetivo**: Garantir que todos os eventos disparados sigam um contrato rígido, evitando "data swamp".

### Tarefa 1.1: Criar Schema Centralizado
- **Arquivo**: `AB0-1-front/lib/analytics/schema.ts`
- **Ação**: Implementar esquemas usando TypeScript (ou Zod para validação em runtime se necessário).
- **Conteúdo**: Definir `EventPayloadMap` vinculando nomes de eventos a propriedades obrigatórias/opcionais.
- **D-01 (Lock)**: Todos os eventos disparados via `track()` devem ser validados contra este schema.

### Tarefa 1.2: Refatorar `track()` no Front-end
- **Arquivo**: `AB0-1-front/lib/analytics/index.ts`
- **Ação**: Atualizar a assinatura de `track<K extends keyof EventPayloadMap>(eventName: K, properties: EventPayloadMap[K], ...)` para garantir type-safety.
- **Ação**: Adicionar log de aviso em desenvolvimento caso propriedades desconhecidas sejam enviadas.

---

## 🔗 Fase 2: Atribuição e Correlação (Marketing & Ops)
**Objetivo**: Entender a jornada completa do usuário, do primeiro clique à conversão, e correlacionar erros com sessões.

### Tarefa 2.1: Lógica First-Touch vs Last-Touch
- **Arquivo**: `AB0-1-front/lib/analytics/utm.ts`
- **Ação**: Refinar a persistência em cookies (via `lib/analytics/cookies.ts`).
- **Lógica**: 
  - `first_touch`: Gravado apenas se não existir. Expiração de 1 ano.
  - `last_touch`: Atualizado a cada nova entrada via UTM ou Referrer externo. Expiração de 30 dias.
- **Ação**: Garantir que ambos os objetos sejam enviados no `metadata` para o backend no evento de `page_view` inicial e conversões.

### Tarefa 2.2: Integração Sentry + PostHog
- **Arquivos**: `AB0-1-front/sentry.client.config.ts` e `AB0-1-front/components/PostHogProvider.tsx`
- **Ação**: No `PostHogProvider`, após o carregamento do PostHog, capturar o `distinct_id` e `session_id`.
- **Ação**: Usar `Sentry.setTag("posthog_session_id", sessionId)` e `Sentry.setTag("posthog_distinct_id", distinctId)`.
- **D-02 (Lock)**: Habilitar o link direto no Sentry para o replay do PostHog (URL: `https://us.posthog.com/project/{project_id}/replay/{session_id}`).

---

## 🕵️ Fase 3: Debugger e Server-Side (Qualidade e Confiança)
**Objetivo**: Visibilidade total para desenvolvedores e garantia de que eventos críticos não sejam bloqueados por AdBlockers.

### Tarefa 3.1: Debugger Overlay em Tempo Real
- **Arquivo**: `AB0-1-front/components/analytics/AnalyticsDebugger.tsx` (Novo)
- **Ação**: Criar um componente (exibido apenas em `process.env.NODE_ENV !== 'production'`) que assina os eventos do `index.ts`.
- **Funcionalidade**: Lista flutuante dos últimos 10 eventos disparados, mostrando nome e payload sanitizado.
- **Ação**: Adicionar ao `layout.tsx` principal.

### Tarefa 3.2: Server-Side Tracking de Conversões Críticas
- **Arquivo**: `AB0-1-back/app/services/analytics/post_hog_service.rb`
- **Ação**: Adicionar método `track_server_event(event_name, user_id, properties)`.
- **Ação**: Refatorar o fluxo de criação de Leads (ex: `LeadsController` ou `CreateLeadService`) para disparar `wizard_success` exclusivamente via Ruby após sucesso no DB.
- **Ação**: Incluir UTMs capturados do cookie/front no payload do backend para manter atribuição.

---

## ⚡ Fase 4: Performance e Web Vitals
**Objetivo**: Correlacionar a experiência técnica (velocidade) com a taxa de conversão.

### Tarefa 4.1: Coleta de Web Vitals
- **Arquivo**: `AB0-1-front/lib/analytics/vitals.ts` (Novo)
- **Ação**: Usar a lib `web-vitals` para capturar LCP, FID, CLS, TTFB.
- **Ação**: Disparar `track('web_vitals', { metric_name, metric_value, metric_rating })`.
- **Ação**: Adicionar propriedade `is_slow_session: true` se LCP > 2.5s para segmentação posterior no PostHog.

---

## 🧪 Critérios de Aceitação
- [ ] Schema centralizado impede builds com eventos mal tipados.
- [ ] Cookies de First/Last touch persistem corretamente após navegação entre múltiplas fontes.
- [ ] Erros no Sentry possuem tag `posthog_session_id`.
- [ ] Leads são registrados no PostHog mesmo se o JS do cliente falhar/bloquear após o POST.
- [ ] Overlay de debug visível apenas em ambiente local/staging.
- [ ] Eventos de Web Vitals aparecendo no dashboard do PostHog vinculados ao usuário.

## 🛡️ Segurança e LGPD
- **Sanitização**: Manter o uso de `sanitizeAnalyticsProperties` e `opaqueUserId`.
- **Consentimento**: Respeitar `hasAnalyticsConsent()` antes de inicializar o debugger ou persistir cookies de marketing.
- **PII**: Proibido enviar E-mail, Telefone ou Nome Real no `metadata` dos eventos.

---
**Próximo Passo**: Iniciar execução pela Fase 1 (Governança).
