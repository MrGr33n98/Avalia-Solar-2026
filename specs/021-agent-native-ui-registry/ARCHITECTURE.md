# Arquitetura incremental
```text
Rails MCP (public/private, políticas, Zod espelhado por JSON Schema)
  → structuredContent v1 + content textual + _meta.ui
  → ui://... allowlist → HTML estático singlefile
  → HostProvider (ext-apps + fallback window.openai)
  → widget controller → blocks → primitives → tokens host-first
  → user actions → host bridge → tool allowlisted → backend autorizado

Registry source (dev/CI) → JSON shadcn → playground (isolado)
  → agentes de engenharia → código revisado → build do pacote existente
```

## Árvore alvo (introduzir apenas quando houver consumidores reais)
- packages/design-tokens/ (CSS/JSON exportáveis; sem build runtime novo)
- packages/mcp-ui/src/design/ (compatibilidade e reexports)
- packages/mcp-ui/src/components/ (presentational)
- packages/mcp-ui/src/blocks/ (composição)
- packages/mcp-ui/src/widgets/ (orquestração e schemas atuais)
- packages/ui-registry/ (registry.json, scripts, docs, examples, generated/r ignorado)
- packages/mcp-ui/tests/ (unit, e2e, fixtures)
- specs/021-agent-native-ui-registry/evidence/ (somente derivados seguros)

A dependência aponta para tokens/primitives, nunca para widget controller; bloco não chama fetch direto nem conhece Rails. Host adapter encapsula callTool, link, display mode e follow-up. Não criar pacote npm público nem subdomínio no MVP. Se compartilhamento com AB0-1-front exigir diferenças de build, exportar apenas tokens/contratos inicialmente. Registry não é fonte de dados empresariais.
