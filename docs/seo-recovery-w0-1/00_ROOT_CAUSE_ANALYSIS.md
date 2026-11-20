# SEO Recovery W0.1 — Root Cause Analysis

**Status:** correção de código preparada para revisão
**Branch:** `fix/seo-w0-1-production-acceptance`
**Escopo:** robots público, semântica HTTP de Brand Pages e gate de regressão

## Achados

| ID | Problema | Causa raiz | Evidência | Correção |
|---|---|---|---|---|
| RCA-W01 | `robots.txt` público anunciava `/sitemap.xml` | `AB0-1-front/public/robots.txt` era servido antes da Metadata Route `AB0-1-front/app/robots.ts`; as duas fontes divergiam | O conteúdo público validado continha `Sitemap: .../sitemap.xml`, enquanto `app/robots.ts:38` anunciava `sitemap-index.xml` | Remover a fonte estática conflitante e manter `app/robots.ts` como fonte única |
| RCA-W02 | Empresa inexistente retornava 200 e canonical da home | `AB0-1-front/lib/api-public.ts:401-440` passava `fallback: null`, ocultando qualquer falha; `AB0-1-front/app/companies/[id]/page.tsx:17-77` capturava toda exceção e permitia herança de metadata global | A URL de aceite retornou 200, `index, follow` e canonical da home | Tratar somente HTTP 404 como ausência; propagar 5xx/timeout; declarar `noindex, nofollow` e canonical nula para ausência |
| RCA-W02B | Mesmo após tratar 404 na API e `notFound()` na página, a resposta HTTP continuou 200 | `app/companies/loading.tsx` introduzia um `<Suspense>` ancestral que iniciava o streaming do HTML antes de `notFound()` executar; em Next.js 14.2.35, cabeçalhos já enviados mantêm status 200 | E2E de produção-equivalente: 19 testes críticos aprovados; `category-seo.spec.ts:145` recebeu 200 onde exigia 404 (CI #44641149002) | Mover skeleton de `app/companies/loading.tsx` para `(directory)/loading.tsx` junto da página de catálogo, isolando os detalhes de empresa do streaming; o 404 na Brand Page permanece com `noindex` e sem canonical da home |
| RCA-W03 | Não havia prova automatizada do HTTP final da correção | O CI executava contratos de categoria, mas não o conjunto W0 solicitado de forma obrigatória e explícita | `specs/015-seo-recovery-w0/tasks.md` deixava T010/T011/T012 pendentes | Adicionar testes Jest, contratos RSpec, E2E de `robots`/404 e job obrigatório `SEO W0 Regression Gate` |
| RCA-W04 | Apex HTTPS apresentava certificado incompatível e Rails JSON | O domínio raiz não alcançava o middleware Next.js; a camada de entrada/proxy ativo divergia de `infra/nginx/avaliasolar.com.br.redirect.conf` | A validação TLS do apex falhou por SAN/CN incompatível; com TLS ignorado, a resposta foi Rails JSON | Não alterar infraestrutura nesta PR; entregar runbook de certificado/SNI/proxy, backup, rollback e validação |

## Limitações

- A correção de TLS, DNS e Nginx Proxy Manager não é executada neste branch.
- A troca de posição de `loading.tsx` preserva o skeleton do catálogo `/companies`, mas remove o streaming automático das Brand Pages; o E2E `@critical W0.1` é responsável por validar status 404 real. Rotas especiais sob `/companies/categorias` não têm mais o skeleton ancestral e podem receber loading próprio em mudança separada, se necessário.
- A cobertura de sitemap de 100% só pode ser confirmada contra o inventário elegível do banco/API autorizado; a validação histórica observou 472 registros no feed público e 472 URLs únicas.
- A causa do 503 intermitente precisa de logs/telemetria do ambiente de produção; este branch não introduz retry ilimitado nem mascara a falha.
