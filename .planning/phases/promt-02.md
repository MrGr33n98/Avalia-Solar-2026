[@gsd-executor](subagent://gsd-executor) Executar /gsd-code-review para AUDITORIA COMPLETA do estado atual e maturidade do PostHog/Analytics no Avalia Solar.

Objetivo:
Auditar profundamente a implementação atual de analytics/PostHog para entender:
- estado atual;
- maturidade técnica;
- riscos LGPD/PII;
- erros de tipagem;
- eventos inconsistentes;
- duplicidade de tracking;
- qualidade dos payloads;
- cobertura dos funis comerciais;
- prontidão para novas features: chatbot enhanced, carrossel de categorias, reviews, lead scoring, discovery comercial, pricing, banners e marketplace.

Regras obrigatórias:
- Não implementar correções.
- Não fazer commit.
- Não alterar produção.
- Não alterar comportamento existente.
- Apenas investigar, mapear, classificar riscos e propor plano incremental.

Escopo:
Mapear todo uso de PostHog/analytics em:
frontend, backend se existir, home, chatbot, leads, pricing, perfil de empresa, reviews, banners, comparação, formulários, categorias, produtos, cadastro/login e integrações futuras.

Investigar:
- imports de posthog;
- providers;
- hooks;
- wrappers/helpers;
- chamadas diretas de posthog.capture;
- event trackers;
- analytics services;
- env/configuração;
- inicialização client/server;
- uso de window/posthog;
- uso em client/server components do Next.js;
- tipos TypeScript relacionados.

Rodar/verificar:
- npm run typecheck ou pnpm typecheck;
- npm run lint;
- busca por posthog.capture;
- busca por posthog;
- busca por analytics;
- busca por trackEvent;
- busca por event_name;
- busca por phone, email, name, message, city, whatsapp em payloads.

Auditoria LGPD:
Confirmar se algum evento envia dados proibidos:
nome, telefone, e-mail, CPF, endereço, cidade digitada livremente, texto digitado, mensagem completa do chatbot, conteúdo de proposta, dados sensíveis ou identificadores pessoais indevidos.

Payload seguro permitido:
event_name, source, page, vertical, category, plan, viewport, action, has_contact boolean, lead_temperature, company_count, selected_company_count, session_id se não for PII.

Inventário obrigatório:
Gerar tabela:
Arquivo | Função/Componente | Evento | Payload | Contém PII? | Risco | Status | Ação sugerida

Cobertura por funil:
Avaliar se há eventos para:
- visitante: home, busca, categoria, empresa, produto, comparação, reviews, orçamento;
- empresa: cadastro, login, edição de perfil, upload de banner, CTA, upgrade, pricing, checkout;
- chatbot: botão visto, popup aberto, quick action, fluxo iniciado, lead capturado, orçamento;
- reviews: formulário iniciado, review enviado, review exibido, comparação;
- banners: banner visto, clique, posição, categoria, campanha.

Score de maturidade:
Dar nota 0 a 5 para:
- arquitetura de tracking;
- centralização dos eventos;
- tipagem TypeScript;
- segurança LGPD;
- qualidade dos payloads;
- cobertura do funil comercial;
- observabilidade de leads;
- observabilidade de pricing;
- observabilidade do chatbot;
- observabilidade de reviews;
- feature flags de analytics;
- prontidão para escala.

Gerar nota geral:
Maturidade Analytics/PostHog: X/5

Propor arquitetura alvo:
Component → trackEvent() → safeCapture() → sanitizer → PostHog

Incluir:
- analyticsClient;
- safeCapture;
- trackEvent;
- event schema centralizado;
- lista/enum de eventos permitidos;
- payload validator;
- PII sanitizer;
- feature flags;
- proibição de posthog.capture solto em componentes.

Feature flags recomendadas:
- posthog_enabled
- safe_analytics_events_enabled
- pii_sanitizer_enabled
- chatbot_analytics_enabled
- home_category_carousel_analytics_enabled
- review_analytics_enabled
- lead_intent_analytics_enabled
- pricing_analytics_enabled
- banner_analytics_enabled

Classificação de risco:
- Crítico: envia PII, quebra produção ou viola LGPD;
- Alto: tracking errado em fluxo comercial relevante;
- Médio: tipagem fraca, any, duplicidade, payload inconsistente;
- Baixo: naming ruim, evento inútil, cleanup.

Entregável:
Criar relatório Markdown com:
1. resumo executivo;
2. nota geral de maturidade;
3. mapa de arquivos com PostHog/analytics;
4. inventário completo de eventos;
5. riscos LGPD/PII;
6. problemas de tipagem;
7. eventos duplicados/inconsistentes;
8. cobertura por funil;
9. lacunas para novas features;
10. feature flags recomendadas;
11. arquitetura alvo;
12. roadmap incremental;
13. quick wins;
14. riscos críticos;
15. checklist de aceite.

Formato:
Usar tabelas claras, priorização por risco e separar erros antigos dos problemas específicos de analytics/PostHog.

Não implementar.
Não corrigir.
Não fazer commit.
Apenas auditar e documentar.