# Avalia Solar — Governança Canônica de Agentes de IA & MCP Identity (Wave 5 & 5C)

## 1. Visão Geral e Propósito

A **Wave 5 / Wave 5C (Agent Governance, Canonical Identity & Cryptographic HITL Hardening)** estabelece o modelo corporativo de identidade, autenticação criptográfica server-side, escopos, limites operacionais, isolamento estrito de tenants e supervisão humana inviolável (HITL — Human-in-the-Loop) para agentes de inteligência artificial que interagem com o ecossistema Avalia Solar via MCP (Model Context Protocol).

O objetivo é assegurar que:
1. **Nenhum agente execute ações arbitrárias ou destrutivas** (bloqueio incondicional de SQL, Shell, Eval).
2. **Nenhum agente acerte dados entre diferentes empresas** (isolamento multi-tenant estrito com FK no Postgres).
3. **Nenhum agente forje sua identidade** (autenticação server-side com par `key_id` + secret digest HMAC-SHA256).
4. **Nenhum payload seja alterado entre a solicitação e a aprovação** (HITL Cryptographic Binding com SHA-256 canônico).
5. **Nenhuma aprovação seja executada mais de uma vez ou reutilizada** (Exactly-Once execution com locks pessimistas PostgreSQL).
6. **Nenhum operador aprove a própria ação** (Anti-self-approval e separação de deveres).

---

## 2. Taxonomia Canônica de Risco (R0–R4)

Toda ferramenta MCP (`tool`) possui uma classificação de risco imutável baseada no seu impacto e potencial destrutivo:

| Tier | Categoria | Descrição | Escopos Requeridos | HITL | Exemplos de Tools |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **R0** | **Safe Read** | Consultas puras e idempotentes sem efeito colateral. | `mcp:read`, `mcp:admin` | Não | `search_companies`, `get_company_profile`, `compare_companies`, `diagnose_performance`, `get_system_health` |
| **R1** | **Analytical Draft** | Cálculos, análises heurísticas, drafts e recomendações não persistidas. | `mcp:analyze` | Não | `recommend_next_actions` |
| **R2** | **Internal Low Write** | Mutações internas de baixo impacto dentro do escopo do próprio inquilino. | `mcp:write` | Não | `create_review_request` |
| **R3** | **External Mutating** | Mutações externas, disparo de e-mails em lote, exportações volumosas de leads. | `mcp:external_mutate` | **Sim** | `send_outbound_campaign`, `bulk_lead_export`, `publish_company_update` |
| **R4** | **Critical / Financial** | Mutações financeiras, concessão de privilégios de segurança ou deleção de dados. | `mcp:admin:critical` | **Mandatory** | `charge_subscription`, `delete_tenant_data`, `grant_admin_role` |

---

## 3. Ferramentas Estritamente Proibidas (Hard Block)

Ferramentas que tentem violar o princípio de segurança e governança são bloqueadas proativamente em tempo de execução:
- `execute_sql`, `raw_sql_query`, `arbitrary_sql`, `dbhub_query`, `sql_executor`
- `exec_shell`, `bash_command`, `system_exec`, `run_shell_command`, `shell_runner`, `cmd_eval`
- `drop_database`, `truncate_tables`

Tentativas de invocação geram resposta `403 Forbidden` com código `prohibited_tool` e evento auditado com redaction estrito.

---

## 4. Identidade Canônica e Autenticação de Agentes (`AgentIdentity` & `McpAgentCredential`)

Todo agente autenticado possui uma identidade formal registrada e credencial criptográfica server-side:

### Modelo de Identidade (`AgentIdentity`)
- **`agent_id`**: Identificador canônico único (ex: `agent:hermes:outbound`, `agent:observability:primary`, `agent:support:triage`, `agent:engineering:primary`).
- **`scopes`**: Conjunto de permissões (`mcp:read`, `mcp:analyze`, `mcp:write`, `mcp:admin`, `mcp:external_mutate`, `mcp:admin:critical`).
- **`allowed_tools`**: Whitelist explícita de ferramentas que o agente pode invocar.
- **`risk_tier_max`**: Teto máximo de risco que o agente está autorizado a manipular.
- **`tenant_id`**: Inquilino vinculado (ou `nil` para agentes globais).

### Autenticação Criptográfica Server-Side (`McpAgentCredential`)
- Header obrigatório `X-Agent-Key: <key_id>:<secret>`
- O segredo é armazenado em formato hash `secret_digest` (HMAC-SHA256 via `secret_key_base`).
- Verificação segura em tempo constante (`ActiveSupport::SecurityUtils.secure_compare`).
- Bloqueio imediato de credenciais revogadas ou expiradas.
- Agentes do tipo `user` são validados diretamente via token JWT de usuário autenticado.

---

## 5. Vinculação Criptográfica do Payload HITL (`CanonicalPayloadService`)

Para impedir ataques de *Parameter Tampering* (onde o operador aprova a ação A, mas o agente executa a ação B com outros argumentos):

1. **Normalização Canônica:**
   - Ordenação recursiva lexicográfica de todas as chaves JSON.
   - Preservação da ordem de elementos em arrays.
   - Normalização de tipos primitivos (DateTime em ISO 8601 UTC).
   - Rejeição estrita de tipos não serializáveis (`invalid_payload_type`).
2. **Digest Criptográfico SHA-256:**
   - `payload_digest = SHA256(canonical_json(parameters))`
   - Armazenado como coluna `payload_digest` imutável no banco de dados (`mcp_approval_requests`).
3. **Verificação em Tempo de Execução:**
   - No momento do consumo do `approval_request_id`, o serviço recalcula o digest dos argumentos enviados e compara com o `payload_digest` aprovado via `secure_compare`.
   - Caso haja qualquer divergência de 1 bit, a execução é abortada com `403 Forbidden` (`payload_tampered`).

---

## 6. Governança de Aprovação e Prevenção de Auto-Aprovação

1. **Anti-Self-Approval:**
   - O solicitante da ação (`requested_by_user_id`) é categoricamente proibido de aprovar seu próprio pedido (`requested_by_user_id != approver.id`). Violações geram erro `self_approval_forbidden`.
2. **Autorização de Approvers:**
   - Somente operadores humanos com perfil administrativo (`role == 'admin'`) ou revisores de segurança autorizados podem aprovar requisições HITL.
3. **Validade Temporal (TTL):**
   - Requisições expiram automaticamente após o TTL configurado (padrão 1 hora). Tentativas de aprovação pós-expiração geram `approval_expired`.

---

## 7. Execução Exatamente-Uma-Vez (Exactly-Once Execution)

Para mitigar *Replay Attacks* e condições de corrida (*Race Conditions*):
- O método `McpApprovalRequest#consume_execution!` utiliza lock de linha transacional no PostgreSQL (`with_lock` / `SELECT ... FOR UPDATE`).
- Valida atomicamente se `status == 'approved' && executed_at.nil?`.
- Transiciona para `status = 'executed'`, preenche `executed_at = Time.current` e registra os metadados de execução.
- Qualquer requisição concorrente ou subsequente é bloqueada com `403 Forbidden` (`approval_already_consumed`).

---

## 8. Hardening no Banco de Dados (PostgreSQL)

A tabela `mcp_approval_requests` possui constraints estritas no nível do banco de dados:
- **CHECK constraint:** `status IN ('pending', 'approved', 'rejected', 'executed', 'expired')`
- **CHECK constraint:** `risk_tier IN ('r0', 'r1', 'r2', 'r3', 'r4')`
- **NOT NULL:** `payload_digest`, `request_uuid`, `tool_name`, `agent_id`, `risk_tier`, `status`, `requested_at`, `expires_at`
- **Foreign Keys:**
  - `fk_rails_requested_by_user` → `users(id)` ON DELETE RESTRICT
  - `fk_rails_approved_by_user` → `users(id)` ON DELETE RESTRICT
  - `fk_rails_tenant_company` → `companies(id)` ON DELETE CASCADE
- **Índices Compostos Otimizados:**
  - `[request_uuid, status]`
  - `[tenant_id, status]`
  - `[agent_id, status]`
  - `[status, expires_at]`

---

## 9. Observabilidade e Auditoria de Governança

- **Logs Estruturados:** Todas as invocações MCP e transições HITL geram logs com prefixo `[MCP_AUDIT]` em formato JSON.
- **Redaction de Segredos:** Dados confidenciais como `password`, `secret`, `token`, `key`, `authorization`, `credit_card`, `cvv` e `cpf` são automaticamente mascarados com `[REDACTED]`.
- **Correlação End-to-End:** O header `X-Trace-Id` / `X-Request-Id` é propagado em todas as respostas e logs para rastreabilidade forense completa.
