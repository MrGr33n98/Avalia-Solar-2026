# Spec 020 — REQUIREMENTS

## Funcionais

| ID | Requisito | Origem |
|---|---|---|
| RF-01 | Com `MCP_EVIDENCE_META_ENABLED=true`, toda resposta `tools/call` bem-sucedida do `/mcp` e do `/mcp/private` inclui `_meta["avaliasolar/evidence"]` conforme `EVIDENCE_CONTRACTS.md`. | G-01 |
| RF-02 | Respostas de erro incluem `request_id`, mas **não** `content_sha256`. | G-01 |
| RF-03 | Com `MCP_EVIDENCE_LOG_ENABLED=true`, cada `tools/call` emite um evento `mcp.evidence` com os campos listados em `EVIDENCE_CONTRACTS.md` §3. | G-12, G-13 |
| RF-04 | Com `MCP_PROMPTS_ENABLED=true`, o servidor declara a capability `prompts` e implementa `prompts/list` e `prompts/get` para os prompts de `MCP_TOOL_CATALOG.md` §3. | G-02 |
| RF-05 | Com `MCP_COMPLETIONS_ENABLED=true`, o servidor declara `completions` e responde `completion/complete` para os argumentos `category_slug` e `state` de prompts e tools públicos. | G-02 |
| RF-06 | O build `packages/mcp-ui` aceita `--analysis` e gera `dist-analysis/` com sourcemap e sem minify, sem alterar `dist/`. | G-04 |
| RF-07 | O job `evidence-lab` produz um bundle com: resultado de `inspect-api-contract`, `analyze-javascript-application` por widget, screenshots por superfície e tema, e o `manifest.json`. | G-03, G-04, G-07 |
| RF-08 | O job compara o bundle atual com o da última execução em `main` e publica um resumo em markdown no job summary. | G-07 |
| RF-09 | `AB0-1-back/swagger/v1/swagger.json` é JSON válido e equivalente ao `.yaml`. | G-03 |
| RF-10 | `ui://avalia-solar/profile/v2.html` tem um arquivo próprio no manifest, ou a decisão de reuso fica documentada. | G-06 |

## Não funcionais

| ID | Requisito |
|---|---|
| RNF-01 | Overhead p95 de `tools/call` com evidência ligada ≤ 2 ms; alocação extra ≤ 64 KB por chamada. |
| RNF-02 | `evidence_id` é determinístico: mesma entrada e mesmo conteúdo produzem o mesmo ID em 100% dos casos do teste de propriedade. |
| RNF-03 | O evento de log não contém PII (e-mail, telefone, token, IP completo, `agent_id` bruto); identificadores sensíveis vão como digest. |
| RNF-04 | Labels Prometheus não ganham `evidence_id` nem `request_id` (cardinalidade). |
| RNF-05 | O job `evidence-lab` não tem secrets nem `environment`, usa `permissions: contents: read` e só acessa `127.0.0.1`. |
| RNF-06 | Versão do REA fixada (`6.10.1`); upgrade só por PR. |
| RNF-07 | Job `evidence-lab` ≤ 12 min de wall time e RSS de pico ≤ 2 GB. |
| RNF-08 | Todas as flags novas são OFF por padrão em produção. |
| RNF-09 | Compatibilidade: as suites existentes do contrato MCP (`mcp-remote-contract-gate`, `mcp-c4-sdk-interop-staging`) passam sem alteração de expectativa. |
