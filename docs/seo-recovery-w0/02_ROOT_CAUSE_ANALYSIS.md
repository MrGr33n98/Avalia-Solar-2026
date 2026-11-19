# Root Cause Analysis

| RCA | Evidência | Causa raiz | Estado |
|---|---|---|---|
| RCA-01 | `sitemap-builders.ts:480-510` | Uma única página de empresas | Corrigido |
| RCA-02 | `sitemap-builders.ts:147-178` | Erros convertidos em `[]` | Corrigido |
| RCA-03 | `robots.ts:38` | Índice e sitemap legado anunciados juntos | Corrigido |
| RCA-04 | `local-page-quality.ts:65-75` | Mínimo frontend 3 contra política Rails de 2 com verificação | Corrigido |
| RCA-05 | `company.rb:713-729` | `strip` não remove controle interno | Corrigido para novos writes |
| RCA-15 | `sitemaps_controller.rb:33-50` | Rescues Rails respondiam 200 vazio | Corrigido |

Dados históricos, GSC e contaminação já persistida não foram confirmados nesta execução.
