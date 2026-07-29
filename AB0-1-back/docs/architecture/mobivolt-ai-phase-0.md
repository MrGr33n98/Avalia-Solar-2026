# Auditoria da arquitetura MobiVolt AI — Fase 0

## Entrada de mensagens

Api::V1::Chat::MessagesController#create
→ Chat::OrchestratorService.process
→ Chat::OrchestratorService#process
→ Chat::SafetyService.sanitize
→ ChatSession#chat_messages.create!
→ Chat::RetrievalService.context_for

## Roteamento de intenção

Chat::OrchestratorService#process
→ Chat::IntentRouterService.route

A chamada ocorre quando pelo menos uma destas flags está ativa:

- MOBIVOLT_INTENT_ROUTER_ENABLED
- MOBIVOLT_INTENT_ROUTER_SHADOW_ENABLED
- MOBIVOLT_AGENTS_ENABLED

O IntentRouterService utiliza Regex e sua própria extração básica de localização.
Ele não chama o Mobivolt::IntentParserService.

## Recomendação com agentes

Quando:

- MOBIVOLT_AGENTS_ENABLED=true;
- new_router_state[:next_agent] == "company_recommendation".

Fluxo:

Chat::OrchestratorService
→ Chat::Agents::CompanyRecommendationAgent.process
→ Chat::Mobivolt::CompanyContextBuilderService.build_for
→ Chat::Mobivolt::CompanyContextBuilderService#build
→ Chat::Mobivolt::IntentParserService.parse
→ Chat::Mobivolt::CompanyMatcherService.match
→ Chat::Mobivolt::SafeCompanySerializer.serialize
→ Chat::Mobivolt::ReviewSummaryBuilderService.build_for

O CompanyRecommendationAgent retorna conteúdo determinístico.
Ele não chama o LlmGateway.

## Suporte técnico com agente

Quando:

- MOBIVOLT_AGENTS_ENABLED=true;
- next_agent pertence às intents técnicas suportadas.

Fluxo:

Chat::OrchestratorService
→ Chat::Agents::SupportAgent.process
→ Chat::LlmGateway.call

## Fluxo clássico

Quando nenhum agente assume a resposta:

Chat::OrchestratorService
→ Chat::LlmGateway.call

## Qualificação preliminar

Quando MOBIVOLT_AGENTS_ENABLED=true:

Chat::OrchestratorService
→ Chat::Agents::LeadQualifierAgent.process
→ Chat::LeadScoringService.temperature_for
→ Chat::PosthogTrackingService.track

O LeadQualifierAgent calcula internamente seu score preliminar.
Ele não chama o LeadScoreCalculator.

## Persistência do ChatLead

Api::V1::Chat::LeadsController#create
→ ChatLead#save!
→ before_save :calculate_score
→ Chat::LeadScoringService.calculate
→ Chat::LeadScoringService.temperature_for

## Sincronização com Lead principal

Quando MOBIVOLT_LEAD_SYNC_ENABLED=true:

Api::V1::Chat::LeadsController#create
→ Chat::Mobivolt::LeadSyncJob.perform_later
→ Chat::Mobivolt::LeadSyncJob#perform
→ Chat::Mobivolt::LeadSyncService.sync!
→ Chat::Mobivolt::LeadScoreCalculator.calculate
→ Chat::Mobivolt::LeadScoreCalculator.qualification_level
→ Lead.create! ou Lead#update!
→ Chat::PosthogTrackingService.track

## Serviço sem caller encontrado

Chat::CompanyMatchingService

Status:

- sem caller estático encontrado;
- contém referência à coluna inexistente companies.public_profile;
- candidato à remoção ou substituição;
- não integra atualmente o fluxo do OrchestratorService.
