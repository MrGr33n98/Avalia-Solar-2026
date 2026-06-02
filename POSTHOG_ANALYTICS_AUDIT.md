# Auditoria de Maturidade Analytics & PostHog — Avalia Solar

**Data:** 02 de Junho de 2026
**Status:** Auditado (Riscos Críticos Detectados)
**Responsável:** Gemini CLI Agent

---

## 1. Resumo Executivo

A auditoria técnica do ecossistema de analytics (PostHog + GTM + Backend) revelou uma arquitetura que, embora funcional e rica em dados, encontra-se em um estado de **transição fragmentada**. Identificamos **RISCOS CRÍTICOS de conformidade com a LGPD** devido ao vazamento explícito de PII (e-mails e nomes) em payloads de eventos e identificação de usuários. 

O sistema possui uma camada canônica robusta (`lib/analytics`), mas sua eficácia é minada por implementações paralelas (`lib/posthog.ts`) e chamadas diretas que ignoram os mecanismos de higienização.

---

## 2. Score de Maturidade

| Critério | Nota (0-5) | Observação |
| :--- | :--- | :--- |
| **Arquitetura de Tracking** | 2.5 | Fragmentada em 3 camadas; falta de unicidade. |
| **Centralização dos Eventos** | 2.0 | Muitas chamadas diretas a `posthog.capture` em componentes. |
| **Tipagem TypeScript** | 3.0 | Interfaces existem, mas não são rigorosamente exigidas em chamadas diretas. |
| **Segurança LGPD/Privacidade** | 1.0 | **Crítico.** Vazamento de e-mail e nome em múltiplos pontos. |
| **Qualidade dos Payloads** | 3.0 | Taxonomia boa no `consolidated.ts`, inconsistente no restante. |
| **Cobertura do Funil Comercial** | 4.5 | Excelente cobertura (Leads, Banners, Chat, Reviews). |
| **Observabilidade de Leads** | 4.0 | Rastreamento detalhado de conversão e origem. |
| **Prontidão para Escala** | 2.5 | Depende de limpeza técnica para evitar débito de privacidade. |

**Maturidade Geral: 2.8 / 5.0**

---

## 3. Mapa de Arquivos Principais

| Arquivo | Papel | Observação |
| :--- | :--- | :--- |
| `AB0-1-front/lib/analytics/index.ts` | **Núcleo Canônico** | Contém o `sanitizeProperties` (Ignorado por muitos). |
| `AB0-1-front/lib/posthog.ts` | **Implementação Legada** | **Risco Crítico.** Envia e-mail e tem autocapture ativo. |
| `AB0-1-front/components/PostHogProvider.tsx` | **Provider Moderno** | Respeita consentimento LGPD. Conflita com `lib/posthog.ts`. |
| `AB0-1-back/app/services/analytics/track_event_service.rb` | **Orquestrador Backend** | Ponto único de entrada no servidor. |
| `AB0-1-back/app/services/analytics/post_hog_service.rb` | **Conector PostHog** | **Risco Crítico.** Usa e-mail como `distinct_id`. |
| `AB0-1-back/app/models/user.rb` | **User Analytics Data** | `posthog_properties` inclui dados sensíveis. |

---

## 4. Inventário de Eventos (Exemplos Representativos)

| Arquivo | Componente | Evento | Payload | PII? | Risco |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `PostHogService.rb` | `track_lead` | `wizard_success` | `distinct_id: lead.email` | **SIM** | **CRÍTICO** |
| `auth_controller.rb` | `Login/Auth` | `identify` | `email, name, role` | **SIM** | **CRÍTICO** |
| `lib/posthog.ts` | `identifyUser` | `identify` | `email, city, state` | **SIM** | **CRÍTICO** |
| `ChatWidget.tsx` | `Chat` | `chat_message_sent` | `message` (indireto) | Opcional | Médio |
| `QuoteForm.tsx` | `Form` | `contact_request` | `source, category` | Não | Baixo |
| `BannerContainer.tsx` | `Banners` | `banner_view` | `banner_id, campaign` | Não | Baixo |

---

## 5. Riscos LGPD/PII (Detalhamento)

### [CRÍTICO] Vazamento de E-mail como Identificador (Backend)
No arquivo `AB0-1-back/app/services/analytics/post_hog_service.rb`, o método `track_lead` utiliza o e-mail do lead como `distinct_id`. Isso expõe a identidade do usuário permanentemente no PostHog, violando o princípio de anonimização.
**Ação:** Usar `lead.id` ou um hash anônimo.

### [CRÍTICO] Envio de Dados Sensíveis em Person Properties (Backend)
O modelo `User.rb` no método `posthog_properties` envia `email` e `name` explicitamente. Estes dados são consumidos por `AuthController` e `OmniauthCallbacksController` ao chamar `PostHog.identify`.
**Ação:** Remover `email` e `name` das propriedades de pessoa enviadas para ferramentas de terceiros.

### [CRÍTICO] Dupla Inicialização e Autocapture (Frontend)
O arquivo `lib/posthog.ts` inicializa o PostHog com `autocapture: true`, o que pode capturar cliques em inputs sensíveis. Além disso, a função `identifyUser` neste arquivo envia o e-mail do usuário.
**Ação:** Eliminar `lib/posthog.ts` em favor do `PostHogProvider.tsx` e `lib/analytics/index.ts`.

---

## 6. Problemas de Tipagem e Arquitetura

1.  **Chamadas Diretas:** Componentes como `ChatWidget.tsx` chamam `posthog.capture` diretamente. Isso pula a função `sanitizeProperties` definida em `lib/analytics/index.ts`, tornando o sistema vulnerável a erros humanos que incluam PII nos payloads.
2.  **Fragmentação de Helpers:** Existe uma confusão entre `trackEvent` (de `lib/analytics/events`), `track` (de `lib/analytics/consolidated`) e o `track` básico.
3.  **Falta de Strict Mode:** O backend possui uma flag `G4_ANALYTICS_STRICT_MODE` que está desligada, permitindo que eventos que violam o contrato de dados sejam processados.

---

## 7. Cobertura por Funil

-   **Visitante (Home/Busca):** **Excelente.** Eventos de visualização de categoria, busca e cliques em banners bem mapeados.
-   **Empresa (Dashboard/Pricing):** **Boa.** Rastreamento de upgrades, cliques em planos e visualização de leads de oportunidade.
-   **Chatbot (MobiVolt):** **Alta.** Eventos de intenção e interação básica presentes, mas payloads de "discovery comercial" ainda são inconsistentes.
-   **Reviews:** **Consolidada.** Eventos de leitura e engajamento (`review_read`) integrados.

---

## 8. Arquitetura Alvo Sugerida

**Fluxo Unificado:**
`Component/Service` → `trackEvent(name, props)` → `PII Sanitizer` → `PostHog + Backend`

**Componentes Chave:**
1.  **`AnalyticsClient`**: Único ponto de exportação para funções de tracking no frontend.
2.  **`EventRegistry`**: Schema centralizado (JSON ou TS Enum) definindo quais chaves são obrigatórias e quais são proibidas.
3.  **`Sanitizer`**: Middleware que remove qualquer chave presente em uma lista negra de PII antes do dispatch.

---

## 9. Roadmap Incremental (Ações Sugeridas)

1.  **Quick Win (LGPD):** Remover e-mail e nome do `User#posthog_properties` e mudar `distinct_id` em `PostHogService.rb` para `lead_id`.
2.  **Consolidação:** Deletar `lib/posthog.ts` e refatorar todos os componentes para usar apenas o `track()` de `lib/analytics/index.ts`.
3.  **Higienização:** Rodar script de busca por `posthog.capture` e substituir por `track()` canônico.
4.  **Enforcement:** Ativar `STRICT_MODE` no backend para ambientes de staging para validar contratos de dados.

---

## 10. Checklist de Aceite para Próximas Implementações

- [ ] Chamada de analytics usa apenas o helper centralizado?
- [ ] O payload foi verificado contra a lista negra de PII?
- [ ] O evento está tipado na Matrix de Analytics?
- [ ] O consentimento LGPD foi verificado (frontend)?
- [ ] O `distinct_id` é um identificador anônimo (UUID/ID numérico)?

---
**Nota de Maturidade Analytics/PostHog: 2.8/5**
*Auditoria realizada por Gemini CLI Agent conforme diretiva promt-02.md*
