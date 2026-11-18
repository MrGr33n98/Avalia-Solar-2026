# Avalia Solar MCP C4 — Implementação, homologação e Go/No-Go

**Estado:** C4 hardening em PR draft; sem habilitação de produção.  
**Base auditada:** `main` em `790fad53` (2026-11-18).  
**Responsáveis operacionais:** Backend, AppSec, SRE, Privacidade e Produto.  
**Escopo:** Transporte público e privado / OAuth Doorkeeper / quotas e telemetria / interoperabilidade em staging.

## 1. Implementado nesta PR

- `Mcp::RemoteQuotaPolicy` recebe `mode: :private`; usa Redis EVAL e falha fechado.
- O limite privado de requisição é por **usuário, OAuth client, IP e dia**; a flag `MCP_PRIVATE_REMOTE_POLICY_ENABLED` é independente da pública.
- A quota adicional **por tenant** roda após `CompanyContext.resolve!` + `Mcp::Private::CompanyPolicy#mcp_read?`; identifica somente o `Company.id` canônico autorizado. Sem leitura de `company_id` arbitrário como namespace.
- Chaves Redis usam HMAC SHA-256; identidades e IDs da empresa não aparecem como textos nas chaves.
- HTTP `429` informa `Retry-After`; Redis indisponível ou política não configurada produz `503`. Não retornar conteúdo privado em erro.
- `Mcp::Private::Telemetry` publica o evento `mcp.private.request` com operação, nome de ferramenta em allowlist, status, duração limitada e request ID validado. Nunca incluir token, user ID, company ID, IP, argumentos ou conteúdo dos resultados.
- O gate MCP inclui specs do Doorkeeper C4, quotas, protocolo privado e telemetria.
- Smoke staging manual por escolha `public|private|both`, sem mutações em dados.

## 2. Diferença entre código e homologação

**CI aprovado NÃO prova interoperabilidade externa.**
Não usar descrições de PR, documentação ou mocks como evidência de execução com ChatGPT/Claude.
Aprovar GO somente após execução real, com URLs, datas, versões dos SDKs, requests anonimizados e resultados assinados.

## 3. Configurar staging (ações externas; nunca em produção automaticamente)

1. Provisionar stack isolada com banco e Redis de testes, sem usar dados pessoais de clientes. HTTPS/TLS e DNS próprios.
2. Definir um hostname de **staging** aprovado; separar OAuth issuer e recursos HTTPS:
   - Recurso público: `https://<staging-host>/mcp`
   - Recurso privado: `https://<staging-host>/mcp/private`
3. Confirmar migrations Doorkeeper no staging, autorização web Devise/Doorkeeper, PKCE S256, recurso OAuth RFC 8707 e retorno de tokens opacos.
4. Cadastrar clientes OAuth públicos de teste e redirecionamentos EXATOS no staging. Nunca reutilizar client IDs ou tokens de produção.
5. Criar um usuário de teste com membership ativo numa empresa de teste A, plano com `advanced_analytics` concedido; criar empresa B ativa SEM vínculo ao usuário.
6. Criar duas empresas públicas **ativas** de teste A/B para comparação do catálogo. Garantir que os IDs referenciam empresas **publicadas**; manter dados fictícios marcados como fixtures somente em staging.
7. Habilitar em **staging exclusivamente** as flags de transporte, OAuth e quotas de acordo com `C2_STAGING_INTEGRATION.md` e `C3_STAGING_INTEGRATION.md`. Não ligar `MCP_REMOTE_PRODUCTION_ENABLED` em produção.
8. Registrar `MCP_PRIVATE_REMOTE_POLICY_ENABLED=true` em staging antes de usar endpoint privado; ausência da flag devolve `503` com fail-closed.

### GitHub environment `mcp-staging`

Configuração proposta (não se presume existente):

| Tipo | Chave | Conteúdo |
|---|---|---|
| Variable | `MCP_STAGING_RESOURCE_URL` | URL HTTPS completa terminando em `/mcp` |
| Secret | `MCP_STAGING_ACCESS_TOKEN` | Bearer público de teste obtido via OAuth PKCE |
| Variable | `MCP_STAGING_PUBLIC_COMPANY_A_ID` | ID de empresa pública ativa A |
| Variable | `MCP_STAGING_PUBLIC_COMPANY_B_ID` | ID de empresa pública ativa B, diferente de A |
| Variable | `MCP_STAGING_PRIVATE_RESOURCE_URL` | URL HTTPS completa terminando em `/mcp/private` |
| Secret | `MCP_STAGING_PRIVATE_ACCESS_TOKEN` | Bearer privado de teste para usuário com membership A |
| Variable | `MCP_STAGING_PRIVATE_COMPANY_ID` | ID do tenant autorizado A |
| Variable | `MCP_STAGING_PRIVATE_FORBIDDEN_COMPANY_ID` | ID do tenant não autorizado B |

**Não** registrar segredos em variável pública. Aplicar aprovações de ambiente para proteger o uso dos tokens.

### Executar smoke manual

GitHub → Actions → `MCP Staging — External OAuth Interoperability Smoke` → Run workflow.
Selecionar `target=both`, preencher **`confirmation=STAGING_ONLY`**.
A workflow não cria tokens, não modifica ambientes nem ativa MCP.

- Público: discovery, catálogo de **5 ferramentas**, execução de cada uma e negação de ferramenta interna.
- Privado: metadata, lista limitada a uma ferramenta, consulta da própria empresa, negativa de outra empresa, rejeição de bearer ausente/inválido.
- Limitações: esse smoke não substitui testes de obtenção PKCE no browser/cliente, refresh/rotatividade, token revogado, quotas em concorrência e dois SDKs independentes.

## 4. Testes obrigatórios adicionais fora do smoke

| ID | Teste | Critério |
|---|---|---|
| C4-OAUTH-01 | Authorization Code + PKCE S256 | Token Doorkeeper emitido e aceito pelo resource correto |
| C4-OAUTH-02 | Recurso privado vs público | Token de um resource nunca autoriza o outro |
| C4-OAUTH-03 | Refresh e revogação | Revogado/expirado negado; refresh não permite replay |
| C4-PUB-01 | 5 ferramentas públicas | Cada resposta passa schema/sem dados privados |
| C4-PRIV-01 | Company A / B | B sempre negada mesmo com ID conhecido |
| C4-PRIV-02 | CompanyMember revogado e empresa inativa | Acesso negado |
| C4-PRIV-03 | Plano sem entitlement | Ferramenta privada negada |
| C4-PRIV-04 | Redis indisponível | 503 sem execução; nenhum bypass |
| C4-QUOTA-01 | Usuário, client, IP, tenant | 429 + Retry-After; chaves HMAC |
| C4-OBS-01 | Logs e telemetria | Nenhuma identificação de tenant/token/PII |
| C4-SDK-01 | Cliente SDK A | OAuth e ferramentas aprovados |
| C4-SDK-02 | Cliente SDK B distinto | OAuth e ferramentas aprovados |
| C4-UI-01 | ChatGPT | Conexão autorizada com tools públicos |
| C4-UI-02 | Claude | Conexão autorizada com tools públicos/privados |

## 5. Critérios GO / NO-GO

NO-GO se qualquer item abaixo for verdadeiro:

- CI ou MCP contract gate falhou.
- Não existe staging isolado, DNS ou TLS válido.
- Tokens de staging não são emitidos por OAuth real com PKCE.
- Tenant B pode ser consultado com token do A.
- Controles do backend/policy/quotas podem ser contornados.
- Quotas não são fail-closed ou logs incluem dados sensíveis.
- Toolkit interno `/api/v1/mcp/tools/:tool_name` aparece em catálogo externo.
- Testes com 2 clientes SDK e ChatGPT/Claude não estão documentados.
- Não há aprovações Backend, AppSec, Privacidade e SRE.

## 6. Rollback

1. Em caso de incidente externo, desligar **execução** pública no ambiente afetado: `MCP_PUBLIC_TOOLS_EXECUTION_ENABLED=false`.
2. Desabilitar transporte privado: `MCP_PRIVATE_REMOTE_TRANSPORT_ENABLED=false`.
3. Desabilitar transporte público: `MCP_REMOTE_TRANSPORT_ENABLED=false`.
4. Revogar tokens/clientes impactados, verificar status de quota e alertas, registrar incidente sem registrar segredos.
5. Se necessário, reverter a PR C4 em `main` via fluxo aprovado; não executar `reset --hard` no host de produção.
6. Após rollback, validar HTTP 404 para endpoints protegidos e login tradicional inalterado.

**Esta documentação não concede autorização para ligar flags de produção.**
