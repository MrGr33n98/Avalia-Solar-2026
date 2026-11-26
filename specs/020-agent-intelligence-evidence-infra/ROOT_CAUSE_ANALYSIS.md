# Spec 020 — ROOT CAUSE ANALYSIS

Método: 5 porquês curtos, ancorados em fatos do `INVENTORY.md`. Cada hipótese não comprovada está marcada **[hipótese]**.

## RCA-1 — Bundles MCP UI resistem à análise estática (G-04)

1. **Sintoma:** REA não parseia nenhum script (F-43, F-44, F-45).
2. **Por quê?** Os HTMLs carregam o JS inline, e o `analyze-javascript-application` trata HTML como texto inerte.
3. **Por quê, depois de extrair?** Cada fonte tem ~420 KB minificados em uma linha; o analisador semântico estoura 30 s (web) e 300 s (aplicação) por fonte, com RSS de até 654 MB.
4. **Por quê minificado em fonte única?** `vite-plugin-singlefile` + `minify: 'esbuild'` + `sourcemap: false` (F-40). A escolha atende o requisito MCP Apps de um recurso HTML autocontido.
5. **Causa raiz:** o pipeline de build produz **só** o artefato de distribuição. Não gera um artefato de análise (não-minificado ou com sourcemap) para auditoria.

**Contra-evidência testada:** um timeout maior resolveria? Com `--analysis-timeout-ms 900000` em uma única fonte (F-44b), o parse sintático concluiu em 4 min 47 s com 748 MB, mas a semântica ficou `not-examined` e houve **0 findings**. Aumentar o timeout **não** resolve, e ~5 min × 5 widgets por release é caro demais para CI (ver `PERFORMANCE_BUDGET.md`).

**Correção mínima:** emitir `dist-analysis/` (sem minify, com sourcemap) apenas no job de CI. O artefato servido não muda.

## RCA-2 — Contrato OpenAPI inutilizável (G-03)

1. **Sintoma:** `swagger.json` inválido como JSON (F-50).
2. **Por quê?** O arquivo contém YAML.
3. **Por quê?** [hipótese] Foi gerado com `rswag:specs:swaggerize` usando `swagger_format: :yaml` e o nome do arquivo ficou `.json`, ou foi copiado à mão. O commit de 2026-11-18 não foi inspecionado em detalhe.
4. **Por quê só 3 operações?** A cobertura rswag é mínima; nenhum gate exige contrato atualizado.
5. **Causa raiz:** não existe **gate de validade e cobertura de contrato** no CI.

## RCA-3 — Respostas MCP sem identidade verificável (G-01, G-12, G-13)

1. **Sintoma:** o envelope público tem `data_as_of`, `source_type` e `limitations`, mas não tem ID nem digest (F-22).
2. **Por quê?** O contrato 1.0.0 foi desenhado para honestidade de proveniência (fonte e limitações), não para rastreabilidade (identidade e integridade).
3. **Por quê não reaproveitou o approvals?** `mcp_approval_requests` já tem `payload_digest` e `request_uuid` (F-31), mas cobre só a mutação com HITL.
4. **Causa raiz:** falta um **contrato de evidência transversal** (leitura e escrita) desacoplado do schema de dados.

## RCA-4 — Spec 019 sem prova visual (G-10)

1. **Sintoma:** T007, T042 e T043 BLOCKED; "Playwright não abriu `/companies`" (F-60).
2. **Por quê?** Compilação ou timeout da rota no dev server (registro da 019).
3. **Por quê?** [hipótese] Foi usado o dev server (compilação on-demand do Next) em vez do build de produção (`next build && next start`), e a primeira compilação de `/companies` passou do timeout padrão do Playwright.
4. **Causa raiz provável:** o ambiente de evidência de browser não está padronizado. Cada spec tenta do zero.
5. **Ação:** o lab da Spec 020 (`UI_SDK_QUALITY_LAB.md`) define um **ambiente único de evidência**: build de produção, loopback, fixtures sem dados de cliente e captura REA ou Playwright.

## RCA-5 — REA indisponível como MCP no agente local (G-14)

1. **Sintoma:** nenhuma tool `mcp__rea__*` (F-02).
2. **Por quê?** O `rea setup` registrou só o Antigravity, e o `rea doctor` marca o Claude Code como `config_drift`.
3. **Por quê do drift da skill?** Symlink criado nesta sessão para expor skills (F-08); o REA exige ser dono do diretório.
4. **Causa raiz:** conflito entre duas estratégias de distribuição de skills (symlink manual × instalação gerenciada pelo REA).
5. **Ação:** remover o symlink da skill e rodar `rea setup` marcando o Claude Code (T-000).
