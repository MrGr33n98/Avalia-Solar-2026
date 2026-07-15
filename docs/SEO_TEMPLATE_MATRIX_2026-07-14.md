# Matriz oficial de templates SEO, GEO e AEO

Data: 2026-07-14  
Dominio canonico: `https://www.avaliasolar.com.br`  
Objetivo: definir o contrato minimo de cada template publico antes de escalar programmatic SEO.

## Regra global

Toda rota publica precisa ter exatamente uma decisao operacional:

- `indexable`: pagina principal, self-canonical, deve aparecer no sitemap.
- `noindex, follow`: pagina utilitaria, filtro, etapa de fluxo ou pagina sem massa critica.
- `301`: URL antiga com equivalente real.
- `404/410`: recurso inexistente ou removido sem substituto.

Canonical para home nao deve ser usado como descarte de URL ruim.

## Matriz por template

| Template | Rotas | Indexabilidade | Canonical | Schemas minimos | Cache alvo | Sitemap |
| --- | --- | --- | --- | --- | --- | --- |
| Home | `/` | indexable | self-canonical absoluto | `Organization`, `WebSite`, `WebPage`, `BreadcrumbList` | publico/ISR/CDN | sim |
| Categorias hub | `/categories` | indexable se tiver conteudo unico; senao noindex/follow | self-canonical absoluto | `CollectionPage`, `ItemList`, `BreadcrumbList` | publico/ISR/CDN | sim se indexable |
| Categoria | `/categories/[slug]` | indexable para slug canonico ativo | self-canonical absoluto | `CollectionPage`, `ItemList`, `BreadcrumbList` | publico/ISR/CDN | sim |
| Categoria legada | `/categories/{slug-antigo}` | redirect | 301 para slug novo | nenhum | redirect | nao |
| Empresas hub | `/companies` | indexable se tiver conteudo/filtros basicos renderizados | self-canonical absoluto | `CollectionPage`, `ItemList`, `BreadcrumbList` | publico/ISR/CDN | sim |
| Empresa | `/companies/[slug-ou-id]` | indexable para empresa ativa canonica | URL canonica com slug/id resolvido | `LocalBusiness`, `AggregateRating` condicional, `Review` condicional, `BreadcrumbList` | publico/ISR/CDN | sim |
| Review de empresa | `/companies/[id]/review` | noindex/follow | preferir empresa canonica quando refatorado para server metadata | nenhum ou `WebPage` utilitario | privado/sem sitemap | nao |
| Claim de empresa | `/companies/[id]/claim` | noindex/follow | propria ou empresa canonica, nunca home | nenhum ou `WebPage` utilitario | privado/sem sitemap | nao |
| Pagina local estado | `/companies/[vertical]/[state]` | indexable se atingir quality gate | self-canonical absoluto sem query | `CollectionPage`, `ItemList`, `BreadcrumbList` | publico/ISR/CDN | sim se quality gate |
| Pagina local cidade | `/companies/[vertical]/[state]/[city]` | indexable se atingir quality gate | self-canonical absoluto sem query | `CollectionPage`, `ItemList`, `BreadcrumbList` | publico/ISR/CDN | sim se quality gate |
| Filtros locais | qualquer local com `?category_ids`, `?project_types`, `?rating`, `?verified`, `?q`, `?sort`, `?page`, `?min_rating`, `?featured` | noindex/follow | pagina local base sem query | nenhum extra | pode ser dinamico, sem sitemap | nao |
| Busca | `/search` | noindex/follow por padrao | propria absoluta ou pagina de busca limpa | `WebPage` | dinamico | nao |
| Comparador | `/compare` | indexable se landing publica, noindex se estado de comparacao dinamico | self-canonical absoluto para landing limpa | `WebPage`, `ItemList` quando houver lista visivel | publico para landing | sim se indexable |
| Blog hub | `/blog` | indexable | self-canonical absoluto | `Blog`, `CollectionPage`, `BreadcrumbList` | publico/ISR/CDN | sim |
| Blog post | `/blog/[slug]` | indexable para post publicado | self-canonical absoluto | `BlogPosting`, `BreadcrumbList` | publico/ISR/CDN | sim |
| Help hub | `/help` | indexable se conteudo proprio | self-canonical absoluto | `WebPage`; `FAQPage` apenas se perguntas/respostas forem visiveis e estrategicas | publico/ISR/CDN | sim se indexable |
| Diagnostico/orcamento | `/diagnostico-solar`, `/orcamento` ou equivalente | decidir por estrategia; landing pode ser indexable, etapas devem ser noindex | self-canonical da landing limpa | `WebPage`; nao usar `HowTo` como aposta principal | publico para landing | sim se landing indexable |
| Login/register/dashboard/admin | `/login`, `/register`, `/dashboard`, `/admin` | noindex ou bloqueado quando privado | propria ou nenhuma conforme auth | nenhum SEO | privado | nao |

## Quality gate para paginas locais indexaveis

Uma pagina local so deve ser indexavel quando cumprir todos os requisitos abaixo:

- tem pelo menos 3 empresas relevantes ou conteudo proprietario suficiente para evitar thin content
- possui H1 local unico
- possui title e meta description locais unicos
- possui conteudo visivel sobre cidade/estado/categoria
- possui lista ou explicacao clara do que o usuario encontra ali
- possui `BreadcrumbList`
- possui canonical absoluto sem query string
- nao depende de filtro profundo para ter valor

Se falhar qualquer item, usar `noindex, follow` ou nao gerar a URL no sitemap.

## Contrato de parametros

| Parametro | Indexabilidade | Canonical | Sitemap |
| --- | --- | --- | --- |
| `category_ids` | noindex/follow | pagina base sem query | nao |
| `project_types` | noindex/follow | pagina base sem query | nao |
| `rating` | noindex/follow | pagina base sem query | nao |
| `min_rating` | noindex/follow | pagina base sem query | nao |
| `verified` | noindex/follow | pagina base sem query | nao |
| `featured` | noindex/follow | pagina base sem query | nao |
| `q` | noindex/follow | pagina base sem query | nao |
| `sort` | noindex/follow | pagina base sem query | nao |
| `page` | noindex/follow por padrao | primeira pagina/base | nao |
| `distance`, `radius`, `lat`, `lng` | noindex/follow | pagina base sem query | nao |

## Definition of Done por template

- [ ] `curl -I` retorna status esperado.
- [ ] title, description e H1 existem em paginas indexaveis.
- [ ] canonical e JSON-LD usam `https://www.avaliasolar.com.br`.
- [ ] schema representa conteudo visivel.
- [ ] pagina indexavel aparece no sitemap.
- [ ] pagina `noindex` nao aparece no sitemap.
- [ ] filtros nao retornam 500.
- [ ] pagina publica SEO e cacheavel ou tem justificativa tecnica documentada.
