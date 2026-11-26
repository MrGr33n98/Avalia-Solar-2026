# Spec 020 — PDR (Product/Decision Record)

Formato MADR curto. Cada decisão referencia fatos do `INVENTORY.md`.

## PDR-01 — REA fica fora do runtime e do MCP do produto

- **Contexto:** o REA tem 263 tools, 42 delas destrutivas ou open-world (F-04, F-05). Consome ~256 MB ocioso e até 654 MB em análise (F-09, F-44).
- **Decisão:** usar o REA só em dev (stdio local) e em CI efêmero sem secrets.
- **Consequências:** nenhuma mudança de superfície de ataque no produto; a evidência chega ao produto só como contrato (IDs e manifestos).
- **Alternativas rejeitadas:** proxy de tools REA via `/mcp/private` (risco e sem consumidor); serviço interno permanente (custo fixo).

## PDR-02 — Evidence ID em `_meta`, não em `data`

- **Contexto:** `outputSchema` público com `additionalProperties: false` no envelope (F-22).
- **Decisão:** `result._meta["avaliasolar/evidence"]`.
- **Consequências:** compatível com clientes atuais e sem bump do contrato `1.0.0`.

## PDR-03 — Evidence ID determinístico por conteúdo

- **Decisão:** `evidence_id = "asev_" + sha256(canonical_json({tool, contract_version, normalized_args, content_sha256, data_as_of}))`, com `request_id` separado (não entra no hash).
- **Consequências:** respostas idênticas têm o mesmo ID, o que permite deduplicar e citar. O mesmo formato de prefixo + sha256 é usado pelo REA (`ev_<sha256>`), o que facilita cruzar os dois.

## PDR-04 — Ledger em log estruturado na fase 1

- **Contexto:** a única tabela de trilha MCP é `mcp_approval_requests` (F-31); leituras públicas são de alto volume e baixo risco.
- **Decisão:** evento `mcp.evidence` em log JSON (stdout), sem PII, e sem tabela nova.
- **Revisão:** criar tabela só se surgir consulta operacional comprovada (ex.: disputa de cliente) que o agregador de logs não atenda.

## PDR-05 — Artefato de análise separado do artefato servido

- **Contexto:** RCA-1.
- **Decisão:** o build de CI gera `dist-analysis/` com sourcemap e sem minify. `dist/` continua idêntico.
- **Consequências:** o SHA do `dist/` não muda, e a análise REA passa a ser viável.

## PDR-06 — Prompts e completions somente sobre dados públicos

- **Decisão:** `completion/complete` retorna só valores de enums e catálogos públicos (categorias ativas, UFs), sem nomes de empresas na fase 2.
- **Consequências:** sem risco de enumeração de tenants e sem consulta pesada por tecla.
