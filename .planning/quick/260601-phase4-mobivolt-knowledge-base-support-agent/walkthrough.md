# Walkthrough - Fase 4 MobiVolt AI Knowledge Base / Support Agent

Data: 2026-06-01
Status: hotfix P1/P2 aplicado e verificado; ship nao executado

## Escopo retomado

Este walkthrough continua o handoff descrito em `promt_1.md`. Nao reinicia o planejamento e nao adiciona features fora da Fase 4.

Arquivos centrais inspecionados:

- `AB0-1-back/app/models/knowledge_article.rb`
- `AB0-1-back/app/admin/knowledge_articles.rb`
- `AB0-1-back/app/services/chat/knowledge_base_search_service.rb`
- `AB0-1-back/app/services/chat/agents/support_agent.rb`
- `AB0-1-back/app/services/chat/orchestrator_service.rb`
- `AB0-1-back/app/services/chat/intent_router_service.rb`
- `AB0-1-back/app/services/chat/agents/lead_qualifier_agent.rb`
- `AB0-1-back/app/services/chat/agents/crm_handoff_agent.rb`
- `AB0-1-back/db/seeds/knowledge_base.rb`
- `AB0-1-back/db/seeds/saas_plan_setup.rb`
- `AB0-1-back/config/initializers/inflections.rb`
- specs relacionados ao chat

## Fluxo confirmado

1. `KnowledgeArticle` foi criado separado de `Article`.
2. `KnowledgeArticle` pertence a `Category`.
3. A busca usa `pg_search` em `title` e `content`, filtra artigos publicados e limita a resposta a 3 registros.
4. `SupportAgent < BaseAgent` pesquisa a base antes de chamar `Chat::LlmGateway`.
5. Sem artigos recuperados, `SupportAgent` nao chama o LLM e retorna fallback honesto.
6. Com artigos recuperados, o prompt instrui o LLM a responder exclusivamente com base no contexto recuperado.
7. O metadata de suporte retorna `type=support_answer`, `sources`, `knowledge_category` e `confidence_score`.
8. O `ChatWidget` continua renderizando texto normalmente e so monta cards quando `metadata.type === 'company_recommendations'`.
9. O seed chama `Seeds::KnowledgeBase.run!` e usa `find_or_initialize_by(slug:)`.
10. `rails zeitwerk:check` passou com `All is good!`, incluindo o acronimo `CRM`.

## Evidencia de testes

### Backend focado na Fase 4

Comando executado via Ruby Windows e runner RSpec direto:

```text
rspec spec/services/chat/knowledge_base_search_service_spec.rb \
      spec/services/chat/agents/support_agent_spec.rb \
      spec/services/chat/orchestrator_service_spec.rb
```

Resultado:

```text
14 examples, 0 failures
```

### Backend ampliado para fases vizinhas

Specs executados:

```text
intent_router_service_spec.rb
company_recommendation_agent_spec.rb
lead_qualifier_agent_spec.rb
crm_handoff_agent_spec.rb
knowledge_base_search_service_spec.rb
support_agent_spec.rb
orchestrator_service_spec.rb
```

Resultado:

```text
37 examples, 6 failures
```

As falhas ampliadas mostram contratos preexistentes divergentes no router, recommendation agent e CRM handoff. Elas precisam ser tratadas antes do ship porque a Fase 4 depende desses componentes.

### Frontend preservado

`ChatCompanyRecommendations.test.tsx`:

```text
6 tests passed
```

`MarkdownRenderer.test.tsx` nao executa porque importa `./MarkdownRenderer`, mas o componente esta em `../chat/MarkdownRenderer`.

`npm run typecheck` tambem falha por erros preexistentes amplos no frontend, sem relacao direta com a Fase 4.

## Bloqueios encontrados

1. Arquivos centrais da Fase 4 ainda estao fora do Git: model, migration, admin, servico de busca, support agent, seed e specs. Um deploy baseado no commit atual ficaria incompleto.
2. Sete dos dez FAQs iniciais nao sao roteados ao `SupportAgent` quando perguntados pelos termos naturais dos proprios artigos: microinversor, inversor vs. microinversor, energia injetada, creditos de energia, recarga AC/DC, bateria solar e carport solar.
3. `financing_question` e `ev_charger_question` podem abrir formulario de lead por engajamento apos a terceira mensagem, mesmo sendo perguntas tecnicas respondidas pelo `SupportAgent`.
4. Com agentes desligados e intent router ligado, `financing_question` e `ev_charger_question` foram adicionados a `commercial_intents`, abrindo formulario de lead ate para pergunta informativa.
5. `CRMHandoffAgent` chama `log_error` inexistente dentro do rescue, podendo mascarar a falha original com `NoMethodError`.
6. `CRMHandoffAgent` pode atualizar score, temperatura e intent de um lead existente mesmo quando a qualificacao atual retorna `should_trigger_lead=false`.
7. `KnowledgeArticle.published` inclui artigos com `published_at=nil`, permitindo exposicao imediata de artigo sem data.
8. `KnowledgeBaseSearchService` registra a query completa no log em caso de erro. Isso pode persistir PII fora do PostHog.
9. O seed evita duplicacao de slug, mas sobrescreve `status` e `published_at` em toda execucao. Um artigo moderado manualmente para draft volta a publico no proximo seed.

## Decisao

Nao executar `/gsd-ship`.

Aplicar somente hotfix minimo, executar novamente os specs focados e ampliados e repetir a verificacao UAT.

## Pos-hotfix

Os bloqueios P1/P2 foram corrigidos sem adicionar features:

1. FAQs naturais agora chegam ao suporte, incluindo microinversor, energia injetada, creditos, bateria, carport, wallbox, condominio e recarga AC/DC.
2. Perguntas tecnicas nao abrem lead por terceira mensagem, urgencia isolada ou preco isolado.
3. `support_answer` informativo permanece com `should_trigger_lead=false` antes do CRM handoff.
4. O CRM preserva lead existente quando a qualificacao atual e negativa e usa logger seguro no rescue.
5. Artigos publicados exigem `published_at`; nulos e datas futuras ficam fora da busca.
6. O log de erro da busca registra somente a classe da excecao.
7. O seed preserva conteudo editorial, status e `published_at` de slug existente.
8. O import isolado do teste `MarkdownRenderer` foi corrigido.

### Evidencia final

```text
Specs focados: 18 examples, 0 failures
Specs ampliados com seed idempotente: 60 examples, 0 failures
rails zeitwerk:check: All is good!
Frontend Jest: 2 suites passed, 11 tests passed
```

`npm run typecheck` continua com erros amplos preexistentes do frontend, fora deste lote.

### Follow-ups nao bloqueantes

1. Adicionar indice GIN dedicado antes de ampliar significativamente a base.
2. Calibrar relevancia e substituir `confidence_score=1.0` fixo.
3. Revisar vocabulario legado de intents e score em uma fase propria.

## Decisao pos-hotfix

Hotfix preparado para revisao, sem commit, push ou ship. `/gsd-ship` continua nao autorizado nesta rodada.
