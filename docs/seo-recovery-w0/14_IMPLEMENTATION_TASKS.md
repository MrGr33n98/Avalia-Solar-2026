# Tasks de implementação

Consulte `specs/015-seo-recovery-w0/tasks.md`.

## Estado verificável

| Tarefa                  | Estado                   | Evidência                                                                                                                                                                                                                                         |
| ----------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T001–T009               | Concluídas               | Código e testes presentes no SHA de baseline `cbbb7597a892e60d3e746f8b3185faeabf1135b7`.                                                                                                                                                          |
| T010 Jest               | Concluída no baseline CI | [CI run 44811135815](https://github.com/MrGr33n98/Avalia-Solar-2026/actions/runs/44811135815): gates Jest W0 passaram (`3 passed` e `17 passed`). A execução local desta branch continua bloqueada pelo patch automático do lockfile SWC do Next. |
| T011 RSpec              | Concluída no baseline CI | [CI run 44811135815](https://github.com/MrGr33n98/Avalia-Solar-2026/actions/runs/44811135815): `17 examples, 0 failures`. A suíte focada local não iniciou por gems ausentes no container local, sem acesso a banco de produção.                  |
| T012 Build/XML/HTTP/GSC | Parcial                  | Build frontend e contratos CI passaram no baseline; auditor público encontrou apex TLS inválido e sitemap local acima das metas. GSC não foi consultado por falta de sessão autenticada. O novo workflow gera JSON/Markdown pós-deploy.           |

## Alterações desta execução

- O sitemap local passou de 54 chamadas ao endpoint completo para um exportador agregado, cacheado por 15 minutos, com `duration_ms` e `cache_hit` no contrato/log.
- O CD agora usa `www` como fallback de `NEXT_PUBLIC_BETTER_AUTH_URL` e instala o vhost apex somente quando o certificado do apex existe.
- O workflow `SEO — Post-deploy Production Audit` audita TLS, redirect 308, robots, índice/seções XML, canonical, 404/noindex, integridade e amostras de tempo, anexando JSON e Markdown.

## Bloqueios que mantêm T012 pendente

1. O endpoint público `https://avaliasolar.com.br/` falha na validação TLS porque o certificado apresentado é de `api.avaliasolar.com.br`; não foi aplicado ajuste externo sem acesso ao Nginx/DigitalOcean.
2. A amostragem pública de 10 requisições do sitemap local observou cold de `10929.76 ms` e p95 warm de `5548.25 ms`; a meta só poderá ser reavaliada após publicação do backend desta branch.
3. Não há sessão autenticada do Google Search Console disponível para medir indexação, exclusões, impressões, cliques, CTR, posição ou cobertura em 7/28 dias.
