# Spec 020 — PERFORMANCE BUDGET

## 1. Medido nesta auditoria (máquina de dev, Ubuntu 24.04, Node 22.23.5)

| Operação REA | Wall | RSS pico | Resultado | Fonte |
|---|---|---|---|---|
| `analyze-javascript-application` (6 HTML, 2,18 MB) | 15 s | 188 MB | 0 JS parseados | F-43 |
| `analyze-javascript-application` (5 JS extraídos) | 5 min 25 s | 654 MB | timeout de 300 s por fonte | F-44 |
| `analyze-javascript-application` (só `search.v1.js`, timeout de 900 s) | 4 min 47 s | 748 MB | sintaxe OK, semântica não examinada, 0 findings | F-44b |
| `analyze-web-bundle` (1 página, 1 script) | 47 s | 194 MB | deadline de 30 s por script | F-45 |
| `capture-web-screenshot` (×4) | < 5 s cada (não cronometrado individualmente) | — | OK | F-48 |
| `inspect-api-contract` (3,5 KB) | 223 ms (`command_ms`, execução inválida); válida não cronometrada | — | OK | F-51 |
| `rea mcp` ocioso (Antigravity) | — | ~256 MB | — | F-09 |

**Limitações:** amostra única; máquina de dev, não runner do GitHub (2 vCPU / 7 GB no `ubuntu-24.04` padrão, conforme a documentação do GitHub, não medido aqui).

## 2. Orçamento por plano

### Produto (runtime)

| Item | Orçamento | Como garantir |
|---|---|---|
| `content_sha256` + `evidence_id` | p95 ≤ 2 ms por `tools/call` | payload ≤ `MAX_LIMIT 20` itens (F-21); benchmark RSpec com `Benchmark.realtime` × 1.000 |
| Alocação | ≤ 64 KB por chamada | serializar uma vez e reusar a string canônica para o hash |
| Log `mcp.evidence` | 1 linha ≤ 1 KB | campos fechados |
| `completion/complete` | p95 ≤ 20 ms | categorias em `Rails.cache` com TTL de 1 h; UFs constantes |
| CPU/memória do container | Δ ≤ 1% / ≤ 5 MB | sem dependência nova |
| Custo de infraestrutura | **R$ 0** | sem serviço novo; log já existente |

### CI (`evidence-lab`)

| Item | Orçamento |
|---|---|
| Wall time total | ≤ 12 min |
| RSS pico | ≤ 2 GB (um comando REA por vez) |
| `analyze-javascript-application` por widget (em `dist-analysis/`) | ≤ 90 s, com `--analysis-timeout-ms 120000` |
| `analyze-web-bundle` | `--analysis-timeout-ms 60000`, `--total-analysis-timeout-ms 300000` |
| Execuções | só PRs com paths filtrados + `workflow_dispatch` |
| Custo estimado | ~10 min × PRs elegíveis. Em repositório privado, consome minutos do plano (valor não verificado nesta auditoria) |
| Artifact | ≤ 5 MB por execução; retenção de 30 dias |

### Dev (bancada)

- O MCP REA ocioso custa ~256 MB. Recomendação: registro **stdio sob demanda** (o cliente sobe o processo), não um processo persistente.

## 3. Bundles MCP UI (referência para regressão)

| Widget | raw | gzip | Orçamento gzip (alerta) |
|---|---|---|---|
| search | 442.997 | 122.259 | 128.000 |
| profile | 440.599 | 121.610 | 128.000 |
| reputation | 424.871 | 117.666 | 124.000 |
| compare | 426.604 | 118.198 | 124.000 |
| categories | 444.978 | 122.680 | 128.000 |

Orçamento inicial = valor atual + ~5%. O alerta vai no `diff.md`; não bloqueia na fase 3.

## 4. Spec 019 (referência, sem nova medição)

GET catálogo de cidades local: TTFB p95 78,20 ms (200) e 95,60 ms (304) (F-61). LCP, INP, CLS e CDN continuam **não medidos**. O lab (§5 do Quality Lab) é o caminho para medir.
