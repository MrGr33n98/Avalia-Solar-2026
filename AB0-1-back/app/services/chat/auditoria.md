# Auditoria de Roteamento e Recomendação (Chat)

## Fluxo de Execução (Call Graph)

Api::V1::Chat::MessagesController#create
→ Chat::OrchestratorService.process

Chat::OrchestratorService
→ Chat::SafetyService.sanitize

Chat::OrchestratorService
→ Chat::IntentRouterService.route
  quando recommendation_intent == true (Mobivolt_agentes desativado)
  → Chat::CompanyMatchingService.match
    → (Retorna empresas para LLM)
  quando recommendation_intent == true (Mobivolt_agentes ativado)
  → Chat::Agents::CompanyRecommendationAgent.process
    → Chat::Mobivolt::IntentParserService.parse
    → Chat::Mobivolt::CompanyMatcherService.match
    → Chat::Mobivolt::PromptContextComposer.compose
    → Chat::LlmGateway.generate

Chat::OrchestratorService (fallback/default)
→ Chat::LlmGateway.generate
