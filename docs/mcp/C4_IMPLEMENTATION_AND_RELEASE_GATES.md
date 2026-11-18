# MCP C4 — Interoperabilidade, limites privados e homologação (Avalia Solar)

**Estado da implementação nesta branch:** código e testes propostos; **NO-GO para ativação de produção**.  
**Data de referência:** 2026-11-18  
**Escopo:** MCP público `/mcp` e MCP privado `/mcp/private`; não altera login Devise, CRM nem MCP interno.

## 1. Contexto auditado (AS-IS)

- As PRs #167, #169, #175 e #183 integraram transportes, Doorkeeper, recurso público e private MCP.
- Doorkeeper entrega tokens **opacos**, vinculados a um resource, com PKCE S256 e scopes.
- Registro público: **5** tools read-only em `Mcp::PublicToolRegistry`.
- Registro privado: **1** tool read-only, `get_my_company_overview`, com
  `CompanyMember.active`, `CompanyPolicy#mcp_read?` e `advanced_analytics`.
- Antes da C4, o transporte privado não aplicava `Mcp::RemoteQuotaPolicy` nem
  `Mcp::RemoteTelemetry` diretamente.
- O protocolo moderno `2026-07-28` usa mensagens sem sessão com metadados
  por requisição, separados da rota legada `2025-11-25`.
- Existem specs Doorkeeper, protocolo e negativas; **não constituem evidência de staging externo**.

## 2. Alterações da C4

### 2.1 Quotas privadas (fail-closed)

`Mcp::RemoteQuotaPolicy` recebe `mode: :private` e exige
`MCP_PRIVATE_REMOTE_POLICY_ENABLED=true`.

Limites **iniciais conservadores de homologação**, não carga de produção aprovada:

| Dimensão | Limiar | Janela | Origem |
| --- | ---: | --- | --- |
| usuário autenticado | 20 | minuto | OAuth subject validado |
| OAuth client | 40 | minuto | Doorkeeper application.uid |
| IP | 80 | minuto | Rails request.remote_ip (proxy confiável) |
| OAuth client (diário) | 300 | dia UTC | mesmo client.uid |
| tenant | 100 | minuto | Company.id **após** CompanyMember + policy + entitlement |

- Redis atomic EVAL; HMAC-SHA256 na chave; não grava subject, client, tenant ou IP em texto.
- `429` com `Retry-After` ao exceder; `503` com fail-closed quando Redis ou flag não estiverem disponíveis.
- A quota global é aplicada após OAuth e **antes** da execução do protocolo.
- A quota tenant é aplicada somente depois que o backend resolve e autoriza
  `Company`. Um `company_id` arbitrário jamais define o contador.
- Chamadas inválidas e não autorizadas não ganham acesso a outros tenants,
  independentemente do contador. Contagens são consumo de budget, não
  identificação nem autorização.
- **Atenção:** limites, configuração de proxy confiável e tráfego legítimo
  precisam ser testados com carga em staging antes de produção.

### 2.2 Observabilidade privada

`Mcp::Private::Telemetry` publica `mcp.private.request`, com
`surface`, `operation`, `tool` restritos a allowlists, `outcome`,
`http_status`, `duration_ms` e um request ID seguro (opcional).

**Jamais publicar** tokens, texto de tools/call, company ID, user ID, endereços,
IP ou argumentos em logs/métricas.

### 2.3 Validação ponta a ponta local

`c4_oauth_end_to_end_spec.rb` exerce:

1. Criação de grant Doorkeeper com PKCE S256 vinculado a `/mcp`;
2. Troca por token opaco real via `/oauth/token`;
3. `tools/list` e `tools/call` com Bearer real e allowlist pública;
4. Revogação via `/oauth/revoke` seguida de `401`;
5. Token privado válido para `/mcp/private` é rejeitado em `/mcp`;
6. Token OAuth privado real permite consultar apenas a empresa do usuário.

O banco e Redis desses testes são **efêmeros de CI**, não staging/prod.

## 3. C4 — preparação de staging

> A existência do workflow **não comprova** DNS, TLS, credenciais ou OAuth E2E.

### Infraestrutura isolada necessária

- Host HTTPS aprovado, exemplo: `mcp-staging.avaliasolar.com.br`.
- Rails staging isolado, PostgreSQL e Redis separados de produção.
- Doorkeeper no mesmo realm de staging, com usuários sintéticos e autorização real.
- Registro explícito de clientes públicos com callback HTTPS/loopback permitido,
  PKCE S256 e scope mínimo.
- Recursos exatos `https://<host>/mcp` e
  `https://<host>/mcp/private`, armazenados em tokens Doorkeeper.
- `MCP_REMOTE_ALLOWED_HOSTS` e `MCP_PRIVATE_ALLOWED_HOSTS` exatos;
  origens `Origin` explicitamente permitidas — sem wildcard.
- Certificado TLS válido. Não usar bypass de verificação TLS.
- Testar rotas público e privado apenas com dados sintéticos de staging.

### Flags staging propostas (somente após isolamento comprovado)

```dotenv
MCP_REMOTE_TRANSPORT_ENABLED=true
MCP_REMOTE_AUTH_MODE=oauth
MCP_REMOTE_OAUTH_ENABLED=true
MCP_REMOTE_POLICY_ENABLED=true
MCP_PUBLIC_TOOLS_EXECUTION_ENABLED=true
MCP_PRIVATE_REMOTE_TRANSPORT_ENABLED=true
MCP_PRIVATE_REMOTE_OAUTH_ENABLED=true
MCP_PRIVATE_REMOTE_POLICY_ENABLED=true
# MCP_OAUTH_ISSUER=https://mcp-staging.avaliasolar.com.br
# MCP_OAUTH_RESOURCE=https://mcp-staging.avaliasolar.com.br/mcp
# MCP_PRIVATE_OAUTH_RESOURCE=https://mcp-staging.avaliasolar.com.br/mcp/private
```

**Nunca copiar essas flags para produção como etapa automática da PR.**

### Ambiente GitHub `mcp-staging`

| Variável/secret | Uso |
| --- | --- |
| `vars.MCP_STAGING_RESOURCE_URL` | HTTPS `/mcp` público |
| `secrets.MCP_STAGING_ACCESS_TOKEN` | Token público temporário, sem PII |
| `vars.MCP_STAGING_PRIVATE_RESOURCE_URL` | HTTPS `/mcp/private` |
| `secrets.MCP_STAGING_PRIVATE_ACCESS_TOKEN` | Token privado temporário |
| `vars.MCP_STAGING_PRIVATE_COMPANY_ID` | Empresa sintética autorizada |
| `vars.MCP_STAGING_PRIVATE_FORBIDDEN_COMPANY_ID` | Empresa sintética sem membership |

Executar **Actions → MCP Staging — External OAuth Interoperability Smoke →
Run workflow**, fornecendo confirmação `STAGING_ONLY` e target
`public`, `private` ou `both`.

O teste privado verifica o catálogo (somente 1 tool), token OAuth,
resumo da própria empresa, negação cruzada e `401` sem token e com token falso.
A execução exige as fixtures explícitas; sem elas deve falhar, não fingir sucesso.

**Limite:** o smoke usa tokens preemitidos; ainda exige prova separada de
consentimento, login de usuário via navegador, PKCE, renovação e revogação
reais contra o staging aprovado.

## 4. Matriz de interoperabilidade obrigatória

| ID | Cenário | Evidência antes de GO |
| --- | --- | --- |
| I-01 | OAuth issuer/metadata exatos, sem segredos | Requisições HTTPS |
| I-02 | Consentimento e login Devise, Authorization Code + PKCE S256 | Browser + client real |
| I-03 | Refresh/revogação invalida acesso em ambas as rotas | Logs de status, sem token |
| I-04 | Rejeição de issuer, token, resource e scope divergentes | HTTP 401/403 |
| I-05 | 5 ferramentas públicas: schemas e dados reais autorizados | 5 `tools/call` em staging |
| I-06 | 1 privada: membership ativo, Pundit e entitlement | Matriz de 2 tenants |
| I-07 | Quotas por usuário, client, IP, tenant e Redis indisponível | 429/503 e alertas |
| I-08 | Sem PII, prompts ou bearer nos logs | Revisão AppSec observabilidade |
| I-09 | Compatibilidade 2026-07-28 e fallback legado, sem downgrade de auth | 2 SDKs independentes |
| I-10 | ChatGPT e Claude (quando suportarem conexão) | Consentimento do usuário |
| I-11 | Host/Origin, CSRF, redirect URI, callback e TLS | Testes adversariais |
| I-12 | Carga, latência, alertas e rollback ensaiado | SRE aprovado |

A referência normativa do adaptador moderno é:
`https://modelcontextprotocol.io/specification/2026-07-28`.

### Riscos residuais e blockers

- Fluxo `/oauth/authorize` com sessão Devise precisa de E2E browser real;
  não usar token JWT legado da aplicação para contornar login.
- Clientes MCP podem exigir Client ID Metadata Documents (CIMD) e fluxos
  adicionais de registro/autorização que precisam ser compatibilizados e
  homologados. Não abrir permissões de redirect arbitrárias.
- O `mcp-staging` deve ser provisionado pela equipe autorizada de operações;
  esta branch não possui credenciais para fazê-lo.
- Uma execução de contract gate no GitHub **não garante** conectividade externa.
- Entitlement `advanced_analytics` atualmente é precondição do endpoint
  privado; revisar produto e compliance antes de liberar a um assinante.

## 5. GO/NO-GO e segurança de produção

**Estado:** NO-GO.

Antes de qualquer ativação:

1. CI completo e gate MCP verdes no commit exato.
2. Staging HTTPS ativo, isolado de produção.
3. I-01 a I-12 evidenciados; sem pendência P0.
4. Revisão Produto, Backend, AppSec, Privacidade/DPO e SRE.
5. Relatório de cookies/sessão, PKCE, tokens e callback sem segredos.
6. Monitoramento por produto, alertas de quota, plano de incidente.
7. Aprovação explícita com janela operacional e rollback ensaiado.

### Defaults e rollback

```dotenv
# Produção — permanecer em false até GO específico.
MCP_REMOTE_PRODUCTION_ENABLED=false
MCP_REMOTE_TRANSPORT_ENABLED=false
MCP_PUBLIC_TOOLS_EXECUTION_ENABLED=false
MCP_PRIVATE_REMOTE_TRANSPORT_ENABLED=false
MCP_PRIVATE_REMOTE_OAUTH_ENABLED=false
MCP_PRIVATE_REMOTE_POLICY_ENABLED=false
```

Se a ativação futura falhar: desligar primeiro
`MCP_PUBLIC_TOOLS_EXECUTION_ENABLED` e
`MCP_PRIVATE_REMOTE_TRANSPORT_ENABLED`; em seguida
`MCP_REMOTE_TRANSPORT_ENABLED` ou
`MCP_REMOTE_PRODUCTION_ENABLED` para corte total. Revogar tokens expostos e
validar 404/401 conforme configuração. Não imprimir secrets em incidentes.

## 6. Escopo explicitamente não realizado pela PR

- Não executa deploy, migração, mudança de DNS, registro de OAuth clients ou
  ativação de flags em produção.
- Não se conecta a ChatGPT/Claude automaticamente.
- Não afirma que o smoke externo foi executado sem evidência do workflow.
- Não habilita CRM/leads, operações administrativas, writes ou ferramentas
  privadas adicionais.

## 7. Evidências de CI

Registrar após a PR:

- SHA da branch e SHA da `main` no gate;
- URLs dos workflows e conclusões;
- RSpec MCP / Ruby syntax;
- relatório manual das observações staging e dois SDKs;
- decisão GO/NO-GO assinada.

**Até essas evidências existirem: implementação de código ≠ MCP homologado.**
