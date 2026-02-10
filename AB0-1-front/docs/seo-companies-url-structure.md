# SEO: URL amigavel para filtros de categorias em Empresas

## Objetivo
Substituir URLs antigas com query string (`/companies?category_ids=73,76`) por URLs semanticas para indexacao:

- Novo formato: `/companies/categorias/energia-solar--73/mobilidade-eletrica--76`
- Segmentos com palavras-chave + sufixo de ID para canonicalizacao estavel

## O que foi implementado

1. Canonicalizacao de URL por categoria:
- `middleware.ts` intercepta `/companies?category_ids=...` e aplica redirect `301` para URL amigavel com slug+id.
- `app/companies/page.tsx` mantem redirecionamento permanente como fallback de seguranca.
- `app/companies/categorias/[...categorySlugs]/page.tsx` resolve IDs por slug/ID, corrige variações e redireciona para canonical.

2. Metadata SEO:
- `title`, `description`, `keywords` e `canonical` dinamicos para listagem de empresas por categoria.
- Open Graph e Twitter atualizados com URL canonica.

3. Estrutura de dados (schema.org):
- `app/companies/CompaniesPageClient.tsx` publica JSON-LD `CollectionPage` + `ItemList` com itens `LocalBusiness`.

4. Sitemap para Search Console:
- `app/sitemap.ts` agora inclui URLs `/companies/categorias/<slug--id>` para categorias com empresas.

5. Compatibilidade de filtros:
- `components/filters/query.ts` passou a ler categorias vindas do caminho.
- `components/filters/FilterSidebar.tsx` e `app/companies/CompaniesPageClient.tsx` mantem navegacao consistente entre URL amigavel e filtros.

## Notas de rastreabilidade
- O sufixo `--<id>` evita ambiguidades de slug e preserva estabilidade da URL canonica.
- Parametros nao relacionados (ex.: `page`, `state`, `city`) sao preservados no redirecionamento.
- O parametro legado `category_ids` e removido da URL canonica.

## Validação recomendada
1. Acessar `/companies?category_ids=73,76` e confirmar redirecionamento permanente para `/companies/categorias/...`.
2. Verificar `<link rel="canonical">` na pagina final.
3. Confirmar no Search Console que a URL canonica indexada e a rota amigavel.
4. Validar JSON-LD no Rich Results Test.
