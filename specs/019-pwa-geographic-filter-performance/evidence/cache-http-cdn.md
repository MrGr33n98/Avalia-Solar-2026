# Cache HTTP, proxy e CDN

## Verificado localmente

- Rails emite ETag e revisão para a taxonomia pública válida e responde 304 a pedido condicional. RSpec cobriu os casos implementados de anonimato, UF inválida, credenciais, versão, CORS e ETag por UF.
- `Cache-Control` final observado no benchmark: `max-age=86400, public, stale-while-revalidate=604800, s-maxage=86400`.
- O Route Handler Next limita o cache compartilhável a GET anônimo dos endpoints exatos de estados e cidades com query canônica. Preserva metadados apenas em respostas públicas seguras e não publica cookies, erros ou respostas autenticadas.
- O service worker usa namespace dedicado de geografia, valida resposta e cabeçalhos antes de armazenar, retém entrada por período limitado e não apaga caches fora do namespace da aplicação. Testes Jest focados passaram.
- Detalhes brutos das respostas Rails: `benchmark-local-after.json`. Cobertura automatizada: `geographyProxy.spec.ts`, `api-client-geography.spec.ts` e `geographyServiceWorker.spec.ts`.

## Não verificado

Sem acesso/configuração ao vhost de staging/produção ou Cloudflare, não foram medidos MISS/HIT/304 no edge, gzip/Brotli, regras de cache, purge seletivo, bypass de cookies no CDN, `Vary` em proxy real ou headers após Nginx. O 304 observado é uma resposta do Rails via loopback, não prova cache hit. Não se afirma zero requisições redundantes com cache válido até validação em browser e edge.
