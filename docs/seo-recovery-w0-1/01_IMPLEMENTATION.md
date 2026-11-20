# SEO Recovery W0.1 — Implementação

## Mudanças de código

1. `AB0-1-front/lib/api-public.ts`
   - `getById` e `getBySlug` não usam mais `fallback: null` no transporte.
   - HTTP 404 confirmado é convertido em ausência pública.
   - HTTP 5xx, erro de rede e timeout são propagados como `ApiError`.
2. `AB0-1-front/app/companies/[id]/page.tsx`
   - `generateMetadata` não captura exceções de upstream.
   - Empresa inexistente recebe `noindex, nofollow` e `alternates.canonical = null`.
   - Empresa existente mantém canonical própria, SSR, ISR, JSON-LD, reviews e CTAs.
3. `AB0-1-front/public/robots.txt`
   - Removido para evitar a segunda fonte de verdade.
   - `AB0-1-front/app/robots.ts` permanece responsável por `/robots.txt` e anuncia somente `/sitemap-index.xml`.
4. Testes
   - Novo contrato Jest para 404, 503 e timeout da API pública.
   - E2E crítico para `robots.txt` e soft 404 de Brand Page.
5. CI
   - Novo job obrigatório `SEO W0 Regression Gate`.
   - Gate executa os contratos Jest e RSpec específicos.
   - Gate de release passa a exigir o resultado do job W0.

## Preservado

- Layout e componentes visuais da Brand Page.
- Reviews, produtos, CTAs, JSON-LD e redirects de slug canônico.
- Banco, migrations, DNS, certificados, proxy e deploy de produção.
- Arquivos não relacionados já presentes no working tree.
