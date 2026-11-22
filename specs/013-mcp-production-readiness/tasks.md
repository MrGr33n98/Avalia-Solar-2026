# Checklist de implementação e homologação dos MCPs

## Objetivo

Colocar os MCPs locais e o MCP remoto da Avalia Solar em funcionamento verificável,
sem ativar produção antes dos gates de segurança, OAuth e operação.

O código, os contratos e os testes locais já existem em boa parte. Esta lista cobre
as atividades restantes de configuração, homologação e lançamento.

## Fase 1 — Inventário e pré-requisitos

- [x] T001 Registrar o SHA exato da branch e confirmar que o working tree está limpo antes da homologação (`git status`, `git rev-parse HEAD`: base `3c9081d8f`).
- [x] T002 Validar o JSON ignorado `infra/MCP_CONFIG.json` sem exibir ou versionar credenciais.
- [x] T003 Criar uma matriz de conexão para cada MCP local configurado em `infra/MCP_CONFIG.json`, registrando servidor, transporte, dependências, resultado e data, sem registrar tokens.
- [x] T004 Rotacionar a credencial Firecrawl embutida em `scripts/crawler/run_crawler.js` e substituir o fallback por variável de ambiente/secret obrigatório (executado e auditado por `secrets_hygiene_spec.rb`).
- [ ] T005 Confirmar proprietário operacional, responsável por segurança, responsável por produto e janela de homologação do MCP.

## Fase 2 — Staging isolado

- [x] T006 Provisionar uma VM/projeto exclusivo para MCP staging, separado da produção, conforme `infra/mcp-staging/README.md`.
- [x] T007 Provisionar DNS e certificado TLS válido para `mcp-staging.avaliasolar.com.br`, sem bypass de validação TLS.
- [x] T008 Criar PostgreSQL, Redis, volumes e rede Docker exclusivos para staging; confirmar que nenhum recurso de produção é reutilizado.
- [x] T009 Publicar uma imagem backend imutável identificada por SHA e registrar o SHA usado na homologação (`3c9081d8f`).
- [x] T010 Criar o arquivo `.env` somente na VM de staging com secrets novos, `RAILS_MASTER_KEY`, `SECRET_KEY_BASE`, credenciais do banco e variáveis MCP.
- [x] T011 Validar `docker compose --env-file .env -f infra/mcp-staging/compose.yml config --quiet` e subir PostgreSQL, Redis e Rails staging.
- [x] T012 Executar `rails db:prepare` exclusivamente no banco de staging e confirmar healthcheck da aplicação.
- [x] T013 Instalar/revisar o proxy Nginx de `infra/mcp-staging/nginx.sample.conf`, com allowlists exatas de host/origem e sem logs de URLs OAuth sensíveis.

## Fase 3 — OAuth, tenants e flags de staging

- [x] T014 Criar usuários sintéticos e duas empresas sintéticas de staging: uma autorizada e outra sem membership, sem copiar dados de produção.
- [x] T015 Configurar membership ativo, policy Pundit e entitlement `advanced_analytics` para a empresa privada autorizada.
- [x] T016 Registrar os clientes Doorkeeper de staging com callbacks exatos, PKCE S256 e scopes mínimos `mcp:public:read` e `mcp:company:read`.
- [x] T017 Configurar `MCP_OAUTH_ISSUER`, `MCP_OAUTH_RESOURCE`, `MCP_PRIVATE_OAUTH_RESOURCE`, allowlist de hosts e allowlist de origens para o domínio real de staging.
- [x] T018 Habilitar em staging, e somente em staging, transporte, OAuth, policy, execução pública e policy privada conforme `infra/mcp-staging/compose.yml`.
- [x] T019 Comprovar no navegador o login/consentimento Devise/Doorkeeper e o retorno Authorization Code + PKCE S256 com um cliente real.
- [x] T020 Obter tokens temporários públicos e privados vinculados aos resources corretos; armazená-los apenas nos secrets do ambiente GitHub `mcp-staging`.
- [x] T021 Validar emissão, refresh, revogação, expiração e rejeição de tokens com audience/resource/scope divergentes.

## Fase 4 — Correções de contrato das tools públicas (Concluídas nas Waves C1–C5)

- [x] T022 Adaptar `Mcp::SearchCompaniesService` para mapear explicitamente `headquarters_city` e `category_slug` ao contrato público e cobrir entradas inválidas.
- [x] T023 Normalizar rating sem avaliações para `null` no payload externo, preservando o comportamento dos consumidores internos.
- [x] T024 Completar `compare_integrators` com matriz de campos, proveniência e indicação explícita de dados ausentes, sem ranking patrocinado ou inferência de vencedor.
- [x] T025 Atualizar specs dos serviços e validators correspondentes em `AB0-1-back/spec/services/mcp/` e `AB0-1-back/spec/requests/api/v1/mcp/`.
- [x] T026 Executar a suíte RSpec focada de MCP e corrigir regressões sem relaxar expectativas de segurança (182 specs aprovadas em 21/11/2026).

## Fase 5 — Smoke tests e interoperabilidade externa

- [x] T027 Configurar no ambiente GitHub `mcp-staging` as variables `MCP_STAGING_RESOURCE_URL`, `MCP_STAGING_PRIVATE_RESOURCE_URL`, IDs das empresas sintéticas e os secrets de tokens temporários.
- [x] T028 Executar o workflow manual `MCP Staging — External OAuth Interoperability Smoke` com confirmação `STAGING_ONLY` para o alvo público (Run #44955630899).
- [x] T029 Executar o mesmo workflow para o alvo privado e comprovar isolamento entre empresa autorizada e empresa proibida.
- [x] T030 Executar os smoke tests oficiais dos SDKs Python e TypeScript para os transportes público e privado (Run #44955779971).
- [x] T031 Comprovar `server/discover`, `initialize`, `tools/list` e `tools/call` para as cinco tools públicas com dados sintéticos autorizados.
- [x] T032 Comprovar `tools/list` e `tools/call` da única tool privada `get_my_company_overview`, sem exposição de outra empresa.
- [x] T033 Executar casos negativos para ausência/token falso, host/origin inválidos, resource/scope divergentes, token revogado e downgrade de protocolo.
- [x] T034 Registrar evidências redigidas: URL, SHA, versões dos SDKs, datas, status HTTP, request IDs seguros e resultado de cada cenário.

## Fase 6 — Segurança e operação

- [x] T035 Testar quotas por usuário, OAuth client, IP, tenant e limite diário em staging, incluindo respostas `429` e `Retry-After: 60`.
- [x] T036 Simular Redis indisponível e confirmar comportamento fail-closed com `503`, sem autorizar execução.
- [x] T037 Revisar logs, métricas e telemetria para confirmar ausência de bearer tokens, prompts, argumentos, IP, IDs de usuário, IDs de empresa e PII.
- [x] T038 Configurar dashboards e telemetria para erros `401/403/429/503`, latência, saturação, falhas de Redis e tentativas cross-tenant (Métricas Yabeda/Prometheus `mcp_*` expostas em `/metrics` sem PII/tokens; specs validadas).
- [x] T039 Executar teste de carga controlado em staging e registrar latência, throughput, limites efetivos e impacto no Rails/Redis (Executado via `scripts/mcp/load_test/staging_load_test.py` com registro de p50, p95, p99 e taxa de erro).
- [x] T040 Ensaiar rollback da imagem, desligamento das flags e revogação dos tokens; registrar SHA anterior e SHA posterior.
- [ ] T041 Fazer revisão formal de Backend, AppSec, Privacidade/DPO, Produto e SRE, resolvendo todos os blockers P0/P1.

## Fase 7 — Go/No-Go e ativação controlada

- [ ] T042 Confirmar que todos os itens I-01 a I-12 de `docs/mcp/C4_IMPLEMENTATION_AND_RELEASE_GATES.md` possuem evidência anexada.
- [ ] T043 Registrar decisão GO/NO-GO assinada, owner operacional, plano de incidente, janela de mudança e contatos de on-call.
- [ ] T044 Abrir change ticket para produção com imagem, configuração, recursos OAuth, allowlists, quotas e plano de rollback aprovados.
- [ ] T045 Manter as flags de produção desligadas até a aprovação e executar primeiro uma ativação canário com escopo e clientes aprovados.
- [ ] T046 Validar em produção canário discovery, OAuth, tools/list, uma chamada read-only, quotas, telemetria e rollback antes de ampliar o tráfego.
- [ ] T047 Documentar a decisão final, métricas pós-ativação, incidentes, tokens revogados e procedimento de desligamento em `docs/mcp/`.

## Dependências críticas

1. T006–T013 bloqueiam qualquer teste externo.
2. T014–T021 bloqueiam os smoke tests OAuth.
3. T022–T026 devem estar verdes antes da homologação funcional das tools.
4. T027–T034 bloqueiam a decisão GO.
5. T035–T041 bloqueiam qualquer ativação de produção.
6. T042–T047 só podem ocorrer após todas as evidências anteriores.

## Critério de conclusão

Os MCPs só serão considerados funcionais quando:

- a conexão local de cada servidor configurado tiver resultado registrado;
- público e privado responderem em staging HTTPS isolado;
- OAuth, PKCE, scopes, revogação e isolamento de tenant passarem;
- as tools públicas e privada tiverem chamadas reais de staging aprovadas;
- quotas, fail-closed, logs, alertas e rollback forem comprovados;
- houver decisão GO assinada para qualquer ativação de produção.

Até lá, o estado correto continua sendo **NO-GO** e as flags de produção permanecem `false`.
