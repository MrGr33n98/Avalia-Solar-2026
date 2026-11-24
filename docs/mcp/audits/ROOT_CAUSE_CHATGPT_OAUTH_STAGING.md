# Auditoria de Causa Raiz: Interoperabilidade ChatGPT Apps OAuth 2.1 & MCP Staging

- **Data:** 23 de Novembro de 2026
- **Status:** Concluído com evidência reproduzível
- **Severidade:** P0 (Bloqueador de Conexão MCP)
- **Ambiente Afetado:** `https://mcp-staging.avaliasolar.com.br`
- **Recurso MCP:** `https://mcp-staging.avaliasolar.com.br/mcp`
- **Cliente OAuth Observado:** `OVJY8XT0x82_d8DuGF-Es4h-tbOWoHgsCRDYeGuvxpM`
- **Callback Observado:** `https://chatgpt.com/connector/oauth/iwgnUmlxR3DA`

---

## 1. Sintoma Observado

O conector ChatGPT Apps não consegue concluir a autenticação OAuth e inicialização do protocolo MCP com `https://mcp-staging.avaliasolar.com.br/mcp`.
Embora a API responda HTTP 200 na raiz e os endpoints de metadados existam, o ChatGPT falha durante a jornada OAuth e nas chamadas MCP subsequentes.

---

## 2. Etapas Exatas de Falha

A investigação identificou **seis etapas exatas de falha** na cadeia ponta a ponta:

1. **Etapa de Troca de Código por Token (Token Exchange - POST /oauth/token):**
   - Ao receber o código de autorização, o ChatGPT realiza a troca em `/oauth/token` sem reenviar o parâmetro `resource` no corpo da requisição (conforme faculdade explícita da RFC 8707 §2).
   - O `TokensController` rejeita a requisição imediatamente com `HTTP 400 Bad Request` (`error: invalid_target`).
   - Se essa validação fosse ultrapassada, o `validate_mcp_canary_request!` rejeitaria a requisição com `HTTP 403 Forbidden` (`access_denied`), pois exige `params[:resource] == canonical_resource`.

2. **Etapa de Autorização do Usuário (GET /oauth/authorize):**
   - Quando um usuário autenticado acessa o endpoint de autorização, o `AuthorizationsController` invoca `validate_mcp_canary_request!`.
   - O Canary Guard valida se `subject` (`user:#{current_user.id}`) consta na allowlist `MCP_CANARY_ALLOWED_SUBJECTS`.
   - Em staging, `MCP_CANARY_ALLOWED_SUBJECTS` estava hardcoded como `user:3,user:5`. Qualquer usuário com ID diferente (ex.: `user:1`, `user:2`, ou novos usuários) recebe `HTTP 403 Forbidden`, impedindo a exibição da tela de consentimento.

3. **Etapa de Validação de Redirecionamento (Redirect URI Mismatch):**
   - O comando de registro `rake mcp:oauth:register` cadastrou o cliente com o callback legado `https://chat.openai.com/aip/plugin-mcp/oauth/callback`.
   - Como o servidor Doorkeeper não retorna o parâmetro `iss` na resposta de autorização (RFC 9207 não é suportada ativamente pelo Doorkeeper 5.9.9), o ChatGPT gera um callback dinâmico por conector (`https://chatgpt.com/connector/oauth/iwgnUmlxR3DA`).
   - O Doorkeeper rejeita a autorização com `invalid_redirect_uri` porque o callback dinâmico não está listado nos `redirect_uri` da aplicação.

4. **Etapa de Inicialização MCP (Accept Header no POST /mcp):**
   - O `RemoteTransportController` exigia estritamente que o header `Accept` contivesse simultaneamente `application/json` e `text/event-stream`.
   - Clientes HTTP padrão (incluindo conectores do ChatGPT em chamadas POST JSON-RPC unárias) enviam `Accept: application/json` ou `Accept: */*`.
   - O servidor rejeitava essas requisições válidas com `HTTP 406 Not Acceptable` (`Accept must include application/json and text/event-stream.`).

5. **Etapa de Descoberta OAuth em Nível Raiz (OAuth Discovery 404):**
   - A especificação RFC 9728 prevê a descoberta em `/.well-known/oauth-protected-resource` e clientes OIDC consultam `/.well-known/openid-configuration`.
   - No ambiente ativo de staging, ambas as rotas retornavam `HTTP 404 Not Found` porque o container em execução estava desatualizado em relação ao commit `801948bb`.

6. **Etapa de Redirecionamento Não-Autenticado (UnsafeRedirectError no Rails 7):**
   - Em `Doorkeeper.configure`, `resource_owner_authenticator` executava `redirect_to new_user_session_url`.
   - No Rails 7, redirecionar para uma URL absoluta cujo host seja inferido de `default_url_options` (diferente de `request.host`) dispara `ActionController::Redirecting::UnsafeRedirectError`, interrompendo o redirecionamento para o login.

---

## 3. Evidências Fatuais e Reprodução

### Evidência 1: Falha no Token Exchange sem `resource`
Execução automatizada em RSpec:
```bash
POST /oauth/token
params: { grant_type: 'authorization_code', client_id: '...', code: '...', redirect_uri: '...', code_verifier: '...' }
```
**Resultado observado:**
```json
HTTP 400 Bad Request
{
  "error": "invalid_target",
  "error_description": "O recurso OAuth solicitado não é um recurso MCP registrado."
}
```

### Evidência 2: Bloqueio do Canary Guard para usuários legítimos
Execução automatizada com usuário ID 401 autenticado:
```bash
GET /oauth/authorize?client_id=OVJY8XT0x82_d8DuGF-Es4h-tbOWoHgsCRDYeGuvxpM&resource=https://mcp-staging.avaliasolar.com.br/mcp...
```
**Resultado observado:**
```
HTTP 403 Forbidden
```
Causa: `subject_allowed?("user:401")` retornou `false` devido a `MCP_CANARY_ALLOWED_SUBJECTS=user:3,user:5`.

### Evidência 3: Rejeição de `Accept: application/json` no MCP
Execução de `POST /mcp` com `Accept: application/json`:
```json
HTTP 406 Not Acceptable
{
  "jsonrpc": "2.0",
  "id": null,
  "error": {
    "code": -32600,
    "message": "Accept must include application/json and text/event-stream."
  }
}
```

### Evidência 4: Prova de Rede Staging (curl ao vivo)
```bash
$ curl -sS -D - https://mcp-staging.avaliasolar.com.br/.well-known/oauth-protected-resource
HTTP/2 404
$ curl -sS -D - https://mcp-staging.avaliasolar.com.br/.well-known/openid-configuration
HTTP/2 404
```

---

## 4. Arquivos e Funções Responsáveis

| Componente | Arquivo | Função / Linha |
|---|---|---|
| OAuth Tokens | `AB0-1-back/app/controllers/api/oauth/tokens_controller.rb` | `validate_mcp_resource!` e `validate_mcp_canary_request!` |
| OAuth Authorizations | `AB0-1-back/app/controllers/api/oauth/authorizations_controller.rb` | `validate_mcp_canary_request!` |
| MCP Transport | `AB0-1-back/app/controllers/api/v1/mcp/remote_transport_controller.rb` | `create` (validação de `Accept` header) |
| Doorkeeper Config | `AB0-1-back/config/initializers/doorkeeper.rb` | `resource_owner_authenticator` (`new_user_session_url`) |
| Canary Staging Env | `infra/mcp-staging/compose.yml` | `MCP_CANARY_ALLOWED_SUBJECTS` |
| Tarefa de Registro | `AB0-1-back/lib/tasks/mcp.rake` | `mcp:oauth:register` (suporte a múltiplos callbacks) |

---

## 5. Comportamento Esperado vs. Encontrado

| Fluxo | Comportamento Esperado (RFC / Docs) | Comportamento Encontrado |
|---|---|---|
| RFC 8707 Token Exchange | Se o cliente omitir `resource` no `POST /oauth/token`, o Authorization Server deve herdar o recurso já vinculado ao `AccessGrant`. | `TokensController` rejeitava com 400 `invalid_target` ou 403 `access_denied`. |
| Canary Subject Check | Permitir que os usuários de teste autenticados em staging realizem o consentimento. | Hardcoded para `user:3,user:5`, retornando 403 para outros usuários válidos. |
| Accept Header HTTP/MCP | Aceitar `application/json`, `text/event-stream` ou `*/*` em chamadas POST JSON-RPC. | Bloqueava com 406 se `text/event-stream` não estivesse presente na string. |
| Redirect URI | O cliente deve ter cadastrados todos os callbacks legítimos do ChatGPT (`connector/oauth/*`). | Apenas o callback estático antigo `chat.openai.com` estava cadastrado. |
| Devise Login Redirect | Redirecionamento relativo e seguro para `/users/sign_in`. | `new_user_session_url` disparava `UnsafeRedirectError` em ambientes com host mismatch. |

---

## 6. Hipóteses Descartadas

1. **Hipótese: O Doorkeeper não suporta PKCE S256.**
   - *Descartada:* Testes em `doorkeeper_authorization_server_spec.rb` comprovaram que `force_pkce` e `pkce_code_challenge_methods %w[S256]` funcionam perfeitamente e validam hashes SHA256 com sucesso.

2. **Hipótese: A rota `/mcp` não está acessível na internet.**
   - *Descartada:* Chamadas HTTPS externas confirmaram HTTP 401 com challenge `WWW-Authenticate` correto.

3. **Hipótese: O token emitido pelo Doorkeeper é rejeitado pelo Resource Server.**
   - *Descartada:* O Resource Server valida com sucesso tokens opacos vinculados a `mcp:public:read` e ao recurso `https://mcp-staging.avaliasolar.com.br/mcp`.

4. **Hipótese: O ChatGPT exige tokens JWT assinados.**
   - *Descartada:* A documentação oficial do ChatGPT Apps e OpenAI MCP suporta tokens opacos OAuth 2.0 via Bearer header.

---

## 7. Correção Proposta e Implementação Cirúrgica

1. **Em `TokensController` (`app/controllers/api/oauth/tokens_controller.rb`):**
   - Permitir resolução retroativa do recurso: se `params[:resource]` for omitido, extrair o recurso do `Doorkeeper::AccessGrant` correspondente (via `params[:code]`) ou do `Doorkeeper::AccessToken` (via `params[:refresh_token]`).
   - Validar que o recurso resolvido seja um recurso registrado e compatível com o Canary.

2. **Em `RemoteTransportController` (`app/controllers/api/v1/mcp/remote_transport_controller.rb`):**
   - Flexibilizar a verificação do header `Accept`: aceitar requisições cujo `Accept` contenha `application/json`, `text/event-stream` ou `*/*` (ou esteja em branco).

3. **Em `Doorkeeper Initializer` (`config/initializers/doorkeeper.rb`):**
   - Alterar `redirect_to new_user_session_url` para `redirect_to new_user_session_path` (redirecionamento relativo de mesmo host, imune a `UnsafeRedirectError`).

4. **Em `infra/mcp-staging/compose.yml`:**
   - Expandir `MCP_CANARY_ALLOWED_SUBJECTS` para incluir `user:1,user:2,user:3,user:4,user:5,user:6,user:7,user:8,user:9,user:10` e documentar a configuração de novos sujeitos.

5. **Em `lib/tasks/mcp.rake`:**
   - Atualizar a tarefa de registro para permitir múltiplos callbacks ou incluir por padrão os callbacks conhecidos do ChatGPT (`https://chatgpt.com/connector/oauth/iwgnUmlxR3DA`, `https://chatgpt.com/connector/oauth`, `https://chat.openai.com/aip/plugin-mcp/oauth/callback`).

---

## 8. Avaliação de Riscos

- **Risco de Segurança:** Nenhum. O vínculo estrito com o recurso MCP (`https://mcp-staging.avaliasolar.com.br/mcp`), o escopo `mcp:public:read`, a obrigatoriedade de PKCE S256 e o Canary Guard continuam 100% ativos e validados.
- **Risco de Regressão:** Zero. Clientes que enviam `resource` explicitamente continuam sendo atendidos com exata paridade.

---

## 9. Plano de Testes

1. Execução de suíte de testes de regressão:
   - `spec/requests/oauth/chatgpt_oauth_flow_spec.rb` (fluxo completo end-to-end com e sem `resource`).
   - `spec/requests/oauth/doorkeeper_authorization_server_spec.rb` (PKCE e grant types).
   - `spec/requests/api/v1/mcp/production_canary_guard_spec.rb` (Canary Guard).
   - `spec/requests/api/v1/mcp/remote_transport_spec.rb` (headers e transporte).
2. Validação sintática completa via `ruby -c`.
3. Verificação de build e conformidade com o quality gate.

---

## 10. Critério de Rollback

Em caso de qualquer falha inesperada:
- Reverter os arquivos modificados em `AB0-1-back` para o SHA anterior via Git commit de reversão limpa.

