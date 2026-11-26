# Spec 020 — ARCHITECTURE

## 1. Princípio

O REA é uma **ferramenta de bancada e de CI** para gerar evidência sobre os artefatos do próprio Avalia Solar. Ele **nunca** roda no runtime de produção e **nunca** é exposto aos clientes MCP do Avalia Solar. O que chega ao produto é só o **contrato de evidência** (IDs, digests e manifestos), implementado em Ruby/TS nativo, sem dependência do REA.

## 2. Três planos

```
┌─────────────────────────── PLANO DE PRODUTO (prod) ───────────────────────────┐
│ Clientes MCP ─► /mcp (público, 5 tools RO) ─► Executor ─► Services ─► Postgres │
│                /mcp/private (OAuth+Pundit, 1 tool)                             │
│  + _meta.evidence {evidence_id, content_sha256, request_id, contract_version}  │  ◄─ novo (flag)
│  + log estruturado "mcp.evidence" ─► stdout ─► agregador de logs existente     │  ◄─ novo (flag)
│  + prompts/list, completion/complete (somente enums públicos)                  │  ◄─ novo (flag)
└────────────────────────────────────────────────────────────────────────────────┘
┌──────────────────────── PLANO DE EVIDÊNCIA (GitHub Actions) ───────────────────┐
│ job "evidence-lab" (Node 22.23.x, sem secrets, permissions: contents: read)    │
│  build mcp-ui ─► dist/ (servido) + dist-analysis/ (sourcemap, não-minificado)  │
│  REA: inspect-api-contract · analyze-javascript-application · capture-web-*    │
│       compare-web-screenshots · compare-artifacts · evidence-export            │
│  ─► artifact "evidence-bundle-<sha>" (retenção 30 dias)                        │
└────────────────────────────────────────────────────────────────────────────────┘
┌──────────────────────────── PLANO DE BANCADA (dev) ────────────────────────────┐
│ Claude Code / Antigravity ─► MCP REA (stdio local) ─► loopback Chrome/Next     │
│ guided workflows: investigate_feature, compare_application_versions, ...       │
└────────────────────────────────────────────────────────────────────────────────┘
```

## 3. Componentes novos

| Componente | Plano | Linguagem | Depende do REA? | Flag |
|---|---|---|---|---|
| `Mcp::Evidence::Envelope` (gera o `_meta.evidence`) | produto | Ruby | não | `MCP_EVIDENCE_META_ENABLED` |
| `Mcp::Evidence::Logger` (evento `mcp.evidence`) | produto | Ruby | não | `MCP_EVIDENCE_LOG_ENABLED` |
| `Mcp::PromptRegistry` + handler `prompts/*` | produto | Ruby | não | `MCP_PROMPTS_ENABLED` |
| `Mcp::CompletionService` (`completion/complete`) | produto | Ruby | não | `MCP_COMPLETIONS_ENABLED` |
| `packages/mcp-ui` build `--analysis` | CI | Node | não | — |
| `.github/workflows/evidence-lab.yml` | CI | YAML | **sim** | `workflow_dispatch` + `pull_request` com paths |
| `scripts/evidence/*.mjs` (wrappers REA → resumo md) | CI e dev | Node | **sim** | — |

## 4. Isolamento no GitHub Actions

- `runs-on: ubuntu-24.04`, `permissions: { contents: read }`, **sem `environment`** e sem secrets.
- `actions/setup-node` com `22.23.x`; `npm i -g rea-agents@6.10.1 --ignore-scripts=false` com **versão fixa** e verificação de integridade pelo `npm-shrinkwrap` do pacote.
- Navegador: o Chromium do Playwright já está em cache no runner; CDP só em `127.0.0.1`.
- Alvos: só `127.0.0.1` (servidor estático do `dist/`) e arquivos do checkout. **Proibido:** apontar para staging ou produção, ou usar HAR com dados reais.
- `timeout-minutes: 20`; cada comando REA com `--analysis-timeout-ms` e `--total-analysis-timeout-ms` explícitos.
- Executar em `pull_request` só para paths `packages/mcp-ui/**`, `AB0-1-back/swagger/**` e `AB0-1-back/app/services/mcp/**`; também via `workflow_dispatch`.
- Fork PRs: sem diferença, porque o job não tem secrets.

## 5. Por que não um serviço

Um "REA server" interno teria custo fixo (~256 MB ociosos, F-09; picos de 654 MB, F-44), superfície de ataque (42 tools destrutivas ou open-world, F-05) e nenhum consumidor em runtime. O valor do REA está em **gerar evidência na mudança**, e isso cabe em CI efêmero.

## 6. Compatibilidade preservada

- `_meta` fica fora do `outputSchema`; clientes que ignoram `_meta` não mudam.
- `prompts` e `completions` só aparecem nas capabilities quando a flag está ligada; o `initialize` continua o mesmo com a flag desligada.
- Não muda OAuth, quotas (F-29), Pundit (F-33), canary nem o catálogo de 5 tools (F-21).
