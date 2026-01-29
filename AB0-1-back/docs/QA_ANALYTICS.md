# Guia de QA - Analytics

Este guia orienta como validar a implementação do rastreamento de eventos no AB0-1.

## Ferramentas de Validação
1. **Rails Console:** Para verificar persistência no banco.
2. **Logs do Servidor:** Para verificar chamadas do serviço e erros.
3. **ActionCable Monitor:** Para verificar transmissões em tempo real.

## Checkpoints por Fluxo

### 1. Fluxo de Usuário (Auth)
- **Login:**
  - Realize login.
  - Verifique: `AnalyticsEvent.where(event_type: 'login_completed').last`
  - Metadados esperados: `method`, `ip`, `user_agent`, `path`.
- **Registro:**
  - Crie uma conta.
  - Verifique: `AnalyticsEvent.where(event_type: 'registration_completed').last`
  - Metadados esperados: `city`, `state`, `utm_*` (se presentes na URL).

### 2. Fluxo de Empresa (B2B)
- **Criação de Empresa:**
  - Cadastre uma empresa via wizard.
  - Verifique: `AnalyticsEvent.where(event_type: 'company_created').last`
  - Verifique se o `company_id` está correto.
- **Dashboard (Pending Changes):**
  - Altere o logo ou informações da empresa.
  - Verifique: `AnalyticsEvent.where(event_type: 'dashboard_update_requested').last`
  - Verifique `change_type` e `pending_change_id`.

### 3. Fluxo de Lead (Conversão)
- **Geração de Lead:**
  - Preencha um formulário de lead.
  - Verifique: `AnalyticsEvent.where(event_type: 'lead_created').last`
  - Verifique se `company_daily_stats` foi incrementado: `CompanyDailyStat.find_by(company_id: X).leads`

### 4. Busca e Artigos
- **Busca:**
  - Realize uma busca.
  - Verifique: `AnalyticsEvent.where(event_type: 'search_performed').last`
  - Metadados: `query`, `results_count`.
- **Artigos:**
  - Acesse um artigo.
  - Verifique: `AnalyticsEvent.where(event_type: 'article_view').last`

## Validação de LGPD (Privacidade)
- **Teste de Sanitização:**
  - Tente disparar um evento com uma chave proibida (ex: `password`, `credit_card`).
  - `Analytics::TrackEventService.call(event_type: 'test', metadata: { password: '123', utm_source: 'google' })`
  - Verifique: O evento deve ter `utm_source` mas NÃO deve ter `password`.

## Problemas Comuns
- **Evento Duplicado:** Verifique se a lógica de deduplicação no `TrackEventService` está funcionando (mesmo evento no mesmo segundo para o mesmo usuário).
- **Company ID ausente:** Eventos relacionados a uma empresa específica DEVEM ter o `company_id` preenchido para aparecerem no dashboard da empresa.
