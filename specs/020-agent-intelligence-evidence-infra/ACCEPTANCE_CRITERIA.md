# Spec 020 — ACCEPTANCE CRITERIA

Cada critério é mensurável e tem método de prova. "Feito" exige evidência anexada em `specs/020-…/evidence/`.

| ID | Critério | Medida | Prova |
|---|---|---|---|
| AC-00 | REA disponível como MCP no Claude Code local | `rea doctor` sem `config_drift` em `registration:claude_code` e `skill:identity`; tools `mcp__rea__*` visíveis numa sessão nova | saída do doctor |
| AC-01 | `_meta["avaliasolar/evidence"]` presente | 100% das respostas `tools/call` OK nas 5 tools públicas + 1 privada com a flag ON; 0% com a flag OFF | request specs |
| AC-02 | Determinismo | 1.000/1.000 payloads com o mesmo `evidence_id` em duas execuções; payloads diferentes → IDs diferentes | teste de propriedade |
| AC-03 | Compatibilidade | `mcp-remote-contract-gate` e specs MCP existentes passam **sem alterar expectativas**; `outputSchema` inalterado (diff vazio) | CI |
| AC-04 | Ledger | 1 evento `mcp.evidence` por `tools/call`; campos ⊆ allowlist; `ui_manifest_sha256` igual ao `manifest.json` do container | request spec + log capturado |
| AC-05 | Sem PII | teste falha se o evento contiver chave fora da allowlist ou valor que case com o regex de e-mail, telefone ou JWT | spec |
| AC-06 | Build de análise | `dist/` com SHA idêntico com e sem `--analysis`; `dist-analysis/` contém `.map` por widget | script de CI |
| AC-06b | Análise viável | REA em `dist-analysis/search`: exit 0, ≤ 90 s, `parsed_javascript_files ≥ 1`, semântica ≠ `not-examined` | timing + summary |
| AC-07 | Bundle de evidência | artifact com `index.json`; todo item com `evidence_id` e `sha256`; tamanho ≤ 5 MB | artifact |
| AC-08 | Overhead | p95 ≤ 2 ms e alocação ≤ 64 KB por chamada (payload de 20 itens) | benchmark |
| AC-09 | OpenAPI | `swagger.json` válido (`rea inspect-api-contract` exit 0) e com operações = `.yaml` | job evidence-lab |
| AC-10 | Profile v2 | arquivo próprio no manifest **ou** ADR mergeado | PR |
| AC-11 | Isolamento do CI | o workflow não referencia `secrets.*` nem `environment:`; `permissions: contents: read`; nenhum host além de `127.0.0.1` nos comandos REA | revisão + grep no CI |
| AC-12 | REA não exposto | interseção dos nomes `tools/list` (público e privado) com `rea-mcp-tools.json` = ∅ | spec |
| AC-13 | Prompts | com a flag ON, `prompts/list` retorna 3 prompts públicos; `prompts/get` gera mensagens que só citam tools existentes; com a flag OFF, a capability fica ausente | request spec |
| AC-14 | Completion | `category_slug` retorna só categorias ativas; `state` só UFs; p95 ≤ 20 ms; nenhum nome de empresa | spec + benchmark |
| AC-15 | Interop | SDK python e ts listam e obtêm prompts e completam argumentos em staging | workflow C4 |
| AC-16 | Lab | 20 capturas (5 superfícies × 2 temas × 2 viewports), nenhuma em skeleton, com Evidence ID | artifact |
| AC-17 | Diff de release | `diff.md` com Δ bytes e gzip, Δ SHA e status de screenshot por cenário, publicado no job summary | PR de teste |
| AC-18 | Spec 019 | T007, T042 e T043 da 019 com screenshot e Evidence ID em `specs/019-…/evidence/` | arquivos |
