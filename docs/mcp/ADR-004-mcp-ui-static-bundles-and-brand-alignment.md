# ADR-004 a ADR-007 — Decisões Arquiteturais MCP Interactive UI (018)

- **Data:** 2026-11-24
- **Feature:** `018-mcp-interactive-ui`
- **Status:** Aceito para R1

---

## ADR-004: Empacotamento Estático Vite + Singlefile dentro do Runtime Rails Existente

* **Contexto:** Skills como `add-app-to-server` mostram servidores Node/TS servindo `registerAppTool`/`registerAppResource`. Porém, o MCP server oficial do Avalia Solar roda em Ruby on Rails 7 (`Api::V1::Mcp::RemoteTransportController` e `Mcp::ModernPreviewProtocol`), sem servidor Node separado em produção/staging.
* **Decisão:** Não criar servidor Node em runtime nem alterar o endpoint `/mcp`. Compilar o pacote `packages/mcp-ui` em build-time via Vite (`vite-plugin-singlefile` + React 18 + `@modelcontextprotocol/ext-apps`) para arquivos HTML autocontidos em `AB0-1-back/public/mcp-ui/` com `manifest.json` (URI, hash SHA256, bytes), integrados no multi-stage `Dockerfile.backend`. O Rails registra `resources/list` e `resources/read` lendo exclusivamente do manifesto permitido.
* **Consequências:** Zero custo adicional de VPS/RAM/processos; rollout atômico UI+backend e rollback instantâneo via flag `MCP_UI_ENABLED=false`.

## ADR-005: Tokens Oficiais Avalia Solar em Substituição à Paleta Provisória do Mockup

* **Contexto:** O documento `design-system.md` do pacote Spec Kit propôs `#123E36` e `#2E706E` como placeholders. A auditoria R0 de `AB0-1-front/tailwind.config.ts` e `app/globals.css` verificou a identidade oficial (`brand.blue` `#2563EB`, `brand.green` `#10B981`/`#047857`, `brand.navy` `#0F172A`, `--as-amber-400` `#F59E0B`).
* **Decisão:** Utilizar `#2563EB` (`brand.blue`) como accent primário, `#047857` (`brand.green.dark`) para badges de verificação acessíveis WCAG AA sobre fundo claro, e `--as-amber-400` apenas para estrelas acompanhadas de texto numérico, preservando as cores semânticas de superfície e texto do host ChatGPT.

## ADR-006: Preservação Estrita de `Mcp::Public::OutputValidator` e Fallback Textual

* **Contexto:** `OutputValidator` exige exatamente 5 chaves de envelope em `structuredContent` (`schema_version`, `data_as_of`, `source_type`, `data`, `limitations`), enquanto `public_tool_registry_spec.rb` valida as chaves exatas de cada tool quando não há UI ativa.
* **Decisão:** Metadados `_meta.ui` são emitidos em `tools/list` e na resposta de `tools/call` apenas quando `MCP_UI_ENABLED` e a flag da respectiva superfície estão habilitadas (`true`), fora de `structuredContent`. `content[0].text` é aprimorado com resumo legível em português mantendo `structuredContent` 100% compatível.

## ADR-007: Adaptação Spec Kit Sem Dependência de Scripts Python Ausentes

* **Contexto:** `.specify/scripts/python/{resolve_template,setup_plan}.py` e `.specify/memory/constitution.md` não existem no repositório.
* **Decisão:** Executar o ciclo Spec Kit completo criando os artefatos diretamente em `specs/018-mcp-interactive-ui/` e atualizando `.specify/feature.json`, preservando integralmente `AGENTS.md`, `docs/mcp/` e todos os workflows existentes.
