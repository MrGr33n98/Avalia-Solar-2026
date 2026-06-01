Você está assumindo o projeto Avalia Solar / MobiVolt AI no meio do fluxo GSD.

IMPORTANTE:
Não reinicie o planejamento do zero.
Não refatore arquitetura já concluída.
Não implemente features fora do escopo.
Continue exatamente de onde paramos.

Contexto do projeto:
- Backend Rails 7
- Frontend Next.js
- Chat MobiVolt AI com arquitetura multiagente
- Feature flag principal dos agentes: MOBIVOLT_AGENTS_ENABLED
- Telemetria: PostHog sem PII
- Metodologia: GSD com fases, UAT, code review e ship

Fases já concluídas e commitadas:

Fase 1 — Frontend Robustez
- ChatWidget robusto
- ChatCompanyRecommendations isolado
- ErrorBoundary local
- MarkdownRenderer seguro
- cards/logos/CTAs preservados

Fase 2 — Intent Router
- Chat::IntentRouterService criado
- 10 intents
- shadow mode
- fallback defensivo
- PostHog
- fluxo legado preservado

Fase 3A — Company Recommendation Agent
- Chat::Agents::BaseAgent
- Chat::Agents::CompanyRecommendationAgent
- CompanyContextBuilderService
- metadata.companies preservado
- nenhuma empresa inventada
- limpeza de last_recommendation_payload

Fase 3B — Lead Qualifier Agent
- Chat::Agents::LeadQualifierAgent
- should_trigger_lead centralizado
- lead_score
- lead_temperature
- anti-spam
- PostHog sem PII

Fase 3C — CRM Handoff Agent
- Chat::Agents::CRMHandoffAgent
- handoff operacional
- não chama LeadSyncJob automaticamente
- LeadsController com find_or_initialize_by
- proteção contra sobrescrita de dados bons

Fase 3D — Hardening de Idempotência ChatLead
- unique index em chat_leads.chat_session_id
- rescue ActiveRecord::RecordNotUnique no LeadsController
- duplo submit concorrente protegido
- checklist de deploy com auditoria de nulos/duplicados em produção

Fase 4 — Knowledge Base / Support Agent:
A Fase 4 já foi planejada, aprovada e IMPLEMENTADA parcialmente/totalmente conforme walkthrough.

O que foi implementado na Fase 4:
- Model separado KnowledgeArticle, sem misturar com Article de blog/notícias
- KnowledgeArticle pertence a Category
- pg_search com PostgreSQL Full-Text Search
- Active Admin para KnowledgeArticle no menu MobiVolt AI
- Chat::KnowledgeBaseSearchService
- Chat::Agents::SupportAgent
- Integração no OrchestratorService para intents técnicas
- seeds iniciais em db/seeds/knowledge_base.rb
- testes para KnowledgeBaseSearchService, SupportAgent e OrchestratorService
- correção no seed saas_plan_setup.rb relacionada a validação de Company
- inflector ajustado com acrônimo CRM para CRMHandoffAgent
- commercial_intents no OrchestratorService atualizado com intents novas

Arquivos principais da Fase 4:
- app/models/knowledge_article.rb
- app/admin/knowledge_articles.rb
- app/services/chat/knowledge_base_search_service.rb
- app/services/chat/agents/support_agent.rb
- app/services/chat/orchestrator_service.rb
- db/seeds/knowledge_base.rb
- db/seeds/saas_plan_setup.rb
- config/initializers/inflections.rb
- spec/services/chat/knowledge_base_search_service_spec.rb
- spec/services/chat/agents/support_agent_spec.rb
- spec/services/chat/orchestrator_service_spec.rb

Decisões técnicas já tomadas:
- Usar KnowledgeArticle separado de Article.
- Não criar KnowledgeChunk nesta V1.
- Não usar pgvector nesta fase.
- Não usar embeddings nesta fase.
- Usar artigo completo curto estilo FAQ.
- SupportAgent responde apenas com base em artigos recuperados.
- Se não houver artigo confiável, fallback honesto e curto.
- SupportAgent não recomenda empresas.
- SupportAgent não cria lead.
- CompanyRecommendationAgent continua responsável por empresas.
- LeadQualifierAgent continua responsável por should_trigger_lead.
- CRMHandoffAgent continua responsável por handoff.
- PostHog não pode receber PII nem mensagem completa do usuário.

Situação atual:
A Fase 4 foi executada e os testes foram rodados/ajustados.
Houve problemas resolvidos:
1. Banco test com migrações pendentes:
   - resolvido com db:test:prepare
2. Erro de inflector com CRMHandoffAgent:
   - resolvido adicionando acrônimo CRM em config/initializers/inflections.rb
3. commercial_intents incompleto:
   - atualizado no OrchestratorService para incluir intents novas como lead_qualification e financing_question

Próxima ação:
Retomar da validação final da Fase 4.

Execute primeiro:

/gsd-verify-work "Verificar a Fase 4 — Knowledge Base / Support Agent do MobiVolt AI.

Confirmar:
1. KnowledgeArticle foi criado separado de Article.
2. KnowledgeArticle pertence a Category.
3. Article de blog/notícias não foi alterado indevidamente.
4. pg_search está funcionando com title e content.
5. Apenas artigos published aparecem na busca.
6. Artigos draft/unpublished são ignorados.
7. KnowledgeBaseSearchService retorna no máximo 3 artigos.
8. KnowledgeBaseSearchService retorna array vazio em erro ou ausência de resultado.
9. SupportAgent herda ou segue contrato do BaseAgent.
10. SupportAgent é acionado apenas para intents técnicas.
11. SupportAgent usa LlmGateway somente com contexto controlado.
12. SupportAgent instrui o LLM a responder estritamente com base nos artigos recuperados.
13. SupportAgent não inventa resposta quando contexto é insuficiente.
14. SupportAgent retorna fallback honesto e curto quando não há artigo relevante.
15. SupportAgent retorna should_trigger_lead false.
16. SupportAgent não recomenda empresas.
17. SupportAgent não cria ChatLead.
18. CompanyRecommendationAgent continua responsável por recomendações de empresas.
19. LeadQualifierAgent continua responsável por should_trigger_lead.
20. CRMHandoffAgent continua responsável por handoff.
21. OrchestratorService chama SupportAgent apenas com MOBIVOLT_AGENTS_ENABLED=true.
22. MOBIVOLT_AGENTS_ENABLED=false preserva fluxo legado.
23. Metadata retorna type support_answer, sources, knowledge_category e confidence_score.
24. ChatWidget continua compatível.
25. ChatCompanyRecommendations continua compatível.
26. Active Admin de KnowledgeArticle funciona ou foi registrado sem quebrar admin.
27. Seeds de knowledge_base são idempotentes.
28. Correção em saas_plan_setup não quebrou seeds existentes.
29. Inflector CRM não quebrou outros autoloads.
30. commercial_intents atualizado não gera lead spam.
31. PostHog dispara eventos do SupportAgent sem PII.
32. PostHog não recebe nome, telefone, e-mail, CPF, endereço completo ou mensagem completa.
33. Testes RSpec da Fase 4 passam.
34. walkthrough.md está atualizado.
35. Criar ou atualizar UAT da Fase 4.

Não implementar nada novo. Apenas verificar a implementação concluída."

Depois da verificação:
- Se passar: rodar /gsd-code-review da Fase 4.
- Se houver bug: propor hotfix mínimo.
- Não fazer /gsd-ship antes do code review crítico.

/gsd-code-review "Revisar criticamente a Fase 4 — Knowledge Base / Support Agent do MobiVolt AI.

Contexto:
A Fase 4 implementou KnowledgeArticle, KnowledgeBaseSearchService, SupportAgent, Active Admin, seeds iniciais e integração no OrchestratorService. A verificação UAT passou ou está em andamento.

Revisar arquivos:
1. app/models/knowledge_article.rb
2. app/admin/knowledge_articles.rb
3. app/services/chat/knowledge_base_search_service.rb
4. app/services/chat/agents/support_agent.rb
5. app/services/chat/orchestrator_service.rb
6. db/seeds/knowledge_base.rb
7. db/seeds/saas_plan_setup.rb
8. config/initializers/inflections.rb
9. specs da Fase 4

Procurar riscos:
- KnowledgeArticle misturado indevidamente com Article de blog.
- Category existente sendo alterada de forma perigosa.
- pg_search retornando draft/unpublished.
- busca sem relevância retornando artigo ruim.
- SupportAgent alucinando fora do contexto.
- SupportAgent chamando LlmGateway quando não há contexto.
- SupportAgent recomendando empresas por engano.
- SupportAgent criando lead por engano.
- OrchestratorService desviando intents comerciais para SupportAgent.
- financing_question gerando comportamento ambíguo entre suporte e lead.
- solar_assessment sendo tratado como suporte quando deveria coletar dados no futuro.
- MOBIVOLT_AGENTS_ENABLED=false quebrando fluxo legado.
- metadata support_answer quebrando ChatWidget.
- PostHog vazando user_message ou PII.
- seeds duplicando artigos/categorias.
- saas_plan_setup.rb alterado de modo perigoso.
- acrônimo CRM no inflections quebrando autoload de outras classes.
- commercial_intents atualizado gerando lead spam.
- performance ruim por busca FTS sem índice adequado.
- ausência de testes importantes.

Critérios:
- Não implementar pgvector.
- Não implementar embeddings.
- Não implementar KnowledgeChunk.
- Não implementar Proposal Analyzer.
- Não implementar Slack.
- Não alterar frontend sem necessidade.
- Se houver problema, listar hotfix mínimo.
- Se estiver seguro, recomendar /gsd-ship da Fase 4."