# UAT - Fase 4 MobiVolt AI Knowledge Base / Support Agent

Data: 2026-06-01
Resultado: PASS do hotfix P1/P2 - ship nao executado

## Matriz de verificacao

| # | Criterio | Status | Evidencia |
|---|---|---|---|
| 1 | `KnowledgeArticle` separado de `Article` | PASS | Model e tabela proprios. |
| 2 | `KnowledgeArticle` pertence a `Category` | PASS | `belongs_to :category`. |
| 3 | `Article` de blog nao alterado indevidamente | PASS | Nenhuma alteracao da Fase 4 em `app/models/article.rb`. |
| 4 | `pg_search` com `title` e `content` | PASS | `search_by_text` usa pesos A/B; spec passou. |
| 5 | Apenas artigos publicados na busca | FAIL | Scope aceita `published_at=nil`; artigo sem data pode aparecer imediatamente. |
| 6 | Drafts ignorados | PASS | Spec dedicado passou. |
| 7 | Retorno maximo de 3 artigos | PASS | `.limit(3)`; spec passou. |
| 8 | Array vazio sem resultado ou em erro | PARTIAL | Sem resultado passou; rescue existe, mas falta spec dedicado para erro. |
| 9 | `SupportAgent` segue `BaseAgent` | PASS | Heranca direta confirmada. |
| 10 | Acionado apenas para intents tecnicas | PARTIAL | Dispatch e restrito, mas router nao alcanca 7 dos 10 FAQs naturais. |
| 11 | LLM recebe contexto controlado | PASS | LLM so e chamado apos recuperacao de artigos. |
| 12 | Prompt exige resposta estrita | PASS | Instrucao explicita no contexto. |
| 13 | Nao inventar resposta sem contexto | PASS | Sem artigos, nao chama LLM. |
| 14 | Fallback honesto e curto | PASS | Spec dedicado passou. |
| 15 | `SupportAgent` retorna `should_trigger_lead=false` | PASS | Spec dedicado passou. |
| 16 | Nao recomendar empresas | PASS | Metadata sem empresas e instrucao negativa ao LLM. |
| 17 | Nao criar `ChatLead` | PASS | Nenhuma persistencia no agent. |
| 18 | Recommendation agent preservado | PARTIAL | Responsabilidade preservada, mas specs vizinhos falham. |
| 19 | Lead qualifier centralizado | FAIL | Novas intents tecnicas podem disparar lead por contagem de mensagens. |
| 20 | CRM handoff preservado | FAIL | Rescue chama `log_error` inexistente; lead existente tambem pode ser atualizado por pergunta informativa. |
| 21 | Support agent apenas com `MOBIVOLT_AGENTS_ENABLED=true` | PASS | Guard no orchestrator confirmado. |
| 22 | Flag false preserva fluxo legado | PARTIAL | Fluxo existe, mas novas intents tecnicas em `commercial_intents` geram spam com router ligado. |
| 23 | Metadata `support_answer` completo | PASS | Spec valida type, sources, categoria e confidence. |
| 24 | `ChatWidget` compativel | PASS | Leitura estatica: suporte continua como texto comum. |
| 25 | `ChatCompanyRecommendations` compativel | PASS | 6 testes frontend passaram. |
| 26 | Active Admin registrado | PASS | Registro carregou no `zeitwerk:check`. |
| 27 | Seed knowledge base idempotente | PARTIAL | Nao duplica slug, mas republica draft manual e atualiza `published_at` em toda execucao. |
| 28 | Correcao `saas_plan_setup` segura | PARTIAL | Ajuste coerente; seed completo nao foi executado nesta rodada. |
| 29 | Inflector CRM sem quebrar autoload | PASS | `rails zeitwerk:check`: `All is good!`. |
| 30 | `commercial_intents` sem lead spam | FAIL | `financing_question` e `ev_charger_question` foram tratados como comerciais. |
| 31 | Eventos PostHog do suporte sem PII | PASS | Specs validam propriedades permitidas. |
| 32 | PostHog sem mensagem completa ou PII | PASS | Eventos do SupportAgent nao enviam conteudo. |
| 33 | Specs RSpec da Fase 4 | PASS | 14 exemplos, 0 falhas. |
| 34 | Walkthrough atualizado | PASS | `walkthrough.md` criado nesta rodada. |
| 35 | UAT atualizado | PASS | Este documento. |

## Verificacoes adicionais

| Verificacao | Resultado |
|---|---|
| Specs backend ampliados | FAIL: 37 exemplos, 6 falhas |
| `rails zeitwerk:check` | PASS |
| Teste frontend de recommendations | PASS: 6 testes |
| Teste frontend de markdown | FAIL: import incorreto no spec |
| `npm run typecheck` | FAIL: erros frontend amplos preexistentes |

## Hotfix minimo requerido

1. Cobrir no router os topicos naturais dos FAQs semeados.
2. Tratar `financing_question` e `ev_charger_question` como informativas no `LeadQualifierAgent`, salvo keyword comercial explicita.
3. Remover intents tecnicas informativas da lista legada de `commercial_intents`.
4. Substituir `log_error` inexistente do `CRMHandoffAgent` por logger existente.
5. Impedir enriquecimento de lead existente quando a qualificacao atual for negativa.
6. Exigir `published_at` valido para artigos publicados e filtrar somente datas passadas.
7. Preservar moderacao manual de artigos seed existentes.
8. Remover a query completa do log de erro da busca.
9. Corrigir o import de `MarkdownRenderer.test.tsx`.
10. Adicionar ao Git os arquivos centrais da Fase 4 antes de qualquer deploy.

## Riscos nao bloqueantes para follow-up

1. A busca FTS ainda nao possui indice GIN dedicado.
2. Qualquer resultado FTS recebido pelo agent retorna `confidence_score=1.0`, sem limiar minimo de relevancia.
3. `solar_assessment` esta roteado ao suporte, embora o fluxo futuro possa exigir coleta estruturada de dados.
4. O vocabulario novo de intents ainda diverge de `ChatLead::INTENTS` e do calculador legado de score.

## Revalidacao pos-hotfix

| Verificacao | Resultado |
|---|---|
| FAQs naturais roteados ao suporte | PASS |
| Pergunta tecnica na terceira mensagem sem lead | PASS |
| Urgencia e preco isolados sem lead | PASS |
| Pedido comercial explicito ainda abre lead | PASS |
| `support_answer` nao reabre formulario | PASS |
| CRM preserva lead existente com qualificacao negativa | PASS |
| Rescue do CRM usa logger existente | PASS |
| Draft, futuro e publicado sem data fora da busca | PASS |
| Erro de busca retorna `[]` sem registrar query ou mensagem da excecao | PASS |
| Seed executado duas vezes sem duplicar ou republicar draft manual | PASS |
| Specs backend focados | PASS: 18 exemplos, 0 falhas |
| Specs backend ampliados com seed idempotente | PASS: 60 exemplos, 0 falhas |
| `rails zeitwerk:check` | PASS: `All is good!` |
| Testes frontend | PASS: 2 suites, 11 testes |

`npm run typecheck` permanece com erros amplos preexistentes do frontend, fora do escopo deste hotfix.

## Gate

UAT do hotfix aprovado. `/gsd-ship` nao foi executado e continua fora desta rodada.
