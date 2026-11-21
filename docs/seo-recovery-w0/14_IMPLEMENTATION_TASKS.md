# Tasks de implementação

Consulte `specs/015-seo-recovery-w0/tasks.md`.

## Estado verificável

| Tarefa                  | Estado                   | Evidência |
| ----------------------- | ------------------------ | --------- |
| T001–T009               | Concluídas               | Código e testes presentes no SHA de baseline `cbbb7597a892e60d3e746f8b3185faeabf1135b7`. |
| T010 Jest               | Concluída                | CI PR [run 44826111845](https://github.com/MrGr33n98/Avalia-Solar-2026/actions/runs/44826111845) e CI pós-merge [run 44829252776](https://github.com/MrGr33n98/Avalia-Solar-2026/actions/runs/44829252776), ambos aprovados; contratos SEO/Jest passaram. |
| T011 RSpec              | Concluída                | CI PR [run 44826111845](https://github.com/MrGr33n98/Avalia-Solar-2026/actions/runs/44826111845) e CI pós-merge [run 44829252776](https://github.com/MrGr33n98/Avalia-Solar-2026/actions/runs/44829252776), com RSpec e gates de backend aprovados. |
| T012 Build/XML/HTTP/GSC | Parcial                  | PR #210 foi mesclada em `bc79842d45ddfb71dd4e777de6a7dc6dc95c4213`; CD backend [44831814482](https://github.com/MrGr33n98/Avalia-Solar-2026/actions/runs/44831814482) e frontend [44831814580](https://github.com/MrGr33n98/Avalia-Solar-2026/actions/runs/44831814580) passaram. Auditoria pós-deploy confirmou XML, URLs, performance e 404/noindex, mas apex TLS falhou e GSC não foi coletado. |

## Alterações desta execução

- O sitemap local passou de 54 chamadas ao endpoint completo para um exportador agregado, cacheado por 15 minutos, com `duration_ms` e `cache_hit` no contrato/log.
- O CD usa `www` como fallback de `NEXT_PUBLIC_BETTER_AUTH_URL` e aplica o vhost apex com redirect 308 somente quando há certificado no host.
- O workflow `SEO — Post-deploy Production Audit` audita TLS, redirect 308, robots, índice/seções XML, canonical, 404/noindex, integridade e amostras de tempo, anexando JSON e Markdown.
- Release pública confirmada pelo header `x-release: bc79842d45ddfb71dd4e777de6a7dc6dc95c4213`.

## Evidência pós-deploy

Artifact das auditorias [44833335108](https://github.com/MrGr33n98/Avalia-Solar-2026/actions/runs/44833335108) e [44833290619](https://github.com/MrGr33n98/Avalia-Solar-2026/actions/runs/44833290619):

- 672 URLs de sitemap, sem duplicatas e sem hosts inválidos.
- 10 seções XML válidas em HTTP 200.
- Sitemap local: cold observado `42,38 ms`, warm p95 `157,22 ms`, 45 URLs.
- Empresa inexistente: HTTP 404 com `noindex`.
- Homepage, canonical e robots: aprovados.
- GSC: `not_collected`, sem sessão autenticada no runner.

## Bloqueios que mantêm T012 pendente

1. `https://avaliasolar.com.br/` ainda falha a validação TLS por incompatibilidade de hostname; o certificado apresentado não inclui `avaliasolar.com.br`. A auditoria falhou exclusivamente neste contrato.
2. O deploy registrou que o vhost apex foi instalado, mas a existência do arquivo em `/etc/letsencrypt/live/avaliasolar.com.br/` não comprova SAN válido. É necessário emitir/instalar certificado que inclua o apex e recarregar o Nginx.
3. Não há sessão autenticada do Google Search Console disponível para medir indexação, exclusões, impressões, cliques, CTR, posição ou cobertura em 7/28 dias.
