# Métricas Before & After — /companies Performance A+++

## BEFORE (Medições Reais de Produção — 2026-09-25)

Medições capturadas via requisições HTTP diretas contra `https://www.avaliasolar.com.br` e `https://api.avaliasolar.com.br`:

| Métrica / Endpoint | HTTP | TTFB (s) | Duração Total (s) | Tamanho Transferido | Observações |
|---|---|---|---|---|---|
| `GET /companies` (HTML Doc) | 200 | 0.915s | 1.285s | 101,676 B (~101.7 KB) | SSR dinâmico em tempo de execução |
| `GET /companies` (RSC Payload `_rsc`) | 200 | 2.646s | 2.811s | 27,282 B (~27.3 KB) | **Trava o clique do usuário por 2.8s** (sem `loading.tsx`) |
| `GET /api/v1/companies?status=active&page=1&per_page=12&fields=card` | 200 | 1.288s | 1.646s | 116,551 B (~116.5 KB) | Payload inflado para apenas 12 cards |
| `GET /api/v1/companies/states` | 200 | 0.597s | 0.597s | 147 B | Desnecessário (estático no client) |
| `GET /api/v1/categories/tree` | 200 | 1.133s | 1.133s | 9,790 B (~9.8 KB) | Concorrente no mount |
| `GET /api/v1/categories?status=active` | 200 | 0.865s | 1.059s | 86,389 B (~86.4 KB) | Duplicado via `MobileCompanyFiltersSheet` fechado |

### Resumo do Waterfall Antes:
1. Clique em "Empresas": **2.81s** travado sem mudar de tela.
2. Tela muda, cliente monta e dispara 6 requisições simultâneas.
3. API de empresas demora mais **1.65s** e transfere 116.5 KB.
4. **Tempo total até ver os cards:** **~4.45s**.

---

## AFTER (A ser medido após as implementações)

| Métrica / Endpoint | Antes (Real) | Depois (Real) | Delta | Método de Medição |
|---|---|---|---|---|
| Transição Visual no Clique | 2.811s | PENDENTE | PENDENTE | Performance Observer / Mark |
| RSC Payload TTFB | 2.646s | PENDENTE | PENDENTE | cURL HTTP timing |
| `GET /api/v1/companies` (card) Duração | 1.646s | PENDENTE | PENDENTE | cURL HTTP timing |
| `GET /api/v1/companies` (card) Tamanho | 116,551 B | PENDENTE | PENDENTE | Content-Length real |
| Requisições Iniciais no Mount | 6 | PENDENTE | PENDENTE | Network Inspect |
| Custo Leaflet no Grid Inicial | Presente | PENDENTE | PENDENTE | Bundle Analyzer / Network |
