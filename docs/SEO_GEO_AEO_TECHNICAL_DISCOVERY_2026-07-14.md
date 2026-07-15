# Discovery tecnico SEO, GEO, AEO, performance e indexabilidade

Data: 2026-07-14  
Dominio analisado: `https://www.avaliasolar.com.br`  
Escopo: diagnostico, sem alteracao de codigo de produto.

## 1. Resumo executivo

A plataforma evoluiu bastante em relacao a auditorias anteriores. Hoje ja existe uma base real de SEO tecnico: App Router com SSR/ISR, sitemap publico, robots.txt, metadados dinamicos, Organization/WebSite schema global, LocalBusiness em paginas de empresa, AggregateRating/Review quando ha dados, BreadcrumbList e ItemList em parte das paginas de categoria/local.

Mesmo assim, o maior risco atual nao e "falta total de SEO". O risco e inconsistencia operacional em escala:

- paginas publicas importantes ainda aparecem no crawl com 404, 500 historico, canonicals fracos ou canonicando para a home
- algumas rotas indexaveis usam `no-store/private`, reduzindo cache, escalabilidade e velocidade para crawlers
- filtros e URLs legadas podem criar soft-404, duplicacao e desperdicio de crawl budget
- a cobertura de schemas ainda e parcial por template
- o conteudo AEO/GEO ainda nao tem profundidade suficiente para capturar respostas de IA, citacoes e long-tail local

Nota tecnica estimada nesta leitura: `6.8/10`.

Leitura direta: a base esta boa para virar uma plataforma forte de busca e reviews, mas precisa de uma camada de governanca tecnica antes de escalar milhares de paginas locais, categorias e perfis.

## 2. Fontes usadas

- CSV de crawl local: `C:\Users\Bobi\Desktop\Avalia-gtm-data\internal_all_v2.csv`
- Auditoria de referencia: `C:\Users\Bobi\.codex\attachments\37faec10-6b13-454a-b060-cebbb9b491f4\pasted-text.txt`
- Codigo local:
  - `AB0-1-front/app/sitemap.ts`
  - `AB0-1-front/app/robots.ts`
  - `AB0-1-front/app/layout.tsx`
  - `AB0-1-front/app/companies/[id]/page.tsx`
  - `AB0-1-front/app/companies/[id]/local-page.tsx`
  - `AB0-1-front/app/categories/[slug]/page.tsx`
  - `AB0-1-front/components/JsonLd.tsx`
  - `AB0-1-front/next.config.js`
  - `AB0-1-front/lib/api-client.ts`
  - `AB0-1-front/lib/site.ts`
- URLs verificadas:
  - `https://www.avaliasolar.com.br/`
  - `https://www.avaliasolar.com.br/robots.txt`
  - `https://www.avaliasolar.com.br/sitemap.xml`
  - `https://www.avaliasolar.com.br/categories/energia-solar-residencial`
  - `https://www.avaliasolar.com.br/companies/372`
  - `https://www.avaliasolar.com.br/quote-wizard`
- Referencias oficiais Google:
  - Structured data guidelines
  - Organization structured data
  - FAQ/HowTo rich results changes
  - Speakable structured data beta

## 3. Estado atual pelo crawler

O CSV tem 481 linhas rastreadas.

| Indicador | Valor observado | Diagnostico |
| --- | ---: | --- |
| Total de linhas | 481 | Amostra relevante para detectar padroes tecnicos. |
| Linhas HTML estimadas | 259 | Base suficiente para avaliar templates publicos. |
| Assets estimados | 222 | Muitos `_next/static` e imagens de API aparecem no crawl. |
| Status `200 OK` | 276 | Parte majoritaria responde. |
| Bloqueados por robots.txt | 186 | Predomina em assets/arquivos, nao necessariamente problema de indexacao de pagina. |
| `500 Internal Server Error` | 10 | Critico quando ocorre em paginas publicas/filtros. |
| `307 Temporary Redirect` | 4 | Precisa revisar se os redirects deveriam ser permanentes. |
| `404 Not Found` | 1 | Existe pelo menos uma rota publica quebrada: `/quote-wizard`. |
| HTML sem title | 21 | Provavel mistura de erros, assets classificados e paginas canonizadas/fracas. |
| HTML sem meta description | 21 | Precisa revisar templates e rotas de fallback. |
| HTML sem H1 | 63 | Sinal de paginas utilitarias, soft pages ou templates que nao entregam estrutura semantica. |
| Canonicalised | 174 | Alto. Nem todo canonical e ruim, mas esse volume exige governanca. |

Conclusao do crawl: o problema principal e qualidade de indexacao, nao ausencia de paginas. Existem muitas URLs, mas parte delas nao tem contrato claro entre `indexavel`, `noindex`, `canonical`, `redirect` e `status code`.

## 4. O que esta bom hoje

### 4.1 Renderizacao e conteudo SSR

A homepage entrega conteudo renderizado no HTML, incluindo busca, categorias, empresas recomendadas, comparador e FAQ. Isso e bom para Googlebot e outros crawlers que leem HTML sem depender apenas de client-side rendering.

A pagina de categoria `energia-solar-residencial` tambem entrega H1, descricao, filtros e cards de empresas em HTML. Isso e uma base boa para paginas de categoria e programmatic SEO.

### 4.2 Sitemap e descoberta

O sitemap publico esta acessivel em `https://www.avaliasolar.com.br/sitemap.xml`.

Leitura do sitemap:

- 536 URLs publicadas
- cerca de 496 URLs relacionadas a empresas, categorias ou paginas locais
- 25 categorias
- 3 posts de blog
- 54 paginas locais de energia solar
- 22 paginas de categorias de empresas

Isso mostra que a plataforma ja saiu de uma arquitetura puramente institucional e tem base programatica real.

### 4.3 Robots e seguranca basica

O `robots.txt` publico permite crawl geral e bloqueia areas privadas como dashboard e API. O codigo local tambem bloqueia `/admin/`, mas a versao publica observada nao exibia esse bloqueio, o que sugere possivel diferenca de deploy.

Headers observados na homepage:

- HSTS ativo
- CSP presente
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- cache publico com `max-age=300` e `stale-while-revalidate=86400`

### 4.4 Structured data ja existente

O codigo atual tem:

- `Organization` e `WebSite` globais em `app/layout.tsx` via `JsonLd`
- `SearchAction` para sitelinks search box
- `LocalBusiness` em paginas de empresa
- `AggregateRating` e `Review` quando ha dados de avaliacao
- `ItemList` em paginas de categoria/listagem
- `BreadcrumbList` em parte das paginas
- `BlogPosting`/article metadata em posts

Isso corrige parte relevante da auditoria antiga que dizia que Review/AggregateRating estavam ausentes. O ponto atual nao e mais "schema zero"; e cobertura, consistencia e validacao por template.

### 4.5 Canonical de empresa por slug

`/companies/372` redireciona para a URL canonica com slug da empresa. Esse comportamento e correto: reduz duplicacao entre ID cru e slug amigavel.

## 5. O que esta ruim ou fragil

### 5.1 Rota publica quebrada: `/quote-wizard`

O crawl encontrou `/quote-wizard` como 404 e a verificacao ao vivo confirmou que a URL nao existe.

Impacto:

- desperdicando crawl budget
- possivel CTA antigo quebrado
- experiencia ruim para usuario que chega por historico, link externo ou cache
- sinal fraco para Google se a URL continua sendo descoberta

Recomendacao:

- se o fluxo virou modal, criar uma rota fallback que abre a intencao correta ou redireciona para uma pagina valida com query controlada
- alternativa minima: redirect 301 para `/` ou `/companies` com tracking
- ideal: criar `/diagnostico-solar` ou `/orcamento` como landing indexavel/nao-indexavel conforme estrategia comercial

### 5.2 Erros 500 historicos em paginas locais filtradas

O CSV registrou 10 erros 500 em URLs como:

- `/companies/energia-solar/ap/macapa?project_types=Comerciais`
- `/companies/energia-solar/ap/macapa?project_types=Condomínios`
- `/companies/energia-solar/ap/macapa?project_types=Sistemas+Off-grid`
- `/companies/energia-solar/ap/macapa?category_ids=65`
- `/companies/energia-solar/ap/macapa?category_ids=64`

Uma verificacao pontual posterior retornou 200 para um dos exemplos. Isso indica flakiness, deploy intermediario ou erro corrigido parcialmente.

Impacto:

- URLs de filtros sao onde a plataforma pode crescer muito
- se filtros quebram, Google reduz confianca de crawl
- se os filtros retornam 200 sem conteudo bom, podem virar thin pages

Recomendacao:

- garantir teste automatizado para pagina local com filtros comuns
- toda URL filtrada deve obedecer contrato:
  - filtros profundos: `noindex, follow`
  - pagina local base com massa critica: indexavel
  - filtro invalido: 404/410 ou redirect limpo
  - nunca 500

### 5.3 Canonicals demais e alguns possivelmente errados

O CSV aponta 174 URLs `Canonicalised`. Canonicalizacao por si so nao e erro, mas o volume mostra que varias URLs estao sendo descobertas mesmo sem merecer indexacao.

Padroes preocupantes:

- paginas `/companies/{slug}/review` aparentam canonicalizar para a home ou renderizar metadata generica
- algumas categorias antigas parecem canonicalizar para `/` com titulo generico `Avalia Solar`
- algumas URLs de empresa parecem ter divergencia entre slug, titulo, H1 e canonical

Impacto:

- risco de soft-404
- perda de relevancia semantica
- confusao para crawlers sobre qual pagina deve ranquear
- relatorios de Search Console mais sujos

Recomendacao:

- canonical nunca deve ser usado como lixeira para URL ruim
- URL inexistente deve ser 404/410 ou redirect 301 para equivalente real
- pagina duplicada deve canonicalizar para pagina equivalente, nao para a home
- review page deve ser uma decisao explicita:
  - ou indexavel com H1, metadata e schema real
  - ou `noindex, follow` e canonical para o perfil da empresa

### 5.4 Categorias legadas e slugs antigos

Exemplos do crawl indicam categorias com titulo generico/canonical ruim:

- `/categories/energia-solar-rural-agronegocio`
- `/categories/monitoramento-om`
- `/categories/baterias-armazenamento-energia`
- `/categories/carport-solar-coberturas-solares`
- `/categories/inversores`

O sitemap atual usa slugs novos como:

- `/categories/inversores-solares`
- `/categories/energia-solar-rural`
- `/categories/carport-solar`
- `/categories/monitoramento-operacao-manutencao`

Diagnostico:

- ha rastros de slugs antigos sendo descobertos
- falta uma tabela de redirects permanentes de slug antigo para slug novo

Recomendacao:

- criar mapa de aliases de categoria no backend ou no `next.config.js`
- URLs antigas com equivalente: 301 para slug novo
- URLs antigas sem equivalente: 410
- evitar renderizar home/generico com status 200

### 5.5 Cache inconsistente em paginas SEO

Homepage observada com cache publico:

- `Cache-Control: public, max-age=300, stale-while-revalidate=86400`

Categoria e perfil de empresa observados com:

- `no-store, must-revalidate, no-cache, max-age=0, private`

Isso e ruim para escala. Categoria e perfil de empresa sao paginas SEO publicas; elas deveriam ser cacheaveis com ISR, tag revalidation ou CDN.

Impacto:

- mais carga no servidor
- TTFB pior em crawls
- risco de timeouts sob trafego
- menor resiliencia quando API Rails oscila

Hipoteses tecnicas:

- chamadas `fetch` com `credentials: include` no `api-client`
- cookies de usuario vazando para SSR publico
- uso de APIs autenticadas para montar paginas publicas
- headers definidos por middleware/proxy

Recomendacao:

- separar cliente API publico SEO de cliente autenticado
- em paginas publicas, evitar `credentials: include`
- usar `next: { revalidate }` ou cache tags por template
- garantir que headers publicos nao sejam sobrescritos por cookies/session

### 5.6 Host canonical inconsistente no schema

`SITE.url` usa `https://www.avaliasolar.com.br`, mas em trechos da pagina de empresa ha URLs montadas com `https://avaliasolar.com.br` sem `www`.

Impacto:

- sinal duplicado em schema/canonical
- inconsistencias em `@id`
- confusao para Knowledge Graph e crawlers

Recomendacao:

- toda URL absoluta deve sair de `SITE.url`
- `@id` de Organization, WebSite, LocalBusiness e WebPage deve usar host canonico com `www`
- redirecionamento host sem `www` -> `www` deve ser permanente e uniforme

### 5.7 Imagens de empresa em dominio API e bloqueios

O CSV mostra URLs de ActiveStorage em `api.avaliasolar.com.br/rails/active_storage/...` marcadas como bloqueadas por robots.

Isso nao impede necessariamente a indexacao das paginas, mas afeta SEO de imagens e exibicao de imagens em rich results se imagens referenciadas em schema nao forem acessiveis.

Recomendacao:

- para imagens importantes em schema, usar URLs crawlable e estaveis
- preferir proxy/otimizacao no dominio `www`
- manter filenames descritivos
- validar no URL Inspection se Google consegue buscar logo, banners e imagens de artigo

### 5.8 Payload HTML e scripts de terceiros

Observacao de tamanho:

- homepage com HTML bruto alto
- categoria tambem com payload alto
- GTM, analytics, PostHog/Nutshell e outros scripts aumentam risco de INP/LCP

Sem PageSpeed nesta execucao porque a API publica retornou `429 Too Many Requests`. Portanto, nao ha score Lighthouse confiavel neste diagnostico.

Recomendacao:

- medir RUM real por template: home, categoria, empresa, local, blog
- reportar p75 LCP/INP/CLS
- reduzir serializacao de listas grandes no HTML/RSC quando possivel
- carregar scripts comerciais por consentimento, atraso ou prioridade baixa

## 6. Diagnostico por frente

### 6.1 SEO tecnico

Estado atual:

- bom ponto de partida
- sitemap e robots existem
- metadata dinamica existe
- paginas principais renderizam conteudo

Principais gaps:

- URLs quebradas e legadas
- canonicalizacao excessiva
- cache privado em paginas publicas
- H1 ausente em parte das URLs rastreadas
- falta governanca clara para filtros

Meta desejada:

- cada URL publica deve cair em uma das categorias abaixo:
  - `200 indexavel self-canonical`
  - `200 noindex, follow`
  - `301 para equivalente canonico`
  - `404/410 para recurso inexistente`

Qualquer coisa fora disso vira divida tecnica de SEO.

### 6.2 GEO

Estado atual:

- a marca tem pagina, schema e algum conteudo estruturado
- ainda falta densidade de citacoes externas e dados proprietarios publicaveis

Gaps:

- pouco conteudo original citavel
- poucas paginas de metodologia e transparencia
- poucos dados agregados por estado/cidade/categoria
- pouca presenca em listas externas, reviews e midia setorial

Recomendacao:

- publicar relatorios proprietarios:
  - ranking de empresas por estado
  - preco medio por tipo de projeto
  - tempo medio de resposta
  - categorias mais buscadas
  - mapa de cobertura por cidade
- criar paginas institucionais fortes:
  - metodologia de avaliacao
  - criterios de verificacao
  - politica editorial
  - como funciona o ranking
  - dados e insights do setor
- criar `llms.txt` com mapa de conteudos canonicos para IA
- gerar paginas com respostas curtas, tabelas e dados factuais que possam ser citados

### 6.3 AEO

Estado atual:

- homepage tem FAQ visivel
- paginas de categoria/local ja podem responder buscas transacionais

Gaps:

- poucas respostas diretas em formato 40-70 palavras
- blog pequeno
- perguntas de meio/fundo de funil pouco cobertas
- FAQPage schema nao deve ser usado como principal aposta de rich result comercial

Nota importante:

- Google reduziu fortemente FAQ rich results para sites que nao sao governo/saude.
- HowTo rich result foi removido/depreciado como oportunidade relevante de busca.
- Isso nao significa remover perguntas e guias. Significa que a estrategia AEO deve focar conteudo util, blocos de resposta, comparativos, tabelas e autoridade, nao apenas schema.

Recomendacao:

- adicionar blocos "Resposta rapida" em:
  - categorias
  - paginas locais
  - empresa
  - blog
  - diagnostico solar
- criar secoes "O que considerar antes de contratar"
- criar tabelas comparativas por categoria
- gerar perguntas baseadas em intencao:
  - "Quanto custa energia solar em [cidade]?"
  - "Como escolher uma empresa solar confiavel?"
  - "Quais documentos uma empresa solar deve ter?"
  - "Qual a diferenca entre energia solar residencial e comercial?"

### 6.4 Schema

Estado atual:

| Schema | Status atual | Diagnostico |
| --- | --- | --- |
| `Organization` | Implementado globalmente | Bom, mas revisar campos de contato/identificadores. |
| `WebSite` + `SearchAction` | Implementado globalmente | Bom para entidade e busca interna. |
| `LocalBusiness` | Implementado em empresa | Bom, mas revisar host, `url` e consistencia de endereco. |
| `AggregateRating` | Implementado quando ha dados | Bom para plataforma de reviews, desde que reviews sejam reais e visiveis. |
| `Review` | Implementado quando ha dados | Bom, precisa validar qualidade e visibilidade. |
| `ItemList` | Parcial em listagens | Bom para categorias/locais. |
| `BreadcrumbList` | Parcial | Maior gap de cobertura transversal. |
| `Article`/`BlogPosting` | Parcial no blog | Precisa expandir conteudo e imagens. |
| `FAQPage` | Usar com criterio | Pouco efeito visual para site comercial comum. |
| `Speakable` | Baixa prioridade | Google trata como beta/noticias; nao deve ser prioridade comercial. |
| `HowTo` | Baixa prioridade | Rich result removido/depreciado; usar guia no conteudo, nao como aposta de schema. |

Recomendacao de governanca:

- criar uma matriz por template:
  - home: `Organization`, `WebSite`, `WebPage`, `BreadcrumbList`
  - categoria: `CollectionPage`, `ItemList`, `BreadcrumbList`
  - local: `CollectionPage`, `ItemList`, `BreadcrumbList`, dados locais
  - empresa: `LocalBusiness`, `AggregateRating`, `Review`, `BreadcrumbList`
  - blog: `BlogPosting`, `BreadcrumbList`
  - help: `WebPage`, perguntas visiveis, talvez `FAQPage` apenas onde fizer sentido
  - comparador: `WebPage`, `ItemList` ou comparativo proprio

### 6.5 Performance e Core Web Vitals

Estado atual:

- existe `WebVitalsReporter` no layout
- imagem usa formatos modernos no Next config
- homepage tem cache publico

Gaps:

- sem medicao PageSpeed nesta execucao por limite `429`
- paginas de categoria/empresa responderam com cache privado
- risco de excesso de HTML/RSC em listagens
- risco de scripts terceiros prejudicarem INP

Recomendacao:

- dashboard de CWV por template:
  - home
  - categoria
  - local
  - empresa
  - blog
  - dashboard
- metas:
  - LCP p75 abaixo de 2.5s
  - INP p75 abaixo de 200ms
  - CLS p75 abaixo de 0.1
- separar bundle publico de dashboard
- adiar scripts nao essenciais
- cachear paginas SEO publicas em CDN

### 6.6 Escalabilidade e programmatic SEO

Estado atual:

- sitemap tem 536 URLs, ainda pequeno
- local SEO ja comeca a existir
- `sitemap.ts` busca categorias, empresas ativas e paginas locais

Gaps:

- risco de `per_page=100` limitar empresas no sitemap se a API crescer
- falta sitemap index por tipo
- falta politica clara de indexabilidade para cidade/categoria/filtro
- falta regra de qualidade minima para publicar paginas locais

Recomendacao:

- dividir sitemap:
  - `sitemap-static.xml`
  - `sitemap-companies.xml`
  - `sitemap-categories.xml`
  - `sitemap-local.xml`
  - `sitemap-blog.xml`
- usar sitemap index quando passar de alguns milhares de URLs
- regra de indexacao local:
  - indexar apenas cidade/categoria com massa critica
  - exemplo: minimo 3 empresas, conteudo unico, dados de cobertura e texto local
  - cidade sem massa critica: noindex ou nao gerar
- filtros sempre controlados:
  - `?rating=`, `?verified=`, `?project_types=`, `?category_ids=`, `?page=` normalmente `noindex, follow`

### 6.7 Resiliencia

Estado atual:

- Next depende da API Rails para varias paginas
- ha fallback de metadata em alguns templates
- existem erros historicos em filtros locais

Gaps:

- API instavel pode virar 500 publico
- pagina SEO publica nao deve cair por falha parcial de dados secundarios
- logs de API em producao podem gerar ruido/performance e vazar dados

Recomendacao:

- timeouts curtos e fallback degradado para paginas publicas
- cache stale para dados de empresas/categorias
- erro de reviews nao deve derrubar perfil da empresa
- erro de filtros deve retornar estado vazio controlado, nao 500
- monitorar 5xx por template e query pattern

## 7. Priorizacao recomendada

### P0 - Corrigir indexabilidade quebrada

1. Resolver `/quote-wizard` com redirect, rota real ou landing substituta.
2. Criar mapa de redirects para slugs legados de categorias.
3. Garantir que paginas locais filtradas nunca retornem 500.
4. Corrigir canonical de review pages para empresa ou `noindex, follow`.
5. Padronizar host canonical com `https://www.avaliasolar.com.br` em schema, canonical e redirects.

### P1 - Tornar paginas SEO publicas cacheaveis

1. Separar cliente API publico de cliente autenticado.
2. Remover `credentials: include` de fetches publicos SEO.
3. Garantir `Cache-Control` publico/ISR em categoria, empresa, local e blog.
4. Criar monitoramento de TTFB por template.
5. Validar headers em deploy, nao apenas no codigo local.

### P1 - Cobertura de schema por template

1. Criar matriz de schemas obrigatorios por rota.
2. Garantir `BreadcrumbList` em todas as paginas publicas principais.
3. Validar `LocalBusiness`, `AggregateRating` e `Review` no Rich Results Test.
4. Garantir que todo dado em JSON-LD esteja visivel na pagina.
5. Garantir que imagens usadas em schema sejam crawlable.

### P2 - Expandir AEO/GEO com conteudo proprietario

1. Criar paginas de metodologia, ranking e verificacao.
2. Criar relatorios por estado/cidade/categoria.
3. Criar blocos de resposta direta nas paginas de categoria e local.
4. Expandir blog com clusters de conteudo:
   - custo
   - financiamento
   - confiabilidade
   - equipamentos
   - manutencao
   - mobilidade eletrica
5. Criar `llms.txt` e pagina de dados/estatisticas citaveis.

### P2 - Escala controlada de programmatic SEO

1. Implementar sitemap index.
2. Paginar busca de empresas no sitemap.
3. Criar regra de qualidade para paginas locais.
4. Nao indexar filtros profundos.
5. Monitorar URLs indexadas vs. URLs validas no Search Console.

### P3 - Autoridade externa

1. Google Business Profile completo.
2. G2/Trustpilot/Reclame Aqui conforme plano de autoridade.
3. Parcerias editoriais com Canal Solar, Portal Solar e midia setorial.
4. Estudos proprietarios citaveis por imprensa.
5. Backlinks por dados, nao por guest post generico.

## 8. Checklist tecnico de aceite

| Area | Criterio de aceite |
| --- | --- |
| Status code | Zero 500 em paginas publicas no crawl semanal. |
| 404 | Toda URL publica quebrada tem decisao: 301, 410 ou recriacao. |
| Canonical | Paginas indexaveis sao self-canonical; duplicadas apontam para equivalente real. |
| Noindex | Filtros profundos e paginas utilitarias usam `noindex, follow`. |
| Sitemap | Sitemap contem apenas URLs canonicas e indexaveis. |
| Robots | Robots publico bate com `app/robots.ts` e bloqueia areas privadas. |
| Schema | Cada template publico tem JSON-LD validado e representativo do conteudo visivel. |
| Breadcrumb | Todas as paginas publicas principais emitem `BreadcrumbList`. |
| Cache | Home, categoria, local, empresa e blog usam cache publico/ISR. |
| CWV | p75 por template: LCP < 2.5s, INP < 200ms, CLS < 0.1. |
| Conteudo AEO | Paginas principais possuem respostas curtas, tabelas e comparativos. |
| GEO | Existem paginas citaveis com metodologia, dados e estatisticas proprietarias. |
| Imagens | Imagens usadas em schema sao crawlable, estaveis e relevantes. |

## 9. Rotas que merecem revisao manual imediata

| URL/padrao | Problema observado | Acao recomendada |
| --- | --- | --- |
| `/quote-wizard` | 404 publico | Criar rota/redirect/landing. |
| `/companies/energia-solar/ap/macapa?...` | 500 historico em filtros | Testes e fallback robusto. |
| `/companies/{slug}/review` | Canonicalizacao suspeita | Decidir indexavel vs noindex. |
| `/categories/{slug-antigo}` | Slugs legados com metadata generica | Redirect 301 para slug novo ou 410. |
| `api.avaliasolar.com.br/rails/active_storage/...` | Imagens bloqueadas no crawl | Rever estrategia se imagem SEO/rich result for meta. |
| paginas de categoria/empresa | Cache privado observado | Tornar publicas/cacheaveis. |

## 10. Diferenca entre auditoria antiga e estado atual

A auditoria de referencia dizia que a plataforma provavelmente nao tinha local SEO, Review schema, AggregateRating, blog e arquitetura de reviews. O codigo atual mostra que parte disso ja foi implementada ou parcialmente implementada:

- existem paginas locais
- existe sitemap com categorias, empresas e locais
- existe `LocalBusiness`
- existe `AggregateRating`/`Review` condicional
- existe `Organization`/`WebSite`
- existe blog, ainda pequeno

Portanto, a proxima etapa nao deve ser "instalar SEO do zero". A etapa correta e endurecimento tecnico:

- corrigir rotas quebradas
- limpar canonicals
- controlar filtros
- padronizar schemas
- cachear templates publicos
- escalar conteudo proprietario
- medir CWV real

## 11. Plano de melhoria em 30/60/90 dias

### 0-30 dias

- Corrigir `/quote-wizard`
- Corrigir slugs legados de categoria
- Revisar review pages
- Corrigir cache privado em paginas SEO
- Padronizar host `www` em schema/canonical
- Criar relatorio semanal de status code por crawl

### 31-60 dias

- Sitemap index por tipo
- BreadcrumbList em todas as rotas publicas
- Matriz de schema por template
- Regras de indexabilidade para filtros
- Testes automatizados para paginas locais filtradas
- Dashboard de CWV por template

### 61-90 dias

- Relatorios proprietarios de mercado
- Clusters de blog por intencao
- Paginas locais com conteudo unico e criterio minimo
- `llms.txt`
- Pagina de metodologia/ranking/verificacao
- Programa de autoridade externa e citacoes

## 12. Conclusao

O Avalia Solar ja tem a fundacao tecnica para ser uma plataforma SEO/GEO/AEO forte: SSR, sitemap, schemas, categorias, empresas e paginas locais. O que impede o salto agora e a falta de governanca fina sobre URLs e templates.

A prioridade deve ser reduzir ruido para crawlers antes de expandir volume:

1. cada URL precisa ter status, canonical e indexabilidade corretos
2. paginas SEO publicas precisam ser cacheaveis e resilientes
3. schemas precisam ser consistentes por template
4. filtros precisam ser controlados para nao criar lixo indexavel
5. GEO/AEO precisa de conteudo proprietario, dados e metodologia, nao apenas metatags

Depois disso, a plataforma pode escalar programmatic SEO local com muito menos risco de thin content, soft-404, crawl waste e instabilidade.
