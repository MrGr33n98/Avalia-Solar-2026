# PDR — Company AI Assistant V1

Data: 2026-11-21
Status: Em execução incremental
Owner: Produto + Engenharia de Plataforma
Branch de implementação: `feat/company-ai-assistant-ddd-tdd-v1`
Commit publicado: `1f594a32fedf862e2b96167d5feb7b13a4a5e002`

## 1. Resumo executivo

O Company AI Assistant é um assistente conversacional público, opcional e tenant-bound para páginas de empresas do Avalia Solar. Ele responde usando somente informações públicas e aprovadas da própria empresa, executa apenas ações allowlisted e pode encaminhar o visitante para orçamento ou atendimento humano.

O V1 já possui o núcleo técnico de sessão, workflow, segurança, quota, idempotência, widget e integração com o gateway de LLM existente. A feature continua desligada por padrão (`COMPANY_AI_ENABLED=false`) até que os gates de privacidade, reconciliação de custos, handoff operacional, testes de integração e rollout sejam concluídos.

Este PDR não inclui WhatsApp, Evolution API ou Chat SDK. A primeira entrega é exclusivamente web/PWA, utilizando a infraestrutura Rails + Next.js já existente.

## 2. Problema

Empresas com perfil público precisam responder dúvidas recorrentes e converter intenção em orçamento sem depender de atendimento manual para cada pergunta. O produto, porém, precisa preservar:

- isolamento entre empresas;
- controle comercial por plano e entitlement;
- segurança contra prompt injection e instruções não autorizadas;
- rastreabilidade de workflow, uso e ações;
- compatibilidade com o chat e o Lead Wizard existentes;
- privacidade de visitantes e empresas.

Sem um contrato explícito, um assistente poderia responder com dados de outra empresa, inventar preços, autorizar ações pelo frontend ou gerar custo sem controle.

## 3. Capacidade desejada

Permitir que um visitante, na página pública de uma empresa elegível, abra um assistente Company AI, escolha ou escreva uma pergunta, receba uma resposta baseada em contexto público aprovado e inicie orçamento ou solicite atendimento humano quando permitido.

O operador da empresa deve conseguir configurar e publicar workflows versionados, com nós e ações limitados, sem executar código arbitrário.

## 4. Objetivos

### 4.1 Objetivos de produto

- Aumentar a resolução de dúvidas públicas sem intervenção humana.
- Transformar perguntas qualificadas em início de orçamento.
- Reduzir o tempo até o atendimento humano quando o bot não for suficiente.
- Dar à empresa controle sobre saudação, FAQs, produtos e fluxo de conversa.

### 4.2 Objetivos de engenharia

- Manter autoridade e tenant scope no backend.
- Usar workflow imutável, validado e allowlisted.
- Evitar duplicidade com o chat geral/MobiVolt.
- Controlar quota, idempotência e custo por empresa.
- Permitir rollout gradual, auditoria e rollback sem apagar histórico.

### 4.3 Metas propostas

As metas abaixo são targets de rollout; não são métricas já observadas em produção.

| Métrica | Meta V1 | Como medir | Estado atual |
|---|---:|---|---|
| Disponibilidade do endpoint de mensagens | >= 99,5% | monitoramento por status 2xx/4xx/5xx | A instrumentar |
| p95 de resposta warm-cache | < 2 s | métrica server-side por request | A medir |
| p95 de resposta cold-cache | < 5 s | métrica server-side por request | A medir |
| Respostas sem contexto inventado | 100% nos testes de contrato | suíte de segurança + revisão amostral | Parcial |
| Ações fora da allowlist | 0 | testes negativos e auditoria | 0 nos testes atuais |
| Vazamento cross-tenant | 0 | request specs e red-team | 0 nos testes atuais |
| Mensagens duplicadas por retry | 0 respostas duplicadas | `client_message_id` + ledger | Coberto no backend |
| Widget renderizado quando feature está desligada | 0 | teste de capability | Coberto |
| Conversão assistida em orçamento | baseline + incremento a definir | funil widget -> quote -> lead | Sem baseline |
| Handoff aceito dentro do horário | >= 95% | inbox event + sessão | A instrumentar |

## 5. Não objetivos

- WhatsApp, Evolution API, n8n ou Chat SDK no V1.
- Treinar ou ajustar um modelo próprio.
- Permitir que o LLM execute SQL, HTTP, código ou ferramentas arbitrárias.
- Substituir o Lead Wizard ou o chat P2P existente.
- Usar eventos PostHog como registro financeiro ou fonte de cobrança.
- Ingerir documentos não revisados automaticamente no contexto público.
- Ativar a feature globalmente antes dos gates de lançamento.

## 6. Usuários e atores

| Ator | Necessidade | Superfície |
|---|---|---|
| Visitante | Tirar dúvida sobre uma empresa e iniciar próximo passo | Brand Page/PWA |
| Empresa administradora | Configurar, revisar e publicar o fluxo | Company AI Studio/Admin |
| Agente humano | Receber e assumir handoff | Live Inbox existente |
| Produto/Operações | Controlar rollout, quota, custos e incidentes | Logs, métricas, auditoria |
| Engenharia | Evoluir workflow e integrações com segurança | Rails, Next.js, CI/CD |

## 7. Jornadas do usuário

### 7.1 Visitante — pergunta respondida

1. O visitante abre `/companies/:id`.
2. O frontend consulta o capability endpoint.
3. Se a empresa não for elegível, o widget não aparece e o chat geral permanece intacto.
4. Se for elegível, o widget aparece após a Brand Page.
5. O visitante abre o widget.
6. O frontend cria uma sessão pública e recebe `session_id`, greeting e token assinado.
7. O visitante escolhe uma opção ou escreve uma pergunta.
8. O backend valida sessão, tenant, quota, rate limit e segurança.
9. O workflow seleciona a próxima etapa.
10. O retriever busca somente perfil, produto ou FAQ públicos e aprovados.
11. O gateway de LLM redige a resposta dentro do contexto aprovado.
12. O frontend renderiza a resposta e registra somente eventos de produto sem texto da conversa.

### 7.2 Visitante — início de orçamento

1. O visitante escolhe “Solicitar orçamento”.
2. O workflow verifica se a empresa possui `quote_feature_enabled?`.
3. Se permitido, o backend retorna a ação `open_quote_wizard` com o `company_id` validado.
4. O frontend abre o Lead Wizard existente.
5. A criação do lead continua sendo responsabilidade do fluxo existente, não de um evento de analytics.

### 7.3 Visitante — handoff humano

1. O visitante seleciona “Falar com uma pessoa” ou chega a um nó de handoff.
2. O backend verifica a configuração do workflow e a disponibilidade operacional.
3. A `ChatSession` muda para `waiting_agent`.
4. O bot deixa de responder automaticamente enquanto a sessão estiver sob atendimento humano.
5. O Live Inbox deve assumir a conversa e registrar o agente responsável.

### 7.4 Empresa — publicação de workflow

1. O administrador abre o Company AI Studio.
2. Cria ou edita um draft usando nós estruturados.
3. O sistema valida alcance, ciclos proibidos, tipos e ações allowlisted.
4. O administrador publica uma versão imutável.
5. A publicação gera auditoria.
6. Novas sessões usam a versão publicada; sessões existentes permanecem vinculadas à versão que iniciaram.
7. Rollback aponta novas sessões para uma versão anterior sem alterar o histórico.

### 7.5 Falhas e fallback

| Situação | Comportamento esperado |
|---|---|
| Feature desligada | Não renderizar widget; chat geral continua funcionando |
| Empresa suspensa | Capability e sessão retornam indisponível |
| Token inválido | Retornar 403 sem processar mensagem |
| Tenant divergente | Retornar 403 sem revelar dados |
| Prompt injection | Rejeitar mensagem antes de persistir |
| Quota excedida | Retornar 429 sem chamar o modelo |
| LLM indisponível | Responder com fallback seguro ou encaminhar humano |
| Sem evidência aprovada | Informar ausência de informação e oferecer handoff |
| Retry do cliente | Retornar resultado idempotente |

## 8. Requisitos funcionais

### RF-01 — Capability e rollout

O backend deve informar se a empresa pode usar Company AI considerando flag global, status ativo, plano, entitlement, assistant habilitado e workflow publicado.

Critérios de aceite:

- default fail-closed;
- empresa suspensa não recebe capability ativo;
- frontend não renderiza widget quando `enabled=false`;
- MobiVolt/chat geral não é desabilitado por indisponibilidade do Company AI.

Estado: implementado parcialmente; falta arbitration entre Company AI e chat geral.

### RF-02 — Sessão tenant-bound

O backend deve criar sessão pública vinculada à empresa resolvida no servidor, nunca confiando apenas em `page_url` ou `company_id` enviado pelo cliente.

Critérios de aceite:

- token assinado obrigatório para mensagens;
- sessão contém empresa, vertical e versão do workflow;
- token de uma empresa não acessa outra;
- sessão não pode ser reutilizada em rota de outro tenant.

Estado: implementado e coberto por request specs.

### RF-03 — Mensagens e idempotência

O endpoint deve aceitar conteúdo limitado, `client_message_id` e request ID, persistir mensagens e devolver resposta determinística para retries.

Critérios de aceite:

- conteúdo vazio ou acima do limite é rejeitado;
- retry com mesmo `client_message_id` não cria nova mensagem nem nova cobrança;
- quota é reservada uma vez e liquidada/released conforme resultado;
- respostas não expõem metadata interna.

Estado: implementado; reconciliação do provedor ainda é parcial.

### RF-04 — Workflow versionado

Workflows publicados devem ser grafos finitos, alcançáveis, imutáveis e compostos somente por tipos e ações aprovados.

Tipos mínimos:

- `message`;
- `choice`;
- `knowledge`;
- `condition`;
- `action`;
- `handoff`;
- `end`.

Estado: implementado no validator/runner; rollback operacional precisa de teste integrado.

### RF-05 — Conhecimento público aprovado

O retriever deve consultar somente perfil público, produtos publicados e FAQs aprovadas da mesma empresa.

Critérios de aceite:

- documentos privados ou não aprovados não entram no contexto;
- cada evidência possui origem e versão;
- ausência de evidência produz fallback seguro;
- o LLM não pode substituir a ausência de evidência por invenção.

Estado: perfil/produto/FAQ implementados; PDF/CSV/XLSX ainda pendentes.

### RF-06 — Ações comerciais controladas

O modelo não autoriza ações. O workflow e o backend devem validar orçamento, handoff e demais ações.

Estado: orçamento e handoff básicos implementados; operação completa depende de Inbox e calendário.

### RF-07 — Widget público

O widget deve ser carregado somente quando elegível, funcionar em mobile e não duplicar o chat geral.

Critérios de aceite:

- visibilidade >= 50% por 1 segundo registra `company_ai_widget_viewed`;
- abertura registra `company_ai_widget_opened`;
- primeira pergunta só registra após resposta HTTP aceita;
- conteúdo da conversa não é enviado à telemetria;
- estados loading, erro, vazio e handoff são compreensíveis.

Estado: implementação inicial entregue; teste Jest e jornada Playwright ainda pendentes.

### RF-08 — Operação e auditoria

O sistema deve permitir observar publicação, uso, quota, falhas, handoff e custo por empresa.

Estado: auditoria e ledger básicos existem; outbox, dashboards e reconciliação assinada ainda pendentes.

## 9. Requisitos não funcionais

| ID | Requisito | Critério |
|---|---|---|
| RNF-01 | Segurança | Nenhum acesso cross-tenant nos testes negativos e produção |
| RNF-02 | Privacidade | Não enviar texto, IP, contato ou documento ao PostHog |
| RNF-03 | Disponibilidade | Fallback seguro quando LLM, Redis ou integração auxiliar estiverem indisponíveis |
| RNF-04 | Performance | p95 warm < 2 s e cold < 5 s antes do rollout |
| RNF-05 | Escala | Rate limit e quota por empresa/IP sem lock global |
| RNF-06 | Consistência | Mensagem e uso idempotentes por request/client ID |
| RNF-07 | Acessibilidade | Teclado, leitor de tela, foco e contraste na Brand Page |
| RNF-08 | Observabilidade | Logs estruturados com request/session/workflow IDs, sem conteúdo sensível |
| RNF-09 | Rollback | Flag global e versão anterior permitem desativar sem migration destrutiva |
| RNF-10 | Compatibilidade | MobiVolt/chat geral e Lead Wizard permanecem operacionais |

## 10. Contratos e interfaces

### 10.1 Capability

`GET /api/v1/companies/:id/ai_capability`

Resposta mínima:

```json
{
  "enabled": true,
  "mode": "company",
  "schema_version": 1,
  "company_id": 123
}
```

### 10.2 Criar sessão

`POST /api/v1/companies/:id/ai_sessions`

Resposta mínima:

```json
{
  "session_id": 456,
  "access_token": "signed-session-token",
  "workflow_version_id": 7,
  "initial_message": {
    "id": 900,
    "role": "assistant",
    "content": "Olá! Como posso ajudar?"
  }
}
```

### 10.3 Mensagem

`POST /api/v1/companies/:id/ai_sessions/:session_id/messages`

Header obrigatório: `X-Chat-Session-Token`.

Payload:

```json
{
  "content": "Quais produtos vocês oferecem?",
  "client_message_id": "client-message-uuid",
  "request_id": "request-uuid"
}
```

O contrato completo está em [`openapi-foundation.yaml`](./openapi-foundation.yaml).

## 11. Modelo de estados

### 11.1 Assistente

```text
disabled -> configured -> draft -> published -> rolled_back
                         \-> archived
```

Regras:

- somente versão publicada participa de novas sessões;
- versão publicada é imutável;
- rollback altera o ponteiro de novas sessões, não o histórico;
- flag global desligada sempre vence qualquer entitlement.

### 11.2 Sessão

```text
created/bot_only -> bot_only -> waiting_agent -> human_manual -> archived
                         \-> archived
```

Regras:

- `human_manual` não chama o LLM;
- sessão preserva empresa e workflow version;
- encerramento não apaga mensagens por padrão;
- retenção e deleção devem obedecer política aprovada.

## 12. Story points

Escala Fibonacci: 1, 2, 3, 5, 8, 13. Os pontos incluem implementação, testes e integração; não incluem espera por credenciais externas.

| ID | Entrega | Estado | SP |
|---|---|---|---:|
| SP-01 | Capability, FeatureGate e entitlement fail-closed | Concluído | 5 |
| SP-02 | Modelos, migrations, auditoria e UsageLedger | Concluído | 8 |
| SP-03 | Validator, runner, calendar e publisher | Concluído | 8 |
| SP-04 | Admin Studio e editor de workflow | Concluído | 8 |
| SP-05 | Sessão pública e token assinado | Concluído | 5 |
| SP-06 | Endpoint de mensagens, idempotência e quota | Concluído | 8 |
| SP-07 | Retrieval público e resposta pelo gateway existente | Concluído | 8 |
| SP-08 | Widget Brand Page e telemetria client-side | Concluído parcial | 8 |
| SP-09 | Arbitration Company AI/MobiVolt | Pendente | 5 |
| SP-10 | Reconciliação assinada de tokens e custo | Pendente | 8 |
| SP-11 | Handoff completo com calendário e Live Inbox | Pendente | 8 |
| SP-12 | Ingestão aprovada PDF/CSV/XLSX e provenance | Pendente | 13 |
| SP-13 | Outbox, dashboards e eventos server-side | Pendente | 8 |
| SP-14 | Hardening antiabuso, concorrência e red-team | Pendente | 8 |
| SP-15 | Playwright responsivo e jornada autenticada | Pendente | 8 |
| SP-16 | Load test, SLO, rollback drill e release evidence | Pendente | 8 |
| SP-17 | Jest do widget e correção do ambiente de lockfile | Parcial | 3 |
| SP-18 | Piloto, consentimento, retenção e revisão de privacidade | Pendente | 5 |

Estimativa restante: **82 SP**. É uma estimativa de backlog, não um prazo garantido. A maior incerteza está em ingestão de documentos, reconciliação do provedor e operação do Live Inbox.

## 13. Backlog priorizado / task list

### Wave 0 — fechar segurança e contrato

| ID | Tarefa | Dependência | SP | Aceite | Estado |
|---|---|---|---:|---|---|
| W0-01 | Corrigir/normalizar dependências SWC do frontend em ambiente CI | Maintainer/lockfile | 2 | Jest roda sem patch automático do Next | Pendente |
| W0-02 | Criar teste Jest do widget para capability, sessão, header e primeira pergunta | W0-01 | 3 | Teste verde sem mock de produção | Parcial |
| W0-03 | Implementar arbitration entre Company AI e chat geral | RF-01 | 5 | Nunca há dois widgets concorrentes; fallback geral permanece | Pendente |
| W0-04 | Adicionar logs/metrics server-side de request, latency, fallback e quota | W0-06 | 5 | Dashboard técnico sem conteúdo de conversa | Pendente |
| W0-05 | Definir consentimento, retenção e deleção de mensagens | Legal/Produto | 3 | Política aprovada e testes de retenção | Pendente |
| W0-06 | Revisar segurança com threat model e red-team de prompt injection | W0-03 | 8 | Casos negativos documentados e zero vazamento | Pendente |

### Wave 1 — valor comercial e operação

| ID | Tarefa | Dependência | SP | Aceite | Estado |
|---|---|---|---:|---|---|
| W1-01 | Implementar reconciliação de tokens/custo assinada pelo provider | Gateway/contrato provider | 8 | Cada request tem custo verificável e não duplica cobrança | Pendente |
| W1-02 | Finalizar handoff com disponibilidade real, agente e calendário | Live Inbox | 8 | Sessão chega ao agente e retorna estado auditável | Pendente |
| W1-03 | Integrar ação de orçamento com evento/lead after-commit | Lead Wizard | 5 | `lead_created` relaciona sessão sem depender de PostHog | Pendente |
| W1-04 | Criar outbox de eventos Company AI | Banco/worker | 8 | Retry, dedupe e entrega observável | Pendente |
| W1-05 | Criar dashboard de funil e custo por empresa | W0-04/W1-04 | 5 | Viewed -> opened -> accepted -> answer -> quote -> lead | Pendente |

### Wave 2 — conhecimento e escala

| ID | Tarefa | Dependência | SP | Aceite | Estado |
|---|---|---|---:|---|---|
| W2-01 | Pipeline de PDF/CSV/XLSX aprovado | W0-06 | 13 | Extração, moderação, provenance e exclusão funcionam | Pendente |
| W2-02 | Limites de concorrência e abuso por IP/empresa/sessão | W0-06 | 5 | Carga adversarial não degrada tenants vizinhos | Pendente |
| W2-03 | Load test do endpoint e do retriever | W0-04 | 5 | SLOs de p95 comprovados em cenário representativo | Pendente |
| W2-04 | Rollback de workflow e feature flag drill | W1-04 | 3 | Desativação sem migration destrutiva | Pendente |

### Wave 3 — lançamento controlado

| ID | Tarefa | Dependência | SP | Aceite | Estado |
|---|---|---|---:|---|---|
| W3-01 | Jornada Playwright em 320/360/390/430 px | W0-02/W1-02 | 5 | Fluxos visitante, quote e handoff verdes | Pendente |
| W3-02 | CI completo com backend, frontend, segurança e E2E | W3-01 | 5 | Checks obrigatórios verdes no PR | Pendente |
| W3-03 | Piloto com empresas autorizadas | W1-05/W2-04 | 5 | Feedback, custos e incidentes registrados | Pendente |
| W3-04 | Runbook de operação e decisão de ativação | Todas | 3 | Go/no-go assinado por Produto, Engenharia e Segurança | Pendente |

## 14. Critérios de pronto para ativação

A feature somente pode sair do estado OFF quando todos os itens abaixo forem verdadeiros:

- [ ] `COMPANY_AI_ENABLED` controlado por rollout gradual.
- [ ] Testes de tenant isolation, auth e prompt injection verdes.
- [ ] Jest, TypeScript, ESLint, RSpec e Playwright verdes.
- [ ] Reconciliação real de tokens/custos validada.
- [ ] Quota e rate limit validados sob concorrência.
- [ ] Handoff operacional validado no Live Inbox.
- [ ] Política de consentimento, retenção e deleção aprovada.
- [ ] Outbox e dashboards server-side ativos.
- [ ] p95 cold/warm medidos em cenário representativo.
- [ ] Rollback executado em staging.
- [ ] Nenhuma credencial, conteúdo de conversa ou segredo exposto.
- [ ] Plano de suporte e runbook publicados.

## 15. Riscos e mitigação

| Risco | Impacto | Mitigação |
|---|---|---|
| Resposta inventada pelo LLM | Alto | Contexto aprovado, fallback seguro, red-team e revisão |
| Vazamento entre empresas | Crítico | Token/session tenant-bound, policies e testes negativos |
| Custo não reconciliado | Alto | Reserva idempotente + provider reconciliation antes do rollout |
| Widget duplicado com MobiVolt | Médio | Arbitration server-side e teste de superfície |
| Handoff sem agente | Alto | BusinessCalendar, disponibilidade e fallback claro |
| Documento malicioso | Alto | Moderação, provenance, aprovação e isolamento |
| Lockfile inconsistente | Médio | Corrigir dependências em branch separada/reprodutível |
| Telemetria com dados pessoais | Alto | Schema allowlisted, consentimento e revisão de payload |

## 16. Decisões abertas

1. Qual provedor de LLM será o contrato oficial de token usage e assinatura de custo?
2. Qual política de retenção vale para mensagens de visitantes anônimos?
3. O handoff deve aceitar somente horário comercial ou também fila fora do horário?
4. Qual é o critério de seleção entre Company AI e MobiVolt quando ambos são elegíveis?
5. Quais formatos e campos de documento são aprovados para ingestão no primeiro piloto?
6. Quais empresas participarão do piloto e qual volume máximo diário por empresa?
7. Quais métricas de conversão justificam expansão do rollout?

## 17. Handoff de implementação

O núcleo da capacidade está pronto para continuação direta nesta branch. O próximo passo recomendado é executar `W0-01` a `W0-06`, especialmente corrigindo o ambiente Jest/lockfile, completando arbitration e fazendo o red-team antes de qualquer ativação.

Documentos relacionados:

- [`STATUS.md`](./STATUS.md)
- [`IMPLEMENTATION_PLAN.md`](./IMPLEMENTATION_PLAN.md)
- [`TELEMETRY.md`](./TELEMETRY.md)
- [`openapi-foundation.yaml`](./openapi-foundation.yaml)

Decisão atual: **continuar implementação; não declarar pronto para produção ainda**.
