# Code Review - Fase 4 MobiVolt AI Knowledge Base / Support Agent

Data: 2026-06-01
Resultado: bloqueios P1/P2 corrigidos; pronto para revisao final sem ship

## Findings bloqueantes

### P1 - Arquivos centrais da Fase 4 ainda nao estao no Git

Arquivos:

- `AB0-1-back/app/models/knowledge_article.rb`
- `AB0-1-back/app/admin/knowledge_articles.rb`
- `AB0-1-back/app/services/chat/knowledge_base_search_service.rb`
- `AB0-1-back/app/services/chat/agents/support_agent.rb`
- `AB0-1-back/db/migrate/20260601200000_create_knowledge_articles.rb`
- `AB0-1-back/db/seeds/knowledge_base.rb`
- specs novos da Fase 4

O orquestrador rastreado referencia `SupportAgent`, mas os novos arquivos aparecem como `??`. Um deploy por commit ficaria quebrado.

Hotfix minimo: incluir os arquivos da Fase 4 no proximo commit depois da validacao.

### P1 - FAQs semeados nao chegam ao SupportAgent

Arquivo: `AB0-1-back/app/services/chat/intent_router_service.rb`

O router cobre manutencao, wallbox e financiamento, mas nao cobre termos naturais de 7 dos 10 FAQs iniciais. Perguntas como `o que e microinversor?`, `o que e energia injetada?` e `o que e bateria solar?` caem em `fallback`, entao a busca FTS nem e executada.

Hotfix minimo: ampliar somente o regex de `solar_support` e o regex de mobilidade para os topicos presentes nos seeds.

### P1 - Perguntas tecnicas podem gerar lead spam

Arquivos:

- `AB0-1-back/app/services/chat/agents/lead_qualifier_agent.rb`
- `AB0-1-back/app/services/chat/orchestrator_service.rb`

`financing_question` e `ev_charger_question` nao entram no grupo informativo do qualifier. Apos a terceira mensagem, caem na regra generica `engagement_count`. Com agentes desligados e router ligado, ambas tambem foram adicionadas a `commercial_intents`.

Hotfix minimo: tratar essas duas intents como informativas salvo keyword comercial explicita e remove-las da lista legada de intents sempre comerciais.

### P1 - Rescue do CRM handoff pode falhar

Arquivo: `AB0-1-back/app/services/chat/agents/crm_handoff_agent.rb`

O rescue chama `log_error`, mas a classe nao implementa esse metodo. Uma falha de banco durante o handoff pode ser mascarada por outro `NoMethodError`.

Hotfix minimo: usar `Rails.logger.error`.

### P1 - Handoff pode enriquecer lead durante pergunta informativa

Arquivo: `AB0-1-back/app/services/chat/agents/crm_handoff_agent.rb`

Quando ja existe `ChatLead`, o agent atualiza score, temperatura e intent se o score calculado subir, mesmo que `should_trigger_lead=false`. Isso pode contaminar CRM com intent de suporte.

Hotfix minimo: nao atualizar lead existente quando a qualificacao atual for negativa.

## Findings importantes

### P2 - Artigo sem data pode ser publicado imediatamente

Arquivos:

- `AB0-1-back/app/models/knowledge_article.rb`
- `AB0-1-back/db/migrate/20260601200000_create_knowledge_articles.rb`

O scope `published` inclui `published_at IS NULL`, enquanto a migration usa status default `published` e data nullable. O Active Admin permite salvar essa combinacao.

Hotfix minimo: exigir `published_at` quando status for `published` e filtrar somente `published_at <= Time.current`.

### P2 - Query completa pode vazar PII em log

Arquivo: `AB0-1-back/app/services/chat/knowledge_base_search_service.rb`

Em erro de busca, o log inclui `@query`. Como a query e a mensagem do usuario, ela pode conter nome, telefone, e-mail, CPF ou endereco.

Hotfix minimo: registrar somente classe do erro e mensagem tecnica, sem query.

### P2 - Relevancia e confidence superestimadas

Arquivos:

- `AB0-1-back/app/models/knowledge_article.rb`
- `AB0-1-back/app/services/chat/agents/support_agent.rb`

A busca aceita qualquer palavra e nao aplica limiar minimo de relevancia. Se houver qualquer artigo, o metadata retorna `confidence_score=1.0`.

Hotfix minimo: adicionar limiar conservador ou reduzir confidence quando a busca nao demonstrar relevancia forte. Pode ser feito sem pgvector.

### P2 - Seed desfaz moderacao manual

Arquivo: `AB0-1-back/db/seeds/knowledge_base.rb`

O seed evita duplicatas por slug, mas sobrescreve `status: 'published'` e `published_at: Time.current` em toda execucao. Um artigo colocado manualmente em draft volta a publico no proximo seed.

Hotfix minimo: preencher atributos de publicacao somente ao criar registro novo.

### P2 - FTS sem indice dedicado

Arquivo: `AB0-1-back/db/migrate/20260601200000_create_knowledge_articles.rb`

Ha indices para `slug`, `status` e `category_id`, mas nao para o vetor de texto. Para os 10 FAQs iniciais isso nao bloqueia; antes de escalar a base, adicionar indice GIN compativel com a consulta.

## Findings de teste

### P3 - Spec de MarkdownRenderer importa caminho incorreto

Arquivo: `AB0-1-front/components/__tests__/MarkdownRenderer.test.tsx`

O spec usa `./MarkdownRenderer`, mas o componente esta em `../chat/MarkdownRenderer`.

### P3 - Cobertura faltante

Adicionar specs para:

- artigo publicado no futuro nao aparecer;
- erro de busca retornar `[]` sem logar query;
- FAQs semeados rotearem para suporte;
- terceira pergunta tecnica nao abrir formulario;
- flags desligadas nao desviarem para suporte;
- seed executado duas vezes nao duplicar artigos;
- falha no CRM handoff retornar fallback seguro.

### P3 - Vocabulario novo de intents diverge do legado

Arquivos:

- `AB0-1-back/app/models/chat_lead.rb`
- `AB0-1-back/app/services/chat/mobivolt/lead_score_calculator.rb`

Os novos nomes de intent ainda nao aparecem no catalogo e no calculador legado. Isso nao bloqueia a resposta tecnica da Fase 4, mas pode subpontuar leads comerciais gerados pelo router novo.

## Resultado

Nao recomendar `/gsd-ship` ate aplicar os hotfixes P1/P2 minimos e repetir a suite focada e ampliada.

## Revalidacao pos-hotfix

Os findings P1/P2 bloqueantes foram tratados:

1. Arquivos centrais da Fase 4 foram preparados para staging seletivo.
2. Regex do router cobre FAQs naturais e preserva prioridade de recomendacao com cotacao.
3. Qualificacao e fluxo legado nao abrem lead em perguntas tecnicas informativas.
4. `support_answer` negativo nao e reaberto pelo orquestrador.
5. CRM nao contamina lead existente quando a qualificacao atual e negativa.
6. Rescue do CRM usa `Rails.logger.error`.
7. Publicacao exige `published_at` valido e exclui datas futuras.
8. Busca nao registra query, mensagem do usuario ou mensagem da excecao.
9. Seed preserva moderacao editorial existente.
10. Import do spec `MarkdownRenderer` foi corrigido.

Evidencia:

```text
Specs focados: 18 examples, 0 failures
Specs ampliados com seed idempotente: 60 examples, 0 failures
rails zeitwerk:check: All is good!
Frontend Jest: 2 suites passed, 11 tests passed
```

Permanecem como follow-up nao bloqueante: indice GIN dedicado, calibracao de relevancia e substituicao do `confidence_score=1.0` fixo. Nao executar `/gsd-ship` nesta rodada.
