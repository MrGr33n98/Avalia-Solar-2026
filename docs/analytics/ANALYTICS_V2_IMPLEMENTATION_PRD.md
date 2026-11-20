# Avalia Solar — Analytics v2: Measurement Integrity

**Estado:** implementação inicial em branch isolada; revisão e CI pendentes.
**Base:** auditorias GA4 de 19/11/2026, property `424024013`.
**Modo operacional:** nenhuma alteração em GA4 Admin, GTM, PostHog, banco ou produção.

## 1. Decisão arquitetural

Preservar o contrato existente `docs/analytics/ANALYTICS_CONTRACT_V3.md`.

| Domínio | Fonte autoritativa | Evento |
| --- | --- | --- |
| Aquisição | GA4/GSC | sessões, organic, campanhas |
| Jornada e intenção | PostHog/frontend | `company_profile_viewed`, `company_cta_clicked` |
| Lead persistido | Rails/DB | `lead_created` |
| Ativação | Rails/DB | `company_activated` |
| Assinatura | Billing/outbox | `subscription_activated` |
| Pagamento | Stripe/webhook | `invoice_paid` |

Não marcar `form_submit`, cliques, `wizard_submitted` ou `lead_verified` como venda ou lead confirmado.
A aplicação já possui callbacks de `lead_created` em `AB0-1-back/app/models/lead.rb` com idempotência por lead.
Não emitir um segundo `generate_lead` sem identidade de deduplicação, evidência de persistência e aprovação do contrato.

## 2. Root cause e quick wins implementados

| ID | Evidência | Correção na branch | Aceite |
| --- | --- | --- | --- |
| A2-01 | `utm.ts` não distingue `avaliasolar_ads` de aquisição externa | tratar banner first-party como interação interna no armazenamento de atribuição | `last_external_touch` preservado |
| A2-02 | `getSurfaceKind(pathname)` mistura logins de múltiplos domínios | classificar `crm` e `app` pelo hostname | `/login` classificado corretamente |
| A2-03 | GTM com `lazyOnload` e `dataLayer` condicional perde eventos consentidos antes da inicialização | bufferizar eventos no `dataLayer`, sem alterar consent gate | evento enfileirado uma vez |
| A2-04 | `mapToGA4Event()` associa eventos de formulário a `generate_lead` e `purchase` | remover aliases que inflacionam conversões | nenhum formulário genérico gera purchase |

As alterações **não** mudam a forma como o usuário concede/nega consentimento.
O buffer só é alimentado pelo `track()` após `hasAnalyticsConsent()`.

## 3. Limites da intervenção

**Não resolvidos apenas por código:**
- Filtros de referências indesejadas OAuth do GA4;
- Dimensões personalizadas não cadastradas;
- Configuração real de tags/triggers no GTM;
- Modelo de consentimento e elegibilidade de comportamento;
- Streams/identidade entre `www`, `app` e `crm`;
- Instrumentação de `generate_lead` no GA4 por evento autoritativo Rails;
- Qualidade e amostragem dos relatórios GA4.

Não habilitar tag GA4 duplicada no GTM. O documento atual `docs/analytics/GTM_TAG_MATRIX.md` restringe esse cenário. Antes de qualquer mudança de GA4 ownership, confirmar no **contêiner publicado** qual é a fonte de `page_view` e dos eventos comerciais. Documentação antiga pode estar desatualizada.

## 4. Taxonomia proposta

| Etapa | Evento | Fonte | Key Event? |
| --- | --- | --- | --- |
| Perfil | `company_profile_viewed` | front | Não |
| CTA | `company_cta_clicked` | front | Não por padrão |
| Formulário | `form_submit` | GA4 Enhanced Measurement | Não |
| Wizard | `wizard_started` / `wizard_submitted` | front | Não |
| Lead | `lead_created` / `generate_lead` somente após persistência | Rails | Proposta, exige validação |
| Ativação | `company_activated` | Rails | Proposta |
| Assinatura | `subscription_activated` | Billing | Proposta |
| Receita | `invoice_paid` | Stripe | Proposta |

**Privacidade:** não enviar `lead_id`, telefone, e-mail, nomes de pessoas, tokens ou endereços ao GA4. Usar parâmetros agregados como `company_id` (após revisão de cardinalidade), `cta_type`, `plan_tier`, `surface_kind`.

## 5. Segmentação operacional

- Marketplace: `www.avaliasolar.com.br`, público.
- Workspace: `app.avaliasolar.com.br`, B2B.
- CRM: `crm.avaliasolar.com.br`, não presumir 100% staff sem identidade autenticada.
- Desenvolvimento: `localhost` / IPs locais, nunca usar para KPI de aquisição.

Filtrar **relatórios** por hostname imediatamente, sem excluir dados historicamente nem aplicar filtros irreversíveis no GA4. A soma de sessões por hostname não equivale necessariamente ao total único da propriedade.

## 6. Runbook de mudanças administrativas — NÃO EXECUTAR NESTA BRANCH

1. Salvar configuração/versão atual do GTM e screenshots da propriedade GA4.
2. Verificar `get_account_summaries`, `get_property_details` e eventos recebidos via MCP.
3. Confirmar qual tag realmente emite `page_view`, `contact` e `company_profile_viewed` (GTM Preview com consentimento de teste).
4. Avaliar em staging referências de `accounts.google.com` e `accounts.zoho.com`, sem assumir que referrer novo iniciou sessão nova.
5. Selecionar dimensões mínimas de baixa cardinalidade: `cta_type`, `plan_tier`, `surface_kind`; avaliar `company_id` separadamente.
6. Validar `purchase` somente para pagamento, `generate_lead` somente para lead persistido, com deduplicação.
7. Revisar moeda USD→BRL considerando efeito nos relatórios e usuários; pedir aprovação.
8. Testar revogação de consentimento, GTM carregado/não carregado, cookies e ausência de PII.
9. Aprovar mudanças na propriedade antes de executá-las; monitorar GA4 DebugView e PostHog.
10. Rollback de configuração: restaurar versão anterior do GTM e reverter mudanças reversíveis do GA4 após análise do impacto histórico.

## 7. Testes e critérios de aceite

- `npm run typecheck` sem erros novos;
- `npx jest --runInBand --runTestsByPath __tests__/lib/analytics/measurement-v2.test.ts __tests__/lib/utm.test.ts`;
- `dataLayer` bufferiza eventos consentidos e não aceita override do campo `event`;
- UTMs internas preservam first/last external touch;
- CRM e app não são confundidos com home pública só porque a rota é `/login`;
- `lead_submitted`, `wizard_submitted` e `lead_verified` não se tornam `purchase` ou `generate_lead`;
- zero alterações de banco, production config, GTM, propriedade GA4 e main.

## 8. Plano restante

- **PR seguinte, dentro da mesma iniciativa:** E2E consentido/negado e inspeção real do contêiner GTM; testes de delivery ao GA4.
- **Após aprovação externa:** configuração dimension/key event com cardinalidade e política de PII.
- **Integração de conversões Rails→GA4:** projeto separado com consentimento/identidade e dedupe, sem vazamento de IDs.
- **Scorecards:** 3 vistas (público, B2B, CRM) e reconcile total com query auditável, não somar usuários/sessões entre dimensões indiscriminadamente.

## 9. Go/No-Go

Esta branch **não comprova** entrega de todos os eventos no GA4. Requer revisão de CI, E2E, contêiner GTM publicado e validação pós-deploy.
Não fazer merge/deploy automaticamente.
