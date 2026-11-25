# Benchmark local após implementação

Execução real contra Rails em container de teste Compose isolado, loopback, estado `SC`, 5 aquecimentos e 30 amostras por caso. O script está em `evidence/benchmark-local.mjs`; os dados brutos estão em `evidence/benchmark-local-after.json`.

| Caso | Respostas | TTFB p50 | TTFB p95 | Máximo | Rails runtime p95 | Corpo |
|---|---:|---:|---:|---:|---:|---:|
| GET anônimo | 30 × 200 | 39,53 ms | 78,20 ms | 83,23 ms | 65,68 ms | 4.241 bytes |
| GET condicional | 30 × 304 | 35,88 ms | 95,60 ms | 104,02 ms | 78,77 ms | 0 bytes |

Cache-Control observado: `max-age=86400, public, stale-while-revalidate=604800, s-maxage=86400`. Revisão de catálogo: `0317f2bc443cac6b2dd697dfe7fa3e97cf1bd6821ffb19278738d7eb49e63bc8`.

## Interpretação e limites

- Esta medição é **after local**; não havia baseline comparável antes do refactor. O arquivo `benchmark-local-intermediate-before-header-fix.json` é uma medição intermediária após implementação, anterior ao reparo da diretiva vazia de Cache-Control; não é baseline do produto.
- O p95 local de GET condicional excedeu 100 ms; o alvo de 150 ms é TTFB aquecido para a aplicação em ambiente de referência, que não foi medido aqui. O orçamento de cache hit ≤5 ms se refere a hit de cache de cliente e não foi medido por este benchmark HTTP.
- Não se mediu atualização visual quente, LCP, INP, CLS, bundle gzip, tráfego CDN, browser cache hit, cold start real após readiness ou carga concorrente.
- Loopback e container local não predizem latência pública, Cloudflare, SSR de produção ou capacidade de worker.
- A sequência intermediate→after é útil para encontrar e corrigir uma diretiva HTTP vazia, mas não prova ganho before/after do refactor.
