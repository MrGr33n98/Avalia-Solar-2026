# Revenue Domain Map

## Escopo da auditoria

Mapa produzido a partir dos modelos, services, controllers, rotas e specs presentes em `AB0-1-back/`.
O domínio de Revenue deve estender `Sales` e o AI Control Plane existente. Ele não cria um CRM ou
framework de aprovação paralelo.

| Entidade | Responsabilidade | Relacionamentos | Limite de tenant | Serviços e API existentes | Testes e lacunas observadas |
| --- | --- | --- | --- | --- | --- |
| `Sales::Account` | Empresa prospectada ou cliente no CRM | `Company` opcional; owner; contatos, oportunidades, tarefas e atividades | `company_id` quando presente; caso contrário o owner e `Sales::TenantScope` | `AccountsController`, `AccountsQuery`, merge, duplicidade, exportação e criação a partir de `Company` | Specs de modelo, query e merge. Falta registro normalizado de pesquisa/proveniência. |
| `Sales::Contact` | Pessoa vinculada a uma conta | Conta, empregos, oportunidades do comitê, tarefas, atividades e e-mails | Herdado da conta; `Sales::TenantScope#contacts` é a fonte canônica | `ContactsController`, timeline, engagement e importação | Specs de modelo, timeline e importação. Falta classificação explícita de certeza para dados enriquecidos. |
| `Sales::ContactEmployment` | Vínculo entre pessoa e empresa | Contato e conta | Conta relacionada | `ContactEmploymentsController` | Preserva `source`, `source_url`, `confidence` e `verified_at`; deve ser reutilizado para vínculo pesquisado. |
| `Sales::Opportunity` | Negociação em pipeline | Conta, contato principal, pipeline, estágio, owner, qualificação, tarefas, atividades e comitê | Conta/owner por `Sales::TenantScope#opportunities` | `OpportunitiesController`, criação, mudança de estágio, timeline e forecast | Specs de modelo, query, mudança de estágio e policy. Falta score de prioridade versionado e explicável. |
| `Sales::Pipeline` e `Sales::Stage` | Estrutura e estágios do funil | Pipeline possui estágios e oportunidades; histórico registra transições | Estrutura compartilhada; as oportunidades continuam tenant-scoped | Pipelines e board | Specs de modelo, board e request. Não duplicar estrutura. |
| `Sales::Task` | Próxima ação e follow-up interno | Conta, oportunidade, contato e owner | Escopos de tarefa do `Sales::TenantScope` | `TasksController` e `TodayController` | Specs de modelo e requests. Deve receber criação interna idempotente via Revenue. |
| `Sales::Activity` | Linha do tempo de interação | Conta, oportunidade, contato e actor | Escopos de atividade do `Sales::TenantScope` | `ActivitiesController`, timelines e tracking | Specs de modelo e timelines. Não é prova de contato externo sem evento do provider. |
| `Sales::Qualification` | Registro existente de SPIN/BANT | Uma oportunidade | Herdado da oportunidade | `QualificationsController` | Specs de modelo. Assessment de agente deve ficar separado de fatos e com proveniência. |
| `Sales::Campaign` | Campanha de e-mail e estado de despacho | Empresa, audiência, template, recipients, mensagens e métricas | `company_id` | Campaigns controller, preflight, snapshot, dispatcher e jobs | Specs de preflight, snapshot, dispatcher e jobs. O MCP deve chamar somente o dispatcher canônico após HITL. |
| `Sales::Audience` | Público dinâmico determinístico | Empresa, autor e campanhas | `company_id` | Audiences controller e resolver | Specs do resolver. Snapshot de recipients congela a audiência antes do envio. |
| `Sales::Import` | Importação auditável de leads | Empresa, usuário, linhas e arquivo | `company_id` | Imports controller e pipeline de importação | Specs de parser, normalizador e validação. Não substituir por pesquisa de agente. |
| `Sales::IntelligenceSignal` | Sinal operacional sobre conta, contato ou oportunidade | Conta obrigatória; contato/oportunidade opcionais | Herdado da conta | Sinais e resolvers de próxima ação | Falta campos de por que, evidência, risco, aprovação e deduplicação para funcionar como Founder Inbox. |
| `McpApprovalRequest` | Aprovação HITL, payload canônico, expiração e consumo single-use | Agent identity, tenant, usuário solicitante/aprovador/executor | `tenant_id` validado pelo Control Plane | Approvals controller e services de aprovação/execução | Specs de concorrência, governança e adversarial. Deve ser reutilizado para R3/R4. |
| `AgentIdentity` e `McpAgentCredential` | Identidade, escopos, tools permitidas, orçamento e rate limit do agente | Credencial autenticada e contexto de tenant | `tenant_id` na identidade | `Mcp::AgentAuthorizationService` | Specs de governança. Todas as tools de Revenue devem entrar no catálogo de risco e tools permitidas. |

## Capacidades já disponíveis

- Isolamento de CRM por `Sales::TenantScope`.
- Composição de comitê decisório por `Sales::OpportunityContact` e `Sales::ContactEmployment`.
- Preflight, preview de audiência, snapshot e dispatcher de campanhas.
- Outbox, auditoria estruturada, rate limit, idempotência de aprovação e execução durável.
- Tela de AI Control Plane para aprovações, sem uma fila operacional de Revenue independente.

## Capacidades da Wave 7 ainda ausentes

1. Registro canônico e tenant-safe de pesquisa com proveniência e status de certeza.
2. Priorização de oportunidades com versão, timestamp e razões verificáveis.
3. Founder Inbox que una sinais, follow-ups, drafts e aprovações sem duplicar o HITL.
4. Serviços de Revenue que adaptem o CRM existente a intenções de negócio MCP.
5. Contratos de tool para Revenue no catálogo de risco, com escopos, idempotência e auditoria.
6. Preparação de campanhas e conteúdo sem comunicar-se com provedores externos.

## Invariantes

- Nenhuma tool executa SQL direto.
- `Sales::Campaigns::Dispatcher` é o único caminho de disparo de campanha.
- Dados externos ou inferidos precisam de proveniência; avaliação de agente não é fato de CRM.
- Ações R3/R4 usam `McpApprovalRequest` existente e nunca são autoaprovadas.
- Dados de conta, contato e oportunidade devem ser obtidos de `Sales::TenantScope`, não de IDs fornecidos isoladamente.
