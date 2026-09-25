# Feature Specification: CRM Tenant Isolation & Referential Integrity Hardening

**Feature Branch**: 002-crm-tenant-integrity
**Created**: 2026-09-24
**Status**: Draft — discovery/specification; comportamento futuro não implementado nem verificado
**Input**: CRM Gate 0 — Tenant Isolation & Referential Integrity, solicitação desta sessão.

## Clarifications

### Session 2026-09-24

As decisões abaixo são revalidações do repositório incorporadas ao contrato. A pergunta sobre a semântica comercial da fila Today foi encaminhada ao produto e permanece aberta até resposta explícita.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Operar a própria carteira sem exposição de outra empresa (Priority: P0)

Como SDR ou membro autorizado da equipe comercial, quero consultar Hoje, contas, contatos, oportunidades, tarefas, atividades, qualificação e consentimento somente no universo ao qual tenho acesso, para trabalhar sem exposição de dados de outro tenant.

**Why this priority**: a fila diária e os detalhes relacionados são dados comerciais sensíveis.
**Independent Test**: dois tenants no banco de teste, cada um com todos os recursos do threat model; autenticar User A e comparar coleções, detalhes e contagens com os IDs permitidos.

**Acceptance Scenarios**:

1. Given User A com role Sales e dados A/B, When consulta Hoje, busca, listas ou detalhes, Then apenas dados permitidos de A entram no corpo e nas contagens.
2. Given User A autenticado, When consulta ID de B em endpoint de detalhe ou filho, Then recebe a mesma resposta externa de ID inexistente, sem revelar B.
3. Given User A sem permissão de ação, When tenta ação sobre recurso A, Then recebe 403 conforme autorização de ação; falta de autenticação continua 401.

### User Story 2 - Criar e editar relações coerentes (Priority: P0)

Como vendedor autorizado, quero criar/editar tarefa, atividade, contato, lead, oportunidade, email e vínculos somente com IDs permitidos e mutuamente coerentes, para que um registro não conecte carteiras diferentes.

**Why this priority**: uma FK válida isoladamente não garante ownership nem relação correta.
**Independent Test**: para cada mutação, enviar recurso principal A com FK B, depois confirmar resposta negativa e nenhuma alteração persistida; repetir com todas as FKs A e confirmar o fluxo positivo.

**Acceptance Scenarios**:

1. Given Account A e Opportunity B, When User A cria Task/Activity com ambos os IDs, Then a operação é rejeitada sem criar registro.
2. Given Contact A associado legitimamente a duas contas do tenant A, When User A referencia qualquer vínculo atual autorizado, Then o contrato de múltiplos employments é preservado.
3. Given Contact A, When User A tenta reassociar conta ou owner para B, Then a alteração é rejeitada e os vínculos anteriores permanecem.
4. Given email com oportunidade B, When User A solicita enqueue, Then o vínculo é recusado antes de qualquer job ou envio.
5. Given lead válido com stage de outro pipeline ou contato de B, When User A cria/atualiza, Then não há oportunidade parcialmente criada.

### User Story 3 - Administrar com exceção explícita (Priority: P0)

Como administrador global da plataforma, quero acessar recursos de tenants diferentes quando a função existente permitir, mantendo relações internamente coerentes e comportamento auditável.

**Why this priority**: o código atual contém bypass de admin, mas não deve autorizar misturar Account A com Contact B no mesmo registro.
**Independent Test**: comparar User A/B e admin em cada endpoint; admin consegue a ação global atualmente prevista, enquanto referências incompatíveis seguem rejeitadas.

**Acceptance Scenarios**:

1. Given admin global autenticado, When consulta Account A ou B, Then o acesso global segue o contrato atual da ação.
2. Given admin tentando criar Task com Account A e Opportunity B, When salva, Then recebe erro de relação incompatível.
3. Given vendedor sem role Sales, When chama qualquer endpoint interno protegido, Then recebe 403 de acesso à superfície.

### Edge Cases

- Conta com company_id nulo e owner de empresa: derivar acesso do owner conforme regra legada; conta com company_id e owner de tenant diferente é dado inconsistente e não autoriza nenhum dos lados por mera condição OR.
- Contato com conta primária A e employment em outra conta A: permitido conforme vínculo; employment em conta B: rejeitado.
- Oportunidade owner A apontando para conta B, task owner A apontando para conta B ou note author A apontando para conta B: não podem aparecer por mera condição OR sem validar a âncora relacional; dados legados inconsistentes exigem inventário.
- Mesmo ID numérico em rota aninhada de outro pai deve retornar 404, sem buscar o filho globalmente.
- ID inexistente e ID existente fora do escopo têm resposta externa indistinguível para leitura/escrita sobre recurso identificado; payload de FK inválida usa erro uniforme sem revelar o tenant.
- Email manual com to_email, sem conta/contato/oportunidade, continua possível para usuário autorizado quando esse fluxo existente for válido; testes não executam envio real.
- Admin sem company_id, membro Sales com company_id e vendedor com company_id nulo devem ter comportamento documentado e testado.
- Coleção vazia retorna vazia, e agregados usam exatamente o mesmo universo; não há fallback para consulta global.
- A rota declarada de revogação de consentimento aponta para action inexistente no controller; não assumir revogação HTTP funcional até contrato/rota serem validados.
- Endpoints públicos de forms/tracking não recebem autorização Sales por desenho atual; IDs de entidades internas recebidos deles não podem ser associados diretamente sem comprovação de vínculo/credencial apropriada.

## Requirements *(mandatory)*

### Problem Statement, Actors e Threat Model

O acesso ao CRM interno exige autenticação e role Sales/admin na BaseController, mas vários caminhos buscam registros globalmente ou aceitam FKs sem validação relacional. A consequência possível é leitura, escrita ou contagem cruzada entre tenants. Esta spec define o comportamento uniforme de segurança, preservando rotas e formatos sempre que compatível.

**Atores**: User A e User B, vendedores de Tenant A e Tenant B; membro autorizado do mesmo tenant; owner de conta/contato/oportunidade; admin global; cliente HTTP direto, incluindo frontend; job que executa ação iniciada por usuário. A interface não é fronteira de segurança.

**Fixture conceitual obrigatória**:

| Tenant A | Tenant B |
| --- | --- |
| User A, Account A, Contact A, ContactEmployment A, Opportunity A | User B, Account B, Contact B, ContactEmployment B, Opportunity B |
| Task A, Activity A, Qualification A, Consent A, Email A | Task B, Activity B, Qualification B, Consent B, Email B |

Matriz adversarial: User A → A permitido conforme role; User A → B negado; User A cria/atualiza A referenciando B negado; User A lista somente A; admin global tem bypass explícito nas ações que o domínio já prevê, mantendo coerência entre relações. Os testes não podem usar apenas mocks: request/service/policy tests com banco de teste isolado são a prova principal.

### Functional Requirements

- **FR-001**: Todas as rotas internas Sales MUST exigir autenticação e acesso à superfície antes de consultar ou mutar recursos, salvo endpoints públicos explicitamente documentados.
- **FR-002**: Cada leitura de registro por ID MUST resolver a entidade dentro do universo permitido ao ator e, em rota aninhada, dentro do pai já autorizado.
- **FR-003**: Cada coleção e agregado MUST usar o mesmo universo permitido; filtros enviados pelo cliente apenas restringem o universo, nunca o ampliam.
- **FR-004**: Toda mutação MUST resolver cada FK recebida dentro do escopo permitido antes de atribuí-la ou enfileirar efeito; ID numérico válido não é prova de autorização.
- **FR-005**: Relações Account–Contact–Opportunity–Task–Activity–Qualification–Consent–Email MUST pertencer ao mesmo contexto comercial autorizado; vínculos múltiplos de contato são aceitos somente quando o employment correspondente é legítimo no mesmo tenant.
- **FR-006**: Ownership por User MUST ser validado no servidor; owner_id/user_id/actor_id enviados pelo cliente não podem atribuir um recurso a outro tenant. Actor de atividade deriva da identidade autenticada.
- **FR-007**: Today MUST limitar overdue, today, upcoming, no_next_action e stale ao mesmo universo de tenant e preservar stale superior a cinco dias. A dimensão owner da fila será fixada após decisão de produto; até lá a futura implementação não deve trocar silenciosamente a semântica da tela. Nenhum dado de B pode influenciar resultado de A.
- **FR-008**: Activities LIST/CREATE MUST validar account do pai; CREATE também MUST validar contact/opportunity no mesmo contexto. Não há update/delete de Activity na rota atual.
- **FR-009**: Tasks LIST/CREATE/UPDATE MUST validar account obrigatória, contact/opportunity opcionais e coerência de todas as relações, inclusive no update. O CRUD atual atribui owner=current_user, não aceita owner_id no payload e lista/altera apenas tarefas próprias; Gate 0 preserva essa regra. Atribuição a outro vendedor, inclusive por admin, exige decisão de produto e contrato separado.
- **FR-010**: Qualifications SHOW/UPSERT MUST começar por Opportunity autorizada; consent LIST/CREATE e revogação efetivamente roteada MUST começar por Contact/Consent autorizados.
- **FR-011**: Contacts CREATE/UPDATE MUST validar reassociação de conta e responsável; ContactEmployment INDEX/CREATE/UPDATE/DELETE MUST validar o contato, o vínculo e a conta com o pai da rota.
- **FR-012**: Emails CREATE MUST validar conta, contato e oportunidade mutuamente coerentes antes do enqueue. Template e campaign IDs, quando aceitos por qualquer fluxo de email relacionado, MUST ser resolvidos no tenant; envio e deliverability estão fora desta feature.
- **FR-013**: Lead é a projeção existente de Opportunity. Account é obrigatória; primary_contact e contact_ids adicionais, quando informados, MUST ser acessíveis e ter vínculo atual com a account da oportunidade. Owner atual de criação é o ator autenticado; reassociação em bulk MUST usar usuário permitido da mesma empresa. Pipeline/Stage e Source são catálogos globais: verificar existência/uso permitido e stage do pipeline, sem exigir company_id neles. Conversão/update MUST manter essas invariantes e atomicidade.
- **FR-014**: Opportunity CREATE/UPDATE/BULK e associações de comitê MUST usar conta/oportunidade scoped, owner autorizado, contato compatível e stage pertencente ao pipeline. Pipeline, Stage e Source são catálogos globais no schema atual; autorização é de uso, não posse artificial.
- **FR-015**: Endpoints irmãos comprovadamente capazes de ler/escrever agregados Sales por ID global (ContactEmployment, OpportunityContact, Search, Notes e QuoteItems) entram no Gate 0 somente para impedir acesso/relação cross-tenant no fluxo identificado; demais itens da varredura seguem triagem, não refatoração geral do namespace.
- **FR-016**: Admin bypass MUST ser explícito por ação e testado. `TenantScope`/`AuthorizationService` reconhecem `User#admin?`, mas controllers têm exceções diferentes: Tasks restringe owner=current_user; Campaigns e EmailTemplates permitem escopo global; `AccountLinks` usa Company.find global. Gate 0 não amplia privilégios administrativos onde não há contrato atual. Admin não pode persistir relações incompatíveis entre tenants sem operação administrativa específica e auditada.
- **FR-017**: Para recurso principal ou FK oculto/inexistente, retornar 404 externamente indistinguível; falta de permissão funcional antes da busca, ou após identificar recurso permitido, retorna 403; autenticação ausente retorna 401. Incompatibilidade entre referências individualmente permitidas retorna 422. Preservar envelope/código brownfield da rota quando seguro; remover mensagens de exceção que enumerem IDs ocultos.
- **FR-018**: Tentativas recusadas MUST ser observáveis por evento/log com request_id, ação, tipo de recurso e motivo estável, sem email, nome, corpo de mensagem, payload sensível ou indicação do tenant oculto na resposta.
- **FR-019**: A futura entrega MUST preservar criação válida no mesmo tenant, listagens, pipeline/board, tasks, activities, contacts, email queueing, admin permitido e consumidores API existentes, com mudanças de erro documentadas e testadas.
- **FR-020**: Nenhum teste da feature MUST conectar-se a banco de produção ou chamar provedor real de email. Antes da execução, ambiente, DATABASE_URL e banco efetivo devem ser conferidos e a execução abortada diante de ambiguidade.

### Tenant Contract

A tabela abaixo descreve **o schema/escopo atual**, seguido da regra exigida. Um FK simples no banco não comprova que dois registros pertençam ao mesmo tenant.

| Entidade | Tenant real / ownership atual | Contrato Gate 0 |
| --- | --- | --- |
| Account | company_id opcional + owner_id; TenantScope.accounts aceita owner de membros da empresa OU company_id | `company_id` presente é a âncora canônica. Sem ele, derivar empresa do owner; se owner sem empresa, preservar acesso individual. Divergência owner/company não concede acesso via OR. |
| Contact | sales_account_id obrigatório no schema; user_id opcional; TenantScope.contacts usa conta OU user de membro | Tenant deriva da conta primária; `user_id` é responsável, não tenant. Employments adicionais em contas do mesmo tenant. |
| ContactEmployment | contact_id + account_id; sem company_id | Derivar de ambos; contato e conta scoped e mesmo tenant; preservar múltiplos vínculos. |
| Opportunity/Lead | account_id, owner_id, pipeline_id, stage_id; sem company_id | Tenant pela conta; owner do universo permitido; contato(s) compatíveis. `owner_id` não substitui a âncora. |
| Pipeline/Stage | globais; Stage pertence a Pipeline | Catálogo compartilhado, não tenant inventado; stage do pipeline escolhido. |
| Task | account_id, owner_id, contact/opportunity opcionais | Tenant pela conta, owner atribuído ao ator no CRUD atual; referências opcionais coerentes. |
| Activity | account_id, actor_id, contact/opportunity opcionais | Tenant pela conta; actor autenticado é autoria, não chave de tenant; relações coerentes. |
| Qualification | opportunity_id único | Tenant derivado da oportunidade autorizada. |
| Consent | contact_id e purpose | Tenant derivado da conta primária do contato autorizado. Revogação atual impõe adicionalmente owner da conta ou admin no service. |
| Note | company_id/account/contact/opportunity opcionais; author_id | Âncora e todas as relações presentes coerentes; author permitido. |
| EmailMessage | company_id obrigatório, sender e links account/contact/opportunity opcionais | Company explícita consistente com qualquer relação; email manual sem relação preservado. |
| EmailTemplate | company_id obrigatório; user_id opcional | Tenant direto e ownership/compartilhamento previsto. |
| Campaign/CampaignRecipient | Campaign.company_id opcional no schema; recipient.company_id obrigatório + vínculos | Campanha interna recebe empresa explícita no create e `scoped_campaigns` no read; recipient deriva da campanha e deve ser coerente. Gate 0 cobre FK de template usada em mutação, não operação de campanha. |
| Sequence | sales_email_sequences.company_id obrigatório, user_id opcional; sem execução | Apenas CRUD existente dentro do tenant; engine fora de escopo. |
| Source | catálogo global; Opportunity.source_id opcional | Escolha de origem válida globalmente; não criar tenant artificial. |

**Tenant canônico**: no CRM Sales, `Company` é o agrupamento empresarial quando a conta possui `company_id`; a `Sales::Account` é a âncora do agregado comercial. Conta sem `company_id` deriva o universo permitido de seu owner, como fallback brownfield. Contact, Opportunity/Lead, Task e Activity derivam da respectiva Account; Qualification deriva de Opportunity→Account; Consent de Contact→Account. EmailMessage possui `company_id` direto, que deve coincidir com toda Account derivada de suas relações. `user_id`, `owner_id` e `actor_id` representam responsabilidade/autoria e jamais dão acesso a um agregado cuja Account aponta a outro tenant. `TenantScope` hoje usa condições OR para parte dessas entidades; elas não bastam para validar integridade. Contatos multi-account podem representar duas contas do mesmo tenant, mas não criam uma ponte entre empresas distintas.

**Regra uniforme de lookup**: autenticar → verificar permissão funcional da ação quando já definida → obter relação permitida por `Sales::TenantScope` ou associação de pai autorizado → filtrar também pela âncora Account/Company do recurso principal → resolver cada FK no mesmo universo → validar consistência entre as FKs → persistir atomicamente ou responder sem efeito parcial. A precedência de `TenantScope` + `.find`/associação aninhada conserva o padrão dos Accounts/Contacts/Leads/Opportunities controllers. Pundit continua a autorizar a ação onde já é invocado; `policy_scope` ou `authorize` isolados não substituem o tenant scope (por exemplo, `OpportunityPolicy::Scope` pode retornar `scope.all`). Services compostos devem receber entidades já resolvidas ou verificar seus próprios lookups; invariantes independentes do ator, como Stage→Pipeline, pertencem a model/service. Não criar um novo serviço universal de busca. Para admin, escopo global só nas ações cujo comportamento atual o prevê explicitamente; integridade entre relações continua obrigatória.

**Autorização versus consistência**: autorização pergunta se o ator pode operar cada registro; consistência pergunta se os registros podem formar o mesmo agregado. Duas referências de A individualmente visíveis ainda são inválidas se `Opportunity.account_id != Task.account_id`, ou se Contact não possuir vínculo atual com a Account usada. A checagem de tenant ocorre no lookup/action; a de paridade relacional no ponto de composição do agregado, com validação persistente quando a regra independe do usuário. Consultas de coleção devem filtrar pela âncora, inclusive ao projetar dados legados incoerentes.

### Referential Integrity Rules

| ID recebido | Regra de aceitação |
| --- | --- |
| sales_account_id / account_id | Deve constar em accounts permitidas; se houver pai, ser exatamente o pai autorizado. |
| sales_contact_id / primary_contact_id / contact_ids | Deve constar em contacts permitidos e ter conta primária ou employment atual permitido ligado à conta da operação; não basta tenant igual. Employment encerrado não cria vínculo atual. |
| sales_opportunity_id / opportunity_id | Deve constar em opportunities permitidas e ter a mesma conta da Task/Activity/Email/Note, quando presentes. |
| sales_pipeline_id / sales_stage_id / stage_id | Pipeline global existente e utilizável; stage pertence ao pipeline da oportunidade. |
| owner_id / user_id / actor_id | User permitido para a mesma Company derivada da Account, segundo RBAC; não é chave de tenant. `Task.owner` e `Activity.actor` são current_user nos controllers atuais; Sales→Sales peer assignment e admin reassignment não são recursos do Gate 0. |
| qualification_id / consent_id | Resolver via oportunidade/contato scoped, inclusive em rotas de revogação. |
| campaign_id / template_id | Validar apenas quando uma ação incluída nesta feature aceitar o ID; Campaign/Template do mesmo tenant do EmailMessage ou campanha. CRUD completo de campanhas/templates é regressão separada. |
| source_id | Fonte global existente e utilizável pela ação; sem associar a outro tenant fictício. |
| Outros IDs relacionais no payload | Mesmo princípio para tags, competitors, quote/item, lista, employment e tracking; registrar em testes por fluxo. |

VALID ID SAME TENANT + relação coerente → permitido conforme role. NONEXISTENT ID e VALID ID OTHER TENANT → recusados com mesma resposta externa para recurso oculto. Relação cruzada entre dois recursos individualmente acessíveis, mas de contas incompatíveis, também é recusada. Respostas devem preservar o formato de erro da rota sempre que possível.

### 403 versus 404: convenção revalidada

BaseController herda tratamento 404 de ActiveRecord::RecordNotFound, 403 de Pundit::NotAuthorizedError, 401 de autenticação; Sales::BaseController devolve 403 SALES_FORBIDDEN para falta de acesso à superfície. Accounts/Contacts/Leads/Opportunities usam scoped finds em vários detalhes. Emails devolve 404 específico para account/contact não encontrados no scope. Notes/Quotes atualmente usam 403 UNAUTHORIZED_RELATION para algumas FKs; isso é convenção existente, mas distingue casos por rota e deve ser uniformizado sem regressão indevida. A especificação adota 404 para identificador oculto ou inexistente, 403 para ação negada após recurso permitido, e 422 apenas para incompatibilidade relacional de recursos já autorizados, sem expor ID/nome de B. Mensagens atuais que incluem exception.message ou IDs devem ser revistas para evitar enumeração. **Estado atual heterogêneo; decisão futura proposta, não comportamento implementado.**

O contrato externo é: (A) ID inexistente → 404; (B) ID existente fora do escopo → mesmo 404; (C) usuário autenticado sem permissão funcional → 403, antes de consultar o ID quando essa condição for detectável; (D) sem autenticação → 401. Relação inconsistente entre referências já acessíveis → 422. O corpo pode conservar o formato da rota, mas não revelar se um ID oculto existe. A ordem dos checks deve impedir que role sem permissão enumere recursos. Respostas atuais divergentes serão cobertas por testes de contrato, sem trocar status indiscriminadamente.

### Endpoint Inventory — evidência estática e contrato futuro

Abreviações: TS = Sales::TenantScope; G = busca global/sem TS; O = filtro por owner apenas; P = Pundit invocado; S = Sales::BaseController exige role Sales/admin, sem policy por ação demonstrada. “N” = futuro teste A permitido, B negado, inexistente; “FK” acrescenta tentativa de vínculo B e coerência; “C” acrescenta coleção/contagem. Rotas sob /api/v1/sales. A coluna “policy atual” diz se a action chama Pundit, não se existe uma classe policy no repositório.

| Método/rota | Controller#action / entidade | IDs aceitos | Scope atual / policy / auth | Risco observado → comportamento esperado | Teste |
| --- | --- | --- | --- | --- | --- |
| GET /today | Today#index / Task, Opportunity | nenhum | G / não / S | overdue/today/upcoming/no_next_action/stale globais → âncora de tenant em todos; dimensão owner depende da decisão de produto; mesma regra 5 dias | C |
| GET/POST /accounts; GET/PATCH /accounts/:id | Accounts#index/create/show/update / Account | id e atributos de conta | TS ou escopo equivalente / não / S | preservar consulta scoped; validar divergência owner/company em novas writes | N,FK,C |
| POST /companies/:company_id/account | AccountLinks#create / Account | company_id | Company.find global / não / S | pode criar vínculo para Company B → validar acesso à empresa de origem antes de criar | N,FK |
| GET /pipelines, /pipelines/:id, /pipelines/:id/board; GET /sources | Pipelines/Boards/Sources / catálogo | pipeline_id | catálogo G; BoardQuery recebe user / não / S | catálogo global é intencional; cards do board só de TS, source não deve expor dados de negócio | N,C |
| GET /accounts/:account_id/activities | Activities#index / Activity | account_id | G / não / S | lê account alheia → pai scoped e activities coerentes | N,C |
| POST /accounts/:account_id/activities | Activities#create / Activity | account_id, contact, opportunity | G / não / S | cria vínculos cruzados → validar trio antes de salvar | N,FK |
| GET /tasks e /accounts/:account_id/tasks | Tasks#index / Task | account_id, filtros | O / não / S | preservar owner=current_user; conta da rota deve restringir e âncora da task deve ser permitida | N,C |
| POST /tasks e /accounts/:account_id/tasks | Tasks#create / Task | account obrigatório, contact/opportunity opcionais | G na FK / não / S | manter owner=current_user; FK do pai e opcionais devem pertencer ao mesmo agregado | N,FK |
| PATCH /tasks/:id | Tasks#update / Task | id e FKs | O no alvo / não / S | troca FK para B → validar novas relações e owner | N,FK |
| GET /opportunities/:opportunity_id/qualification | Qualifications#show / Qualification | opportunity_id | G / não / S | qualificação B → pai scoped | N |
| PUT /opportunities/:opportunity_id/qualification | Qualifications#upsert / Qualification | opportunity_id | G / não / S | cria/edita B → pai scoped, sem efeito parcial | N,FK |
| GET /consents | Consents#index / Consent | contact_id | G / não / S | lista consent B → contato scoped | N,C |
| POST /consents | Consents#create / Consent | contact_id | G / não / S | grava consent B → contato scoped | N,FK |
| POST /consent_revocations (declarada) | ConsentRevocations#create ausente; controller só tem #update | consent_id | G em #update / não / S | divergência rota/action é bug separado; qualquer action efetivamente alcançável deve resolver Consent→Contact scoped antes de alterar | N,FK |
| GET /contacts, /contacts/:id, /contacts/:id/timeline, /contacts/:id/engagement | Contacts#index/show/timeline/engagement / Contact | id, account | TS / não / S | alvo protegido; associações herdadas podem estar incoerentes → manter e testar | N,C |
| POST /contacts e /accounts/:account_id/contacts | Contacts#create / Contact | account, user_id, owner_id | TS na conta, G no owner / não / S | owner B e pai/conta conflitantes → validar ambos | N,FK |
| PATCH /contacts/:id | Contacts#update / Contact | id, account, user_id/owner_id | TS no alvo, FKs livres / não / S | reassociação para B → scope e employment coerente | N,FK |
| GET/POST /contacts/:contact_id/employments | ContactEmployments#index/create / Employment | contact_id, account_id | G / não / S | leitura/criação B → contato/pai scoped, conta permitida | N,FK |
| PATCH/DELETE /contacts/:contact_id/employments/:id | ContactEmployments#update/destroy / Employment | parent, id, account | G / não / S | ID de outro pai e FK B → nested scoped lookup | N,FK |
| GET /emails, /emails/:id | Emails#index/show / EmailMessage | id | company_id / não / S | escopo direto existe; testar admin e coerência legada | N,C |
| POST /emails | Emails#create / EmailMessage | account, contact, opportunity | account por company, contact por coluna ausente, opportunity G / não / S | query de contato não corresponde ao schema; opportunity B pode ser vinculada antes de enqueue → TS e coerência | N,FK |
| GET/POST/PATCH/DELETE /email_templates[/:id]; POST preview/test_send | EmailTemplates / EmailTemplate | template_id, contexto account/contact/opportunity | company_id no template; ContextResolver no preview / não / S | validar IDs de contexto e escopo antes de renderizar ou criar job; sem envio real em teste | N,FK,C |
| GET/POST/PATCH/DELETE /campaigns[/:id] | Campaigns / Campaign | campaign_id, audience_id, email_template_id | scoped_campaigns + Pundit; audience por company; template a confirmar em mutação / P / S | manter policy/escopo e exigir template do mesmo tenant | N,FK,C |
| GET/POST /leads | Leads#index/create / Opportunity | account, primary_contact, contact_ids, pipeline, stage, source, competitors | TS list; Create valida parte / não / S | contact_ids/competitors sem scope e primary_contact sem mesma conta → validar todos | C,FK |
| GET/PATCH /leads/:id, POST /leads/:id/convert | Leads#show/update/convert / Opportunity | id, stage | TS no alvo; stage via pipeline / não / S | bom núcleo; testar stage/owner e ausência de efeito parcial | N,FK |
| POST /leads/bulk | Leads#bulk / Opportunity | ids, owner/tag/stage | TS nos alvos; owner/tag G / não / S | reatribuição/tag B → scope de referência | N,FK |
| GET/POST /opportunities | Opportunities#index/create / Opportunity | account, contact, pipeline, stage, source | TS index; Create account G / não / S | criação aceita account de B; serviço valida contato/conta, não tenant → scope integral | C,FK |
| GET/PATCH/DELETE /opportunities/:id; GET timeline | Opportunities#show/update/destroy/timeline / Opportunity | id, stage | TS alvo; stage via pipeline; timeline filhos por FK / não / S | preservar alvo scoped; recusar filhos de legado incoerente e testar stage | N,FK |
| POST /opportunities/bulk | Opportunities#bulk / Opportunity | ids, owner/tag/stage | TS alvos; owner_id direto / não / S | owner B → validar owner, manter atomicidade | N,FK |
| GET/POST /opportunities/:opportunity_id/contacts | OpportunityContacts#index/create / comitê | opportunity_id, contact_id | G / não / S | lê/cria em opp B → pai scoped e contato compatível | N,FK |
| PATCH/DELETE /opportunities/:opportunity_id/contacts/:id | OpportunityContacts#update/destroy / comitê | parent, id, contact | G / não / S | filho de outro pai → nested scoped lookup | N,FK |
| GET/POST/PATCH /notes[/:id] | Notes#index/create/update / Note | account, opportunity, contact | TS alvo; create valida conta/opp, omite contact; update FKs livres / não / S | contato B, vínculos incompatíveis → validar todos | N,FK,C |
| GET/POST/PATCH /quotes[/:id] | Quotes#index/create/update / Quote | opportunity, solar_project | TS; create só valida opp / não / S | relação project B possível → validar referências | N,FK,C |
| POST/DELETE /quotes/:quote_id/items[/:id] | QuoteItems#create/destroy / QuoteItem | quote_id, id, product | G / não / S | escrita em quote B → quote scoped e item do pai | N,FK |
| GET /search | Search#index / Account/Contact/Opportunity | q | G / não / S | resultados globais → TS por entidade | C |
| POST /tracking_identity | TrackingIdentity#create / Contact | contact_id, session_id | G / não / S | liga sessão a contato B → contato scoped, sessão validada | N,FK |
| POST/PATCH /tracking_sessions[/:id], POST /tracking_events | TrackingSessions/Events / tracking | session_id, account, contact | públicos em parte; IDs livres / sem Sales auth | associação pública com entidade interna → contrato público seguro, sem confiar IDs | FK |
| GET/POST /contact_lists; POST /contact_lists/:id/add_contacts | ContactLists / List+Membership | list_id, contact_ids | P no pai; add usa Contact.company_id ausente / S | lista protegida, seleção de contatos incompatível → usar escopo derivado | N,FK |
| Forms#submit (sem rota encontrada em routes.rb) | Forms#submit / FormSubmission | form slug, campaign_id | action pública no controller; rota não declarada no escopo lido | não presumir endpoint alcançável; se roteado no futuro, validar campanha/form/tenant | FK |

**Irmãos encontrados, exigindo triagem de escopo durante a futura implementação:** Taxonomies, Webhooks, CustomFieldDefinitions, AccountLinks, EmailTemplates preview/test_send, EmailSignatures, Campaigns/Recipients, Integrations, RBAC, user roles, API keys, imports, products, site surveys e quote documents. A varredura por find/find_by/where/permit/IDs identificou padrões; esta lista não declara cada rota vulnerável sem prova. Para qualquer rota Sales que receba novo ID ou relacione entidades, FR-002 a FR-005 se aplicam. Campaign deliverability e tracking/attribution como produto continuam fora de escopo.

**Classificação de escopo desta feature** (a matriz acima é inventário de risco, não autorização para refatorar todas as linhas):

| Finding | Classificação | Decisão e evidência |
| --- | --- | --- |
| Today, Activities, Tasks, Qualifications, Consents, Contacts/Employments, Leads/Opportunities, Emails | IN_SCOPE_FOR_002 | RC-01 a RC-04; dados comerciais ou FKs sem escopo uniforme nos controllers/services citados. |
| Search, OpportunityContacts, Notes, QuoteItems, ContactLists, TrackingIdentity | IN_SCOPE_FOR_002 | Somente acesso ou associação cross-tenant demonstrada nas actions inventariadas; não inclui produto de busca, tracking ou listas. |
| AccountLinks | IN_SCOPE_FOR_002 | `AccountLinksController#create` usa `Company.find(params[:company_id])` antes de `Accounts::CreateFromCompany`; validar autorização da Company antes do vínculo. Sem remodelar marketplace. |
| Pipelines/Stages/Sources como catálogos, Accounts lookup, EmailTemplates CRUD e Campaigns lookup/policy | ALREADY_SAFE | Escopo ou catálogo global previsto no código; manter testes de regressão. Esta classificação não certifica runtime nem FKs aceitas por mutações. |
| `Campaigns#create/update` com `email_template_id`; `EmailTemplates#preview/test_send` com IDs de contexto | IN_SCOPE_FOR_002 | Somente checagem de associação/escopo antes de renderizar/enfileirar; CRUD, conteúdo, envio e audiência fora da correção. |
| Revogação de consentimento: POST route aponta para `#create` ausente, controller tem `#update`, spec antiga espera caminho diferente | OUT_OF_SCOPE_FOLLOW_UP | Bug de roteamento distinto; Gate 0 define contrato de escopo para qualquer action de revogação alcançável, mas não repara a rota nesta feature. |
| Forms/tracking públicos, deliverability, campanhas como operação, sequences, analytics, taxonomies/webhooks/integrations/imports/products/site surveys/quote documents | OUT_OF_SCOPE_FOLLOW_UP | Exigem contratos próprios ou não participam diretamente dos P0 revalidados. Não atribuir autenticação Sales a endpoints públicos sem design específico. |
| Fila Today: owner-only ou tenant-wide; reatribuição de Task por Sales/admin; ampliação de bypass administrativo | NEEDS_PRODUCT_DECISION | O código atual não estabelece contrato uniforme de produto; não expandir privilégios nem alterar carteira diária por inferência. |
| Alcance real de rotas, dados legados incoerentes, efeitos em jobs e envio, status de `Contact.company_id` em runtime | NEEDS_RUNTIME_VERIFICATION | Apenas inspeção estática nesta fase; banco de teste isolado e request specs futuros. |

**Admin atual e contrato**: `AuthorizationService#admin?` reconhece `AdminUser` ou `User#admin?`; `TenantScope#admin?` usa `user.admin?`. `CampaignsController#scoped_campaigns` e `EmailTemplatesController#scoped_templates` têm bypass global; `Accounts/Contacts/Leads/Opportunities` herdam o bypass de TenantScope; `TasksController#index/update` restringe explicitamente a `owner: current_user`, inclusive para admin; `TasksController#create` fixa esse owner. Logo, admin global não implica autorização universal em toda action. Para ações em que o escopo global já existe, manter e testar; para ações owner-only, manter e testar. Diferença entre `AdminUser` e `User#admin?` e qualquer bypass adicional exigem prova de autenticação/rota antes de alteração. O Gate 0 deve invocar policy explícita apenas onde a arquitetura já a usa ou onde uma permissão funcional concreta for demonstrada; todo bypass precisa ser visível em controller/service e spec adversarial.

**Cenários relacionais**: Account A + Contact A + Opportunity A é válido apenas se Contact A tiver vínculo primário ou employment atual com A e Opportunity A apontar A. Account A + Contact B, Account A + Opportunity B e Contact A + Opportunity B são recusados antes da persistência, mesmo que o ator tenha acesso individual aos dois recursos. Activity tem Account obrigatória, Contact/Opportunity opcionais e actor=current_user; Task tem Account obrigatória, Contact/Opportunity opcionais e owner=current_user no CRUD atual. A validação não pode depender só de `TenantScope` porque ele decide visibilidade, nem só de policy porque ela decide ação; service/controller que compõe o agregado verifica as relações, e model mantém invariantes globais como Stage→Pipeline já existentes.

**Contact e Lead**: `Contact#sales_account_id` é a conta primária e gera employment inicial em callback; `ContactEmployment` representa vínculos adicionais, com `is_current` e `is_primary`, sem trocar automaticamente o tenant canônico. `Contact#user_id` é owner (`alias_attribute :owner_id`), não empresa. Sales autorizado pode adicionar/encerrar employment apenas se puder acessar o contato e ambas as contas forem do mesmo tenant; não presumir caso comercial válido cross-tenant. Lead usa `Sales::Opportunity`, com Account obrigatória, Pipeline/Stage globais e Source global opcional. O seed `db/seeds/sales.rb` cria pipeline `b2b_sales` e stages sem company_id. `Leads::Create` usa actor como owner; contatos extras e primary_contact exigem vínculo com a Account escolhida. Não criar `company_id` em Pipeline/Stage/Source para este Gate 0.

**Qualification, Consent e Email**: Qualification pertence a Opportunity única e deve ser localizada por Opportunity scoped, não por qualification ID global. Consent pertence a Contact; criação/listagem exige Contact scoped. `RevokeConsent.call` hoje permite `actor.admin?` ou owner da conta primária do contato, regra mais estreita que simples membership Sales; preservá-la até decisão específica e corrigir lookup quando houver action roteada. EmailMessage tem `company_id` direto: validar sua concordância com Account, Contact, Opportunity e qualquer Template/Campaign recebidos; somente após todas as verificações e validação de supressão pode criar thread/message e executar o ramo que chama `SendEmailJob` (inclusive fallback síncrono). Gate 0 não afirma que envio real funciona.

**Legado**: novas writes falham fechadas para owner/company discordantes e referências cruzadas; updates não podem perpetuar ou ampliar associação inválida. Leituras de registros legados devem filtrar pela âncora canônica e omitir associações filhas de outro tenant, sem corrigir dados silenciosamente. Registrar contagem e IDs técnicos de inconsistências em relatório diagnóstico futuro, com acesso restrito; não expor PII no log/resposta. Migração/backfill somente após evidência de dados reais, análise de impacto e plano reversível separado.

### Root Cause Findings revalidados

- **RC-01 Today**: Sales::Task e Sales::Opportunity globais. Filtra due_at/completed_at, open/next_activity_at e last_activity_at anterior a cinco dias; não chama TenantScope, sem desvio admin explícito. Resposta inclui IDs, título/descrição, nome de conta/contato, valor/probabilidade e datas de B se houver registros. Não há campo totals no JSON atual; se a UI derivar contagens, deve derivar das mesmas listas scoped. Evidência: TodayController#index/serialize_task/serialize_opportunity; schema sales_tasks/sales_opportunities.
- **RC-02 Activities**: INDEX consulta Activity.where(sales_account_id: parâmetro) global, CREATE grava conta informada e FKs de contato/oportunidade, actor=current_user. Não há update/delete na rota. FK de Activity no banco garante existência, não mesmo tenant/conta. Evidência: ActivitiesController#index/create/activity_params; schema sales_activities.
- **RC-03 Qualification/Consent**: show/upsert de Qualification por opportunity_id global; list/create Consent por contact_id global. Revocation: routes.rb declara POST consent_revocations#create, mas controller implementa update com Consent.find global, e spec antiga espera outra rota. Não afirmar endpoint de revogação operacional. Evidência: controllers, routes.rb:93-95, spec consent_revocation_spec.rb.
- **RC-04 FKs**: Task create/update permite trio de FKs sem scope; Contact update permite account/user/owner; Email create consulta opportunity global e usa Contact.company_id inexistente no schema; Leads::Create escopa account/primary contact por tenant mas não garante mesma conta nem valida contact_ids/competitor_ids; Opportunities::Create recebe account sem scope; Lead/Opportunity bulk aceitam owner global. Evidência: arquivos da matriz e services Sales::Leads::Create, Sales::Opportunities::Create.
- **RC-05 siblings**: Search global; ContactEmployments, OpportunityContacts, QuoteItems e TrackingIdentity resolvem IDs globais. Notes valida duas FKs ao criar, não contact nem novas FKs no update. ContactLists seleciona contatos por Contact.company_id, coluna ausente no schema. Endpoints públicos de tracking aceitam account/contact IDs. Evidência: controllers da matriz e schema.rb.
- **RC-06 TenantScope inconsistente**: accounts usa owner de membros OU company_id; contacts usa conta OU user; opportunities usa conta OU owner. Tasks usa assignee_id, coluna inexistente (schema tem owner_id); activities usa actor OU contas/opps/contatos. Essas condições OR podem incluir registros legados com âncoras conflitantes. OpportunityPolicy::Scope retorna scope.all quando há permissão read e não impõe tenant sozinho; OpportunitiesController usa TenantScope e não chama authorize. Evidência: tenant_scope.rb, policy, schema.rb.

### Key Entities *(include if feature involves data)*

Account é âncora comercial; Contact tem conta primária e employments; Opportunity é o lead/deal; Task e Activity são trabalho e histórico; Qualification e Consent herdam tenant do pai; EmailMessage tem tenant direto; Pipeline/Stage/Source são catálogos globais; Notes e vínculos de comitê/employment podem apontar para múltiplos pais. Nenhuma nova entidade ou coluna é requerida por esta specification.

### Security, Authorization and Error Contract

Acesso à superfície Sales é condição necessária, não autorização por registro. Permissão por ação usa o mecanismo atual quando presente, e todo registro/fk ainda precisa de scope. Admin global atual é reconhecido em AuthorizationService e TenantScope; seu bypass deve ser visível no teste e não contornar coerência de aggregate. Ausência de policy invocada em vários controllers é evidência; esta spec exige resultado, sem impor uma nova policy por tabela. Resposta não deve devolver dados de B nem distinguir B de ID inexistente. Falha de relação conhecida pode ser 422 com código estável; sucesso mantém payload e rota brownfield. Nenhuma correção na UI substitui essas regras.

### Test Plan e Definition of Done futura

Antes de rodar testes com banco: confirmar RAILS_ENV=test, DATABASE_URL e banco efetivo (host/database/user), abortar se houver qualquer possibilidade de produção. O rails_helper aborta em Rails.env.production?, mas database.yml permite configuração por variáveis; esse guard sozinho é insuficiente. Não executar testes nesta fase. Para cada linha da matriz aplicável, planejar AUTHORIZED SAME TENANT, UNAUTHORIZED OTHER TENANT, NONEXISTENT RESOURCE e CROSS-TENANT FK nas mutações; cobrir GET/POST/PATCH/PUT/DELETE quando a rota existir. Usar A/B com persistência real em banco de teste; prover JWT/role válidos, incluindo membro, owner e admin; sem envio real de email, mock/fake apenas do provider/queue boundary. Verificar ausência de escrita e enqueue após recusa, coleções/contagens, jobs que reabrem IDs, regressões dos specs existentes e contratos frontend relevantes.

AC-01 Today só dados permitidos; AC-02 Activities leitura isolada; AC-03 criação de Activity com todas FKs coerentes; AC-04 Qualification isolada; AC-05 Consent isolado; AC-06 Task recusa FK fora do escopo; AC-07 Contact não reassocia a conta/user proibidos; AC-08 Email recusa antes de enqueue; AC-09 Lead valida IDs relacionados; AC-10 Stage pertence ao Pipeline; AC-11 coleções isoladas; AC-12 agregados do mesmo escopo; AC-13 admin explícito/testado; AC-14 403/404/401 coerentes; AC-15 matriz adversarial A×B; AC-16 banco exclusivamente de teste; AC-17 specs existentes passam; AC-18 zero email real; AC-19 zero escrita em produção; AC-20 relato final de comandos/resultados/limites. **VERIFIED** somente após execução bem-sucedida dos testes relevantes; até lá usar IMPLEMENTED_NOT_VERIFIED, PARTIAL ou BLOCKED conforme evidência. A inspeção desta fase não declara Gate 0 concluído.

### Non-goals, Dependencies and Migration Decision

Fora de escopo: sequence/automation engine, campanha deliverability, SES produtivo, SPF/DKIM/DMARC, VoIP, WhatsApp API, LinkedIn, Attribution V2, forecast/redesign/analytics/scoring, novo Lead model e CRM do marketplace. Dependency: autenticação JWT e role Sales atuais, TenantScope/AuthorizationService, models/serviços/queries existentes e contrato de consumidores Next.js. **Preferência: nenhuma migration.** Primeiro especificar scoped lookups, validação de relações e correção de consultas. Se a futura análise provar lacuna estrutural que exige constraint/índice, registrar necessidade, impacto em dados legados, compatibilidade, rollback e teste isolado antes de qualquer migration. Nenhuma migration nesta fase.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em todos os cenários A×B planejados dos endpoints afetados, zero resposta contém ID, nome, descrição, email, contagem ou outra informação de B para User A.
- **SC-002**: Em todas as tentativas de FK cruzada/incompatível, zero registros, vínculos, jobs ou emails são criados/alterados.
- **SC-003**: Em todas as jornadas positivas equivalentes, criação, listagem, board, task, activity, contact e email queueing mantêm resultado esperado; admin global mantém somente exceções explicitadas.
- **SC-004**: Cada rota de leitura/escrita por ID tem prova de mesmo tenant, outro tenant e inexistente; cada mutação relacional tem prova de FK cruzada. Não se reivindica cobertura numérica antes do inventário executado.
- **SC-005**: Todos os testes de isolamento rodam exclusivamente em banco de teste confirmado, com zero chamadas ao provedor real e zero escrita em produção; a revisão registra comandos executados, resultados e limitações.
- **SC-006**: Operador comercial do tenant A pode usar a fila diária e os fluxos existentes sem ver dados de B nem sofrer bloqueio indiscriminado das ações válidas. Validar por jornadas automatizadas, sem inventar tempo de tarefa ou satisfação.

## Assumptions

- O namespace /api/v1/sales corresponde ao CRM interno; endpoints públicos de forms/tracking dentro dele exigem contrato específico e não herdam implicitamente autenticação Sales.
- Company é tenant empresarial quando presente; contas sem company_id seguem a regra atual de owner até saneamento deliberado. Pipeline, Stage e Source são globais no schema atual.
- Admin global conserva o acesso transversal indicado no código, mas mutações com relações incompatíveis continuam inválidas; nenhuma delegação entre tenants é introduzida.
- A resposta externa proposta para recurso oculto é 404, alinhada aos scoped finds e evitando enumeração. Ajustes de formatos específicos exigem verificação dos consumidores antes de implementação.
- Não há evidência de dados legados reais, runtime ou produção nesta fase; a existência de código é classificada como IMPLEMENTED_NOT_VERIFIED ou PARTIAL.
- Esta especificação autoriza apenas design/discovery agora. Nenhum código, migration, schema, banco ou produção foi alterado.

## Evidence & Discovery Record

**REPOSITORY EVIDENCE**: constitution.md e as duas auditorias em docs/crm-audit foram lidas como princípios/contexto, não como prova. Revalidação direta: AB0-1-back/config/routes.rb:61-210; app/controllers/api/v1/{base_controller.rb,sales/base_controller.rb}; Sales controllers Today, Activities, Tasks, Qualifications, Consents, ConsentRevocations, Contacts, ContactEmployments, Emails, Leads, Opportunities, OpportunityContacts, Accounts, Notes, Quotes, QuoteItems, Search, TrackingIdentity, TrackingSessions, TrackingEvents, Forms, ContactLists, Pipelines, Boards, Sources, AccountLinks, EmailTemplates e Campaigns; app/services/sales/{tenant_scope,authorization_service,leads/create,opportunities/create,opportunities/change_stage,lead_conversion_service}; app/models/sales de Account, Contact, ContactEmployment, Opportunity, Task, Activity, Qualification, Consent, Pipeline, Stage, Source, EmailTemplate, Campaign e CampaignRecipient; app/policies/sales/{policy,opportunity_policy,campaign_policy}; db/schema.rb:3584-4696; specs de Today, Leads, Emails, ConsentRevocation, TenantScope e Authorization. Serialização principal desses controllers é inline; não foi localizado serializer Sales específico no inventário de app/serializers. O cliente Next.js AB0-1-front/lib/api/sales/client.ts expõe SalesApiError com status/code e tratamento de auth; consumidores adicionais devem ser reconfirmados antes da futura implementação. Cobertura atual examinada: today_spec só 401; leads_spec cobre fluxo A e board; emails_spec usa usuário admin na maior parte do setup; tenant_scope_spec cobre accounts; consent_revocation_spec espera rota distinta. Nenhuma dessas observações substitui os testes adversariais desta spec.

**RUNTIME EVIDENCE**: NOT VERIFIED. **PRODUCTION EVIDENCE**: NOT VERIFIED. Nenhum request, teste, Rails runner, banco, migration, job ou API externa foi executado. A varredura de código detecta candidatos e contradições estáticas, não prova exploração sob tokens reais. Hipóteses a provar: alcance efetivo dos endpoints com roles, efeito de contas legadas inconsistentes, erros SQL em queries que usam Contact.company_id, e status real da revogação.

**Comandos e resultados**: git status --short (workspace limpo no início); cat/sed para princípios, skills, template, auditorias, controllers, services, models, schema e specs; rg --files/rg -n para rotas, IDs, policies, specs e padrão de buscas; git branch --show-current. Leituras inicialmente falharam no sandbox com bwrap Failed RTM_NEWADDR; foram repetidas como read-only fora dele. Resultado material: achados RC-01 a RC-06 e matriz acima. Limitação: sem ambiente de teste confirmado, logo testes não executados.
