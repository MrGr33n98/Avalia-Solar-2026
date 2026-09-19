# Wave 8 Readiness Audit

Data da auditoria: 2026-09-18

## Escopo

Este documento registra somente o W8.0: evidências verificadas antes de iniciar a Wave 8. Nenhuma atividade W8.1 ou posterior foi implementada. A produção não foi consultada, alterada ou implantada.

## Estado das dependências

| Onda | Estado | Evidência verificada | Limite conhecido |
| --- | --- | --- | --- |
| Wave 3 - Transactional Outbox | PARTIAL | Existem `Outbox`, `Outbox::DispatcherService`, `Outbox::Record`, `Outbox::EventRouter`, `Outbox::DispatchJob` e specs dedicadas em `spec/services/outbox_spec.rb` e `spec/services/outbox_event_flow_spec.rb`. O roteador de eventos é usado por serviços Sales. | As specs próprias da Wave 3 não foram executadas neste closeout, pois estão fora do delta da Wave 7. Não há conclusão sobre o estado de runtime. |
| Wave 4 - Observability | PARTIAL | Existem `Observability::SystemHealthService`, `Observability::OutboxMetrics`, diagnósticos MCP read-only e specs em `spec/services/observability_spec.rb` e `spec/requests/api/v1/mcp/observability_tools_spec.rb`. O Engineering MCP reportou nove engines prontos, com isolamento stdio, replay protection e HITL para escrita. | As specs próprias da Wave 4 e métricas de ambiente não foram executadas neste closeout. Não há afirmação sobre telemetria em produção. |
| Wave 5 - AgentIdentity | PARTIAL | `AgentIdentity` e `Mcp::AgentAuthorizationService` estão presentes; as chamadas Revenue usam identidade, escopos e tenant derivados da autenticação. A ausência de credencial para agente de sistema falha com `missing_agent_credential`. | `spec/services/mcp/agent_authorization_service_spec.rb` tem 11 expectativas históricas sem `X-Agent-Key`; elas precisam de fixtures de credencial válidas para representar a policy atual. Não foram alteradas nesta Wave. |
| Wave 6 - HITL | GREEN | `McpApprovalRequest`, serviços de aprovação e job de execução aprovada existem. Os specs de governança, concorrência e execução aprovada passaram no closeout da Wave 7. | Status limitado ao ambiente de teste; nenhum fluxo externo foi executado. |
| Wave 7 - Revenue & Growth | GREEN | 27 ferramentas Revenue foram registradas e confirmadas por handshake stdio. Os serviços usam `Sales::TenantScope`; R3/R4 seguem `McpApprovalRequest`; o dispatcher de campanhas continua sendo o caminho de envio. O Founder Inbox, proveniência, pontuação explicável, idempotência e métricas sem zero fabricado são cobertos pelo delta e pelos specs executados. | O lint global do frontend continua com dívida fora do delta. Não declarar CI global verde. |

## Gates executados no closeout

- Revenue, request, policy, governança HITL, idempotência e tenant isolation: 59 exemplos, 0 falhas.
- Migration Wave 7 em `RAILS_ENV=test`: rollback e reaplicação concluídos.
- Formatação backend dos novos artefatos Wave 7: RuboCop `Layout`, 0 offenses.
- Frontend Wave 7: `typecheck`, ESLint direcionado e Prettier direcionado concluídos.
- MCP Platform Core: build e 29 testes concluídos; adapter Avalia e Avalia MCP compilados.
- Handshake MCP stdio com valores inertes: 27 ferramentas `revenue_*`; `revenue_request_campaign_send` não é read-only.
- Lint global frontend: falha por dívida fora dos arquivos da Wave 7. Os arquivos frontend da Wave 7 não têm erros direcionados.

## Condições antes de W8.1

1. Corrigir ou atualizar as fixtures da suite Wave 5 para autenticar agentes de sistema sem reduzir a exigência de `X-Agent-Key`.
2. Executar as suites dedicadas de Wave 3 e Wave 4 e registrar seus resultados antes de depender delas em funcionalidade nova.
3. Validar configuração autenticada e integrações de runtime somente em ambiente autorizado. Esta auditoria não criou nem modificou `AVALIA_MCP_API_KEY`.
4. Resolver separadamente a dívida de lint global do frontend. Ela não foi introduzida pela Wave 7.

## Decisão

W8.0 está concluída como auditoria de readiness. A Wave 8 não deve avançar para W8.1 enquanto os itens PARTIAL necessários ao seu escopo não forem verificados no ambiente autorizado.
