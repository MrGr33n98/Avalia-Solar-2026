# Spec 020 — SECURITY MODEL

## 1. Ativos e fronteiras

| Ativo | Fronteira | Controle atual | Mudança 020 |
|---|---|---|---|
| Dados de tenant (privado) | `/mcp/private` | OAuth Doorkeeper, `PrivateResourceAuthorization`, Pundit `Mcp::Private::CompanyPolicy`, quota por tenant (F-29, F-33) | `_meta` sem tenant; log com `tenant_digest` |
| Catálogo público | `/mcp` | input validator, quotas, canary, flags (F-21, F-32) | prompts e completions só com enums públicos |
| Widgets `ui://` | `resources/read` | allowlist de URI, `safe_bundle_path` com `realpath`, CSP em `_meta` (resource_registry) | só manifest e hash; sem mudança de leitura |
| Pipeline CI | GitHub Actions | Gitleaks, Brakeman, `npm audit` | job `evidence-lab` sem secrets |
| Estação de dev | MCP REA local | — | registro REA restrito ao Claude Code e Antigravity |

## 2. Ameaças e mitigação

| ID | Ameaça | Mitigação |
|---|---|---|
| S-01 | Exposição de tools REA (exec, debug, Frida, adb) a clientes externos | **Proibido** (PDR-01). Teste de contrato: `tools/list` do `/mcp` e do `/mcp/private` não contém nenhum nome do `rea-mcp-tools.json` |
| S-02 | Enumeração de empresas via completion | completion só com `Category` ativas e UFs (PDR-06); quota preview e oauth já se aplica (F-29) |
| S-03 | Vazamento de PII no ledger | Lista de campos fechada (EVIDENCE_CONTRACTS §3); teste que falha ao achar chave fora da allowlist |
| S-04 | Cardinalidade e DoS em métricas | `evidence_id` nunca como label (RNF-04) |
| S-05 | Supply chain do REA (175 pacotes, F-81) | Versão fixa, sem secrets no job, `permissions: contents: read`, sem `GITHUB_TOKEN` com escrita, alvos só em loopback. `rea update` proibido no CI |
| S-06 | REA acessando rede externa a partir do CI | Só `127.0.0.1`; `--allowed-origins http://127.0.0.1:<porta>` em todos os comandos CDP; `--fetch-source-maps` só para a origem local |
| S-07 | Captura com dados de clientes | Fixtures estáticos (`staging-fixtures.ts`); proibido HAR de staging ou produção; as seções `accessibility`, `storage_keys` e `console_text` seguem `policy_filtered` (F-47) |
| S-08 | Uso do REA fora do escopo legal | Só artefatos próprios (Avalia Solar). O `DISCLAIMER.md` do REA (F-82) é seguido; nada de análise de concorrentes |
| S-09 | Drift de configuração local expondo o MCP REA a outros clientes | `rea setup` só para os clientes escolhidos; `rea doctor` no checklist de dev |
| S-10 | Forjar um `evidence_id` | O ID é verificável: o operador recalcula a partir do log. Não é assinatura; **não** usar como prova jurídica sem assinatura (fase futura, fora do escopo) |

## 3. Invariantes que não podem regredir

- OAuth e Pundit no privado; escopo de tenant em toda consulta.
- `readOnlyHint: true` em todas as tools públicas.
- Flags `MCP_*` existentes com o mesmo significado.
- `initialize` idêntico com as flags novas desligadas.

## 4. Licenciamento

- REA é MIT (F-80). Uso em CI e dev não cria obrigação de distribuição, porque o REA não é embarcado em imagem.
- Revisar `THIRD_PARTY_NOTICES.md` a cada upgrade (os engines opcionais Hopper, Ghidra e IDA têm licenças próprias e **não** serão instalados no CI).
