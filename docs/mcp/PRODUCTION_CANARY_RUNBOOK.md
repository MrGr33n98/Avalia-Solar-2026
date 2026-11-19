# Runbook — MCP Production Canary

Status: preparado para revisão; não ativado em produção.

Este runbook descreve a homologação controlada do MCP público usando o backend
Rails existente. Não cria Droplet, banco, Redis, cliente OAuth ou token real.

## Pré-requisitos

- PR revisada e CI MCP aprovado.
- Autorização explícita para uma janela de canary.
- Cliente OAuth real definido pelo proprietário da integração.
- Redirect URI exata fornecida pelo proprietário do cliente. Não usar URL de
  exemplo neste documento e não cadastrar o cliente antes dessa definição.
- DNS e HTTPS válidos para `api.avaliasolar.com.br`.
- Acesso a métricas/logs sem expor tokens, subjects, argumentos ou dados de
  clientes.

## GAP analysis

| Área | Situação | Evidência/ação |
| --- | --- | --- |
| Doorkeeper | Existe, com tokens opacos e expiração configurada | `config/initializers/doorkeeper.rb` |
| PKCE | S256 obrigatório no Doorkeeper | configuração `force_pkce`/`pkce_code_challenge_methods` |
| Resource binding | Recurso deve ser exato | `MCP_OAUTH_RESOURCE` e controllers OAuth |
| MCP público | Guard opt-in implementado | `Mcp::Canary::Guard` |
| MCP privado | Mantido separado e desabilitado | `MCP_PRIVATE_REMOTE_TRANSPORT_ENABLED=false` |
| Quotas | Redis e fail-closed existentes | `Mcp::RemoteQuotaPolicy` |
| Telemetria | Labels finitos, sem bearer/PII | `Mcp::RemoteTelemetry` |
| VM | Não auditada nesta execução | não houve SSH autorizado; usar comandos abaixo |
| Interoperabilidade externa | Não declarada | exige teste real posterior com cliente aprovado |

## Arquitetura e fases

O fluxo é:

`OAuth Authorization Code + PKCE S256` → `Doorkeeper opaque token` →
`RemoteTransportController` → `ResourceAuthorization` → `Canary::Guard` →
`RemoteQuotaPolicy` → protocolo MCP → executor público.

O guard valida o client ID e o subject derivados do token. Identificadores em
argumentos MCP nunca participam da autorização.

### Discovery Canary

```text
MCP_CANARY_ENABLED=true
MCP_CANARY_PHASE=discovery
```

Permite `server/discover` e `tools/list`. `tools/call` permanece bloqueado.

### Read-only Canary

```text
MCP_CANARY_ENABLED=true
MCP_CANARY_PHASE=read_only
MCP_PUBLIC_TOOLS_EXECUTION_ENABLED=true
```

Além da descoberta, permite somente:

- `list_integrators`
- `show_integrator_profile`
- `list_solar_categories`
- `get_integrator_reputation`
- `compare_integrators`

O protocolo legado não ganha caminho de execução; seu `tools/call` continua
bloqueado pelo transporte. O MCP privado não é liberado por este canary.

## Variáveis e inventário GitHub

Defaults seguros no `.env.example`:

```text
MCP_CANARY_ENABLED=false
MCP_CANARY_PHASE=disabled
MCP_CANARY_ALLOWED_CLIENT_IDS=
MCP_CANARY_ALLOWED_SUBJECTS=
```

Para um rollout aprovado, as variáveis operacionais devem ser fornecidas no
ambiente correto, sem commit:

- `MCP_REMOTE_TRANSPORT_ENABLED=true`
- `MCP_REMOTE_PRODUCTION_ENABLED=true` somente na janela aprovada
- `MCP_REMOTE_AUTH_MODE=oauth`
- `MCP_REMOTE_OAUTH_ENABLED=true`
- `MCP_REMOTE_POLICY_ENABLED=true`
- `MCP_OAUTH_TOKEN_FORMAT=opaque`
- `MCP_OAUTH_RESOURCE=https://api.avaliasolar.com.br/mcp`
- `MCP_OAUTH_ISSUER=https://api.avaliasolar.com.br`
- `MCP_REMOTE_ALLOWED_HOSTS=api.avaliasolar.com.br`
- `MCP_REMOTE_ALLOWED_ORIGINS=` conforme a origem real aprovada
- `MCP_CANARY_ALLOWED_CLIENT_IDS=` client IDs aprovados, separados por vírgula
- `MCP_CANARY_ALLOWED_SUBJECTS=` subjects internos aprovados, por exemplo `user:<id>`

Os quatro valores de identidade acima não são secrets no sentido criptográfico,
mas são allowlists sensíveis e devem ser restringidos ao ambiente canary. Não
usar allowlists de produção no staging e não reutilizar tokens.

`MCP_STAGING_ACCESS_TOKEN` e `MCP_STAGING_PRIVATE_ACCESS_TOKEN` não são
necessários para a implementação do guard. Não devem ser criados ou preenchidos
com valores fictícios; só devem existir se houver um staging persistente real,
autorizado e com rotação definida.

## Cadastro controlado do cliente OAuth

1. Definir o nome, client ID, tipo de cliente e redirect URI real com o
   proprietário da integração.
2. Criar o cliente exclusivamente no ambiente canary autorizado, nunca na VM
   por este runbook.
3. Confirmar `mcp:public:read`, recurso exato e PKCE S256.
4. Adicionar o client ID à allowlist somente após revisão independente.
5. Adicionar somente subjects internos de teste aprovados.
6. Registrar o inventário sem registrar client secret, authorization code ou
   bearer token.

## Fluxo PKCE

O cliente deve gerar `code_verifier` aleatório e
`code_challenge=BASE64URL(SHA256(code_verifier))`, usando
`code_challenge_method=S256`. O authorization request e o token request devem
usar o recurso exato. O callback deve ser o URI real cadastrado; este runbook
não inventa um callback.

O backend rejeita grant sem `authorization_code`, sem `code_verifier` ou com
`code_challenge_method` diferente de S256 quando o canary está habilitado.

### Renovação

O grant `refresh_token` é aceito somente quando o refresh token aponta para um
AccessToken Doorkeeper acessível, com resource canônico, cliente correspondente
ao token e subject ainda presente na allowlist. Tokens revogados, expirados,
client IDs diferentes ou subjects removidos são rejeitados. O refresh não cria
uma autorização fora da allowlist e não dispensa a validação do resource.

## Auditoria READ-ONLY da VM

Executar manualmente, somente após autorização SSH, mascarando valores:

```bash
uname -a
free -h
nproc
df -h
docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}'
docker network ls
docker volume ls
docker inspect --format '{{.Name}} {{json .NetworkSettings.Networks}}' $(docker ps -q)
docker compose config --services
docker compose config --volumes
nginx -T 2>/dev/null | sed -E 's/(PASSWORD|SECRET|TOKEN|KEY)=([^ ]+)/\1=[REDACTED]/g'
docker exec <backend> printenv | sed -E 's/=(.*)/=[REDACTED]/'
docker exec <postgres> psql -U <user> -d <db> -c '\\dt'
docker exec <redis> redis-cli ping
```

Não executar `docker compose up/down`, restart, migration, alteração de env,
`docker exec` com escrita, `docker system prune` ou comandos de banco/Redis que
modifiquem dados.

## Ativação controlada

1. Confirmar que a imagem contém a PR aprovada.
2. Confirmar backup/rollback operacional e métricas disponíveis.
3. Manter `MCP_CANARY_PHASE=discovery` e execução pública desligada.
4. Validar o cliente aprovado em `tools/list`.
5. Observar 401/403/429/503, latência, quota e erros por uma janela definida.
6. Somente após GO formal, mudar para `read_only` e habilitar a flag de
   execução pública.
7. Executar apenas as cinco ferramentas listadas e confirmar ausência de
   métodos de escrita.

Nenhuma etapa de ativação é executada por esta PR.

## Rollback imediato

Desligar, nesta ordem, no ambiente canary aprovado. Os dois primeiros gates
bloqueiam execução e transporte antes do kill switch específico:

```text
MCP_PUBLIC_TOOLS_EXECUTION_ENABLED=false
MCP_REMOTE_TRANSPORT_ENABLED=false
MCP_REMOTE_PRODUCTION_ENABLED=false
MCP_CANARY_PHASE=disabled
MCP_CANARY_ENABLED=false
```

Os gates globais bloqueiam execução/transporte e o gate de produção mantém o
endpoint oculto. O kill switch específico impede que uma configuração parcial
do canary seja aceita; ele nunca é a única garantia de desativação. Revogar o
token e remover o client ID/subject da allowlist conforme o processo de
credenciais. Não depender somente de rollback de imagem.

Validar HTTP depois da alteração, sem bearer token real:

```bash
curl -sk -o /dev/null -w '%{http_code}\n' \\
  -H 'Host: api.avaliasolar.com.br' \\
  -H 'Content-Type: application/json' \\
  -H 'Accept: application/json, text/event-stream' \\
  --data '{"jsonrpc":"2.0","id":1,"method":"ping"}' \\
  https://api.avaliasolar.com.br/mcp

curl -sk -o /dev/null -w '%{http_code}\n' \\
  https://api.avaliasolar.com.br/.well-known/oauth-protected-resource/mcp
```

Resultado esperado: `404` nos dois requests. Qualquer `2xx`, `401` ou `403`
deve ser tratado como rollback incompleto até a configuração efetiva dos gates
ser corrigida.

## Monitoramento

`Mcp::RemoteTelemetry` emite somente labels finitos: operação, ferramenta
pública conhecida, resultado, status HTTP, latência e request ID validado.
Bearer tokens, dados pessoais, IPs, argumentos e conteúdo de resposta não são
registrados. Quota Redis continua fail-closed: indisponibilidade retorna 503;
excesso retorna 429.

Alertar/revisar:

- aumento de 401/403;
- qualquer 5xx/503;
- 429 sustentado;
- latência p95 acima do limite operacional aprovado;
- tentativa de ferramenta fora da allowlist;
- qualquer evento contendo segredo ou PII.

## GO / NO-GO

| Critério | GO | NO-GO |
| --- | --- | --- |
| CI | gate MCP e specs canary verdes | qualquer falha ou spec omitido |
| Configuração | flags e allowlists revisadas, defaults seguros | valor ausente, inválido ou amplo |
| OAuth | token opaco, resource exato, PKCE S256 | JWT, scope/resource incorreto ou token revogado aceito |
| Isolamento | somente subjects/client IDs aprovados | outro usuário/cliente acessa |
| Ferramentas | cinco públicas read-only | ferramenta interna, escrita ou privada acessível |
| Quota | Redis disponível e fail-closed | bypass, fallback em memória ou ausência de 429/503 |
| Observabilidade | status/latência/request ID sem segredo | token, PII ou argumento em log |
| Externo | teste real concluído e evidenciado | apenas mock/smoke local |

## Checklist ChatGPT / Claude

Esse checklist só pode ser marcado após teste externo real, autorizado e
documentado:

- [ ] cliente real configurado com redirect URI real;
- [ ] OAuth Authorization Code + PKCE S256 concluído;
- [ ] `tools/list` retornou somente catálogo público;
- [ ] discovery não executou ferramenta;
- [ ] read-only executou somente as cinco ferramentas;
- [ ] acesso a ferramenta privada/interna rejeitado;
- [ ] token expirado/revogado rejeitado;
- [ ] quota 429 e indisponibilidade Redis 503 observadas;
- [ ] nenhum segredo, PII ou argumento apareceu nos logs;
- [ ] evidência do cliente externo anexada à revisão.

Sem esse teste, a interoperabilidade com ChatGPT ou Claude permanece
**não validada**.
