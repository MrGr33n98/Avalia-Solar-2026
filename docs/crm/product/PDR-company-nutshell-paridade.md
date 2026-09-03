# PDR — Paridade Nutshell Company 360 x Avalia Solar CRM

## Objetivo

Entregar página de empresa navegável, Company 360 operacional e paridade progressiva com Nutshell, preservando tenant isolation, performance e integração com dados solares do Avalia Solar.

## Evidência comparada

Fonte Nutshell: `/company/4-aquora-purifiers-sample` e capturas fornecidas. Fonte Avalia Solar: `/dashboard/sales/accounts` e código atual auditado em 03/09/2026. A página Nutshell exige sessão; comparação visual usa capturas anexadas.

## Bug P0 encontrado e corrigido

Clique no nome da empresa já apontava para `/dashboard/sales/accounts/:id`, porém a rota renderizava `SalesCommandCenter pipelineOnly`, ignorando `id`. Resultado: nenhuma ficha de empresa aparecia. Rota agora renderiza `Company360View` e abre detalhes automaticamente; valida `id` numérico.

## Matriz de comparação — estado real

| Área | Nutshell observado | Avalia Solar atual | Gap | Prioridade / ação |
|---|---|---|---|---|
| Lista de empresas | Lista, busca, filtros, colunas, mapa, exportação, duplicados | `CompaniesPage`, busca/tipo/owner, paginação server-side, colunas persistentes, exportação CSV, duplicados, Company 360 | Filtros avançados e views salvas incompletos | P1: reutilizar FilterDrawer/SavedViewMenu |
| Clique no card/nome | Abre Company record completo | Corrigido: rota `/accounts/:id` abre Company 360 | Antes rota descartava id | P0 concluído |
| Cabeçalho | Nome, descrição, atribuição, ações rápidas | Company360 tem nome, localização, domínio e ações | edição inline, atribuição persistente e menu faltam | P1 |
| Resumo | Tipo, indústria, território, funcionários, receita, último contato, origem, tags | Dados básicos + segmento, marketplace e tags | schema/endpoint não expõe todos campos | P1: contrato `AccountDetails` |
| Pessoas | Lista, adicionar pessoa, cargo, telefone/email, contato principal | `contacts` em Company360 + criação global | editar/remover, papéis, múltiplos vínculos e histórico incompletos | P1 |
| Tarefas | Painel aberto/concluído, criar tarefa | `tasks` exibidas no 360 e página global de tasks | ações inline, filtros e contadores precisam padronização | P1 |
| Atividades | Agendar/logar reunião, ligação, virtual, voicemail | `activities`, modais de criação e timeline | tipos/contadores e edição ainda parciais | P1 |
| E-mail/sequências | Compor, enviar, sequência ativa/concluída | `EmailCenter`, composer e templates | tracking, threads e sequência real dependem integração | P1/P2 |
| Timeline | Filtros por tipo/usuário/período, changelog | `UnifiedTimeline`/dados de atividades | endpoint unificado e filtros server-side faltam | P1 |
| Leads/oportunidades | Relação com contador e criação contextual | oportunidades por conta, pipeline, Company 360 | abrir detalhe e ações contextuais devem ser uniformes | P1 |
| Hierarquia | Pais/filhos, adicionar relação | Não há painel completo no Company 360 | modelo/endpoint/UI faltam | P2 |
| Anexos | Upload e contador | Não há fluxo completo no Company 360 | Active Storage + autorização + UI | P1 |
| Campos customizados | Painel com gestão | Backend possui custom fields; tela dispersa | editor contextual da conta falta | P1 |
| Mapa/localização | Mapa de empresas e localização | mapa existe na lista; ficha mostra localização | mapa contextual no 360 falta | P2 |
| Dados Avalia Solar | Não possui marketplace/reputação solar | marketplace, selo, avaliações e ROI solar | vantagem própria, manter como bloco central | P0 diferencial |
| Responsividade | Desktop com sidebar direita e navegação interna | Layout responsivo geral; Company 360 modal | ficha deve virar página/drawer adaptativo mobile | P1 |

## Arquitetura proposta

`AccountListPage` usa `AccountsQuery` paginada (50 por página, teto 100), filtros normalizados, colunas persistentes e `AccountTable`. Cada nome/card navega para `AccountDetailsPage`. Página carrega `AccountDetailsQuery` com includes/preload: contacts, opportunities, tasks, activities, tags, attachments, custom_fields, hierarchy e marketplace. Company 360 usa blocos independentes: Summary, People, Tasks, Activities, Emails, Timeline, Opportunities, Hierarchy, Attachments, CustomFields, SolarIntelligence.

API sugerida:

- `GET /api/v1/sales/accounts/:id?include=summary,contacts,...`
- `PATCH /api/v1/sales/accounts/:id`
- `GET/POST/PATCH/DELETE /api/v1/sales/accounts/:id/contacts`
- `GET/POST/PATCH /api/v1/sales/accounts/:id/activities`
- `GET/POST /api/v1/sales/accounts/:id/notes`
- `GET/POST/DELETE /api/v1/sales/accounts/:id/attachments`
- `GET/POST/DELETE /api/v1/sales/accounts/:id/hierarchy`

Todos endpoints devem aplicar `current_user` tenant scope e Pundit; nunca aceitar associação de contato/oportunidade fora da conta/empresa.

## Plano de execução

| Fase | Entrega | Aceite |
|---|---|---|
| P0 | Navegação empresa e detalhe carregável | clique no nome abre ficha correta; 404 seguro |
| P1 | Contrato de detalhes + preload | uma chamada principal; sem N+1; p95 definido |
| P1 | Resumo, pessoas, tarefas, atividades, oportunidades | criar/editar/abrir sem sair do contexto |
| P1 | Timeline unificada, filtros e views | estado persistido na URL/view |
| P1 | Anexos, custom fields e atribuição | autorização por tenant testada |
| P2 | Hierarquia, mapa contextual, e-mail tracking/sequências | parity funcional Nutshell |
| P2 | mobile drawer/page, acessibilidade e performance | Lighthouse mobile >= 0.8; teclado completo |

## TDD obrigatório

- request: `GET /accounts/:id` 200, inexistente 404, tenant externo 404/403.
- request: contato de outra conta retorna `CONTACT_ACCOUNT_MISMATCH` 422.
- request: atualização e anexos respeitam Pundit.
- request: include evita consultas extras; Bullet/SQL subscriber sem N+1.
- frontend: clique em nome chama rota correta; loading/erro/empty; modal/drawer mobile.
- Playwright: lista > detalhe > voltar preserva filtros e scroll.

## Critérios de performance

Paginação server-side; `includes/preload` explícito; evitar `count` repetido; índices em `sales_accounts(company_id, name)`, `contacts(sales_account_id)`, atividades por conta/data; cache curto somente dados não sensíveis; payload por `include`; virtualizar listas longas.

## Decisões

Nutshell serve como referência de fluxo. Avalia Solar mantém identidade visual própria e adiciona inteligência solar, reputação marketplace, calculadora ROI e abordagem comercial. Exportação deve permanecer protegida por autorização e auditoria.
