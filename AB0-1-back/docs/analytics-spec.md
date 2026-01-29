# Especificação Técnica de Analytics

## Visão Geral
O sistema de analytics do AB0-1 é centralizado no `Analytics::TrackEventService`. Ele garante consistência, conformidade com a LGPD e integração multi-canal (Banco de Dados, Real-time e Mixpanel).

## Arquitetura

### 1. Centralização (Service Layer)
Todos os eventos devem ser disparados via `Analytics::TrackEventService.call`.

**Parâmetros:**
- `event_type`: (String) Nome do evento em snake_case.
- `user`: (User) Objeto do usuário logado (opcional).
- `company_id`: (Integer) ID da empresa associada ao contexto (opcional).
- `metadata`: (Hash) Dados adicionais do evento.

### 2. Fluxo de Dados
1. **Sanitização:** O serviço remove chaves não autorizadas (LGPD) e extrai UTMs de metadados aninhados.
2. **Deduplicação:** Evita eventos idênticos no mesmo segundo para o mesmo usuário/sessão.
3. **Persistência:** Salva na tabela `analytics_events`.
4. **Métricas Diárias:** Incrementa contadores na tabela `company_daily_stats` (se aplicável).
5. **Real-time:** Transmite via ActionCable para o canal `AnalyticsChannel`.
6. **Mixpanel (Opcional):** Envia para o provedor externo se configurado.

## Conformidade LGPD
Apenas chaves permitidas na `WHITELIST_KEYS` são salvas. Informações sensíveis (senhas, documentos, nomes completos em campos abertos) são removidas automaticamente.

**Chaves Permitidas:**
`utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`, `referrer`, `path`, `item_id`, `ip`, `user_agent`, `city`, `state`, etc.

## Eventos Padronizados

| Evento | Origem | Descrição |
| :--- | :--- | :--- |
| `login_completed` | AuthController | Usuário realizou login com sucesso |
| `registration_completed` | AuthController | Novo usuário cadastrado |
| `email_confirmed` | User Model | E-mail de confirmação validado |
| `company_created` | CompaniesController | Empresa criada (pendente ou ativa) |
| `company_activated` | Company Model | Status da empresa alterado para ativo |
| `lead_created` | Lead Model | Novo lead gerado via formulário |
| `review_created` | ReviewsController | Nova avaliação enviada |
| `search_performed` | SearchController | Busca realizada no portal |
| `dashboard_update_requested` | CompanyDashboardController | Alteração sugerida pelo dono da empresa |

## Guia de QA
Para verificar se um evento está sendo rastreado corretamente:
1. Abra o console do Rails: `rails c`
2. Execute a ação no frontend/API.
3. Verifique o último evento: `AnalyticsEvent.last`
4. Valide se os metadados contêm os campos esperados e se o `company_id` está presente quando aplicável.
