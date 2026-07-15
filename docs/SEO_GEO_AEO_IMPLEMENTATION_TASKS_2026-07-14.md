# Plano operacional de melhoria SEO, GEO, AEO, performance e indexabilidade

Data: 2026-07-14  
Base: `docs/SEO_GEO_AEO_TECHNICAL_DISCOVERY_2026-07-14.md`  
Dominio: `https://www.avaliasolar.com.br`  
Objetivo: transformar o discovery em tarefas executaveis, testaveis e escalaveis.

## 1. Como usar este documento

Este documento deve ser usado como backlog tecnico. Cada task tem:

- prioridade
- objetivo
- contexto do discovery
- arquivos provaveis
- requisitos minimos
- subtasks
- testes obrigatorios
- criterios de aceite
- prompt pronto para execucao por IA/Codex

Ordem recomendada:

1. executar primeiro todos os itens `P0`
2. depois `P1`
3. depois `P2`
4. deixar `P3` para autoridade, escala e maturidade

Regra de governanca:

- nenhuma task de escala programatica deve ser iniciada antes das tasks P0 de indexabilidade
- nenhuma nova pagina local/categoria deve ser indexada sem regra de qualidade minima
- nenhuma task de schema deve adicionar dados invisiveis ao usuario
- FAQPage e HowTo nao devem ser tratados como alavancas principais de rich result no Google
- Core Web Vitals deve usar INP, nao FID

## 2. Requisitos minimos globais

### 2.1 Requisitos de indexabilidade

Toda URL publica deve terminar em um destes estados:

| Estado | Quando usar | Exigencia minima |
| --- | --- | --- |
| `200 indexable self-canonical` | pagina principal que deve ranquear | title, description, H1, canonical proprio, conteudo unico, schema aplicavel |
| `200 noindex, follow` | filtro, pagina utilitaria, etapa de fluxo, pagina autenticavel publica | meta robots noindex/follow, canonical coerente, sem aparecer no sitemap |
| `301 permanent redirect` | URL antiga com equivalente novo | redirect direto, sem cadeia, destino indexavel |
| `404` | recurso inexistente sem equivalente | pagina de erro correta, sem canonical para home |
| `410` | recurso removido permanentemente | usar para slugs antigos sem substituto |

Nao permitido:

- pagina inexistente retornando 200
- URL ruim canonicalizando para home
- URL filtrada indexavel por acidente
- URL no sitemap com `noindex`
- URL no sitemap que redireciona
- URL publica retornando 500

### 2.2 Requisitos de metadata

Toda pagina indexavel deve ter:

- title unico entre 35 e 65 caracteres quando possivel
- meta description unica entre 110 e 160 caracteres quando possivel
- H1 unico e semanticamente alinhado ao title
- canonical absoluto com `https://www.avaliasolar.com.br`
- Open Graph basico
- Twitter Card basico quando aplicavel

### 2.3 Requisitos de schema

Todo JSON-LD deve:

- representar conteudo visivel na pagina
- usar URLs absolutas canonicas com `www`
- usar `@id` estavel
- nao duplicar entidades com ids conflitantes
- nao marcar reviews falsas, invisiveis ou auto-promocionais
- usar imagem crawlable quando a propriedade `image` for declarada

Matriz minima:

| Template | Schemas minimos |
| --- | --- |
| Home | `Organization`, `WebSite`, `WebPage`, `BreadcrumbList` |
| Categoria | `CollectionPage`, `ItemList`, `BreadcrumbList` |
| Pagina local | `CollectionPage`, `ItemList`, `BreadcrumbList` |
| Empresa | `LocalBusiness`, `AggregateRating` condicional, `Review` condicional, `BreadcrumbList` |
| Blog | `BlogPosting` ou `Article`, `BreadcrumbList` |
| Help | `WebPage`, conteudo de perguntas visiveis; `FAQPage` apenas se estrategicamente justificado |
| Comparador | `WebPage`, `ItemList` ou estrutura propria de comparacao |

### 2.4 Requisitos de performance

Metas por template publico:

| Metrica | Meta p75 |
| --- | ---: |
| LCP | abaixo de 2.5s |
| INP | abaixo de 200ms |
| CLS | abaixo de 0.1 |
| TTFB | abaixo de 800ms em cache hit |
| HTML transferido | reduzir sempre que listas ficarem grandes |

Requisitos tecnicos:

- paginas SEO publicas devem ser cacheaveis
- scripts terceiros devem carregar com prioridade controlada
- imagens hero devem ter dimensoes e prioridade definidas
- cards abaixo da dobra devem ser lazy/deferred quando possivel

### 2.5 Requisitos de testes

Toda task de codigo deve rodar pelo menos:

```powershell
cd AB0-1-front
npm run typecheck
npm run lint
```

Quando mexer em Rails:

```powershell
cd AB0-1-back
bundle exec rspec
```

Quando mexer em rotas SEO:

```powershell
Invoke-WebRequest -Uri "https://www.avaliasolar.com.br/sitemap.xml" -UseBasicParsing
Invoke-WebRequest -Uri "https://www.avaliasolar.com.br/robots.txt" -UseBasicParsing
```

Para validar headers em ambiente publicado:

```powershell
curl.exe -I https://www.avaliasolar.com.br/
curl.exe -I https://www.avaliasolar.com.br/categories/energia-solar-residencial
curl.exe -I https://www.avaliasolar.com.br/companies/372
```

## 3. Roadmap macro

| Fase | Periodo | Resultado esperado |
| --- | --- | --- |
| Fase 0 | 1-2 dias | baseline tecnico reproduzivel e lista de URLs problema |
| Fase 1 | 1 semana | P0 resolvido: 404, 500 historico, canonical errado, host canonico |
| Fase 2 | 2 semanas | P1 resolvido: cache publico, schema por template, breadcrumbs |
| Fase 3 | 3-4 semanas | sitemap escalavel, filtros governados, CWV medido |
| Fase 4 | 30-90 dias | AEO/GEO com conteudo proprietario, relatorios e autoridade |

## 4. Fase 0 - Baseline e governanca

### TASK 0.1 - Criar baseline tecnico reproduzivel do crawl

Prioridade: `P0`  
Tipo: auditoria/observabilidade  
Objetivo: transformar o CSV atual em baseline mensuravel para comparar depois das correcoes.

Contexto:

- CSV atual tem 481 linhas
- 10 URLs com 500 historico
- 1 URL 404 publica
- 174 canonicalizadas
- 63 HTML sem H1

Arquivos provaveis:

- `docs/SEO_GEO_AEO_TECHNICAL_DISCOVERY_2026-07-14.md`
- novo relatorio em `docs/seo-crawl-baselines/`
- opcional: script em `scripts/seo/`

Requisitos minimos:

- extrair contagem por status code
- extrair contagem por indexabilidade
- listar URLs 404
- listar URLs 500
- listar URLs canonicalizadas para home
- listar URLs sem H1
- listar URLs no sitemap que nao deveriam estar la

Subtasks:

1. criar pasta `docs/seo-crawl-baselines/`
2. criar markdown com resumo do CSV
3. criar CSV/JSON derivado com URLs problema
4. separar problemas por tipo: `status`, `canonical`, `metadata`, `h1`, `robots`, `sitemap`
5. documentar data e origem do crawl

Testes obrigatorios:

- confirmar que o total de linhas derivadas bate com 481
- confirmar que a contagem de 500 bate com 10
- confirmar que a contagem de 404 bate com 1
- confirmar que as URLs problema aparecem no relatorio

Criterios de aceite:

- qualquer pessoa consegue abrir o baseline e entender quais URLs precisam ser corrigidas
- o baseline pode ser comparado com um novo crawl depois das correcoes
- nenhum dado sensivel e exposto

Prompt da task:

```text
Use o CSV C:\Users\Bobi\Desktop\Avalia-gtm-data\internal_all_v2.csv e crie um baseline tecnico em docs/seo-crawl-baselines/ com resumo por status code, indexability, canonical, H1 ausente, title ausente, meta description ausente e URLs problema. Nao altere codigo de produto. Gere tambem um checklist de regressao para comparar com crawls futuros.
```

### TASK 0.2 - Criar matriz oficial de templates SEO

Prioridade: `P0`  
Tipo: governanca  
Objetivo: mapear cada template publico para seu contrato de metadata, schema, cache e indexabilidade.

Arquivos provaveis:

- `AB0-1-front/app/**/page.tsx`
- `AB0-1-front/app/**/layout.tsx`
- `AB0-1-front/app/sitemap.ts`
- `AB0-1-front/app/robots.ts`
- novo documento em `docs/SEO_TEMPLATE_MATRIX_2026-07-14.md`

Requisitos minimos:

- mapear todas as rotas publicas principais
- marcar se deve indexar ou nao
- marcar schema esperado
- marcar canonical esperado
- marcar se entra no sitemap
- marcar tipo de cache esperado

Subtasks:

1. listar todos os `page.tsx`
2. classificar rotas em publicas, privadas e utilitarias
3. definir contrato por template
4. apontar gaps atuais
5. gerar checklist de implementacao por rota

Testes obrigatorios:

- `rg --files AB0-1-front/app | rg "page\\.tsx$"` para garantir cobertura
- comparar matriz com sitemap atual
- comparar matriz com robots atual

Criterios de aceite:

- toda rota publica importante aparece na matriz
- dashboard/admin/API ficam fora de sitemap e indexacao
- filtros e paginas de fluxo tem regra explicita

Prompt da task:

```text
Leia todas as rotas page.tsx em AB0-1-front/app e crie docs/SEO_TEMPLATE_MATRIX_2026-07-14.md. Para cada rota, defina: publico/privado, indexavel/noindex, canonical esperado, schema esperado, entra no sitemap sim/nao, cache esperado e risco atual. Use o discovery SEO de 2026-07-14 como base.
```

## 5. Fase 1 - P0 indexabilidade quebrada

### TASK 1.1 - Corrigir `/quote-wizard` 404

Prioridade: `P0`  
Tipo: frontend/SEO tecnico  
Objetivo: eliminar URL publica quebrada descoberta no crawl.

Contexto:

- `/quote-wizard` retorna 404
- o fluxo atual parece ter virado modal via `openQuoteWizard`
- uma URL historica ainda pode estar sendo descoberta por crawler ou links externos

Arquivos provaveis:

- `AB0-1-front/next.config.js`
- `AB0-1-front/app/quote-wizard/page.tsx`
- `AB0-1-front/lib/quote-wizard.ts`
- componentes com CTAs de diagnostico/orcamento

Opcoes de solucao:

| Opcao | Quando usar | Observacao |
| --- | --- | --- |
| 301 para `/` | solucao minima | perde intencao do usuario |
| 301 para `/companies` | melhor que home | ainda nao abre modal |
| criar `/diagnostico-solar` | melhor solucao estrategica | pode virar landing AEO/SEO |
| criar `/quote-wizard` noindex | bom para fluxo | preserva link antigo sem indexar |

Recomendacao:

- criar uma rota real `/diagnostico-solar` ou `/quote-wizard`
- se for fluxo/modal, usar `noindex, follow`
- se for landing com conteudo, indexar como pagina de diagnostico solar

Requisitos minimos:

- `/quote-wizard` nao pode retornar 404
- se redirect, deve ser 301/308 sem cadeia
- se pagina, deve ter title, description, H1 e canonical
- se pagina de fluxo, deve ter `noindex, follow`
- remover links internos antigos se nao fizerem sentido

Subtasks:

1. localizar todos os links para `/quote-wizard`
2. decidir se sera redirect ou pagina real
3. implementar rota/redirect
4. ajustar CTAs internos
5. validar status code publicado
6. atualizar sitemap se necessario

Testes obrigatorios:

```powershell
cd AB0-1-front
npm run typecheck
npm run lint
curl.exe -I https://www.avaliasolar.com.br/quote-wizard
```

Teste manual:

- abrir URL diretamente no navegador
- confirmar que usuario entende o proximo passo
- confirmar que nao cai em tela vazia

Criterios de aceite:

- `/quote-wizard` nao aparece mais como 404 no crawler
- se noindex, nao aparece no sitemap
- se indexavel, tem conteudo suficiente e self-canonical

Prompt da task:

```text
Corrija a rota publica /quote-wizard que aparece como 404 no discovery SEO. Investigue links internos existentes, escolha a menor solucao segura entre redirect permanente ou rota real noindex, implemente sem quebrar o fluxo openQuoteWizard, rode typecheck/lint e me entregue os headers esperados para validar em producao.
```

### TASK 1.2 - Criar redirect map para categorias legadas

Prioridade: `P0`  
Tipo: SEO tecnico/arquitetura de URL  
Objetivo: corrigir slugs antigos de categorias que hoje parecem renderizar metadata generica ou canonical ruim.

URLs suspeitas:

- `/categories/energia-solar-rural-agronegocio`
- `/categories/monitoramento-om`
- `/categories/baterias-armazenamento-energia`
- `/categories/carport-solar-coberturas-solares`
- `/categories/inversores`

Possiveis destinos:

- `/categories/energia-solar-rural`
- `/categories/monitoramento-operacao-manutencao`
- `/categories/armazenamento-energia`
- `/categories/carport-solar`
- `/categories/inversores-solares`

Arquivos provaveis:

- `AB0-1-front/next.config.js`
- `AB0-1-front/app/categories/[slug]/page.tsx`
- backend categories model/serializer se aliases ficarem no banco
- seeds ou migration se precisar registrar aliases

Requisitos minimos:

- slug antigo com equivalente deve retornar 301/308 para slug novo
- slug antigo sem equivalente deve retornar 410 ou 404 real
- nunca renderizar home/generico com status 200
- redirects nao devem criar cadeia
- sitemap deve conter apenas slugs canonicos

Subtasks:

1. extrair slugs de categoria do sitemap
2. extrair slugs antigos do crawl
3. montar tabela `old_slug -> canonical_slug`
4. implementar redirect map
5. validar headers de cada URL antiga
6. validar que sitemap nao contem old slugs
7. adicionar teste para pelo menos 3 redirects criticos

Testes obrigatorios:

```powershell
cd AB0-1-front
npm run typecheck
npm run lint
curl.exe -I https://www.avaliasolar.com.br/categories/inversores
curl.exe -I https://www.avaliasolar.com.br/categories/inversores-solares
```

Criterios de aceite:

- old slug retorna redirect permanente
- canonical slug retorna 200
- old slug nao aparece no sitemap
- nao ha canonical para home em categoria antiga

Prompt da task:

```text
Implemente governanca de slugs legados de categoria. Use o discovery SEO para mapear old_slug -> canonical_slug, implemente redirects permanentes sem cadeia, garanta que sitemap so emite slugs canonicos e adicione testes para os redirects principais. Nao use canonical para home como solucao.
```

### TASK 1.3 - Blindar paginas locais filtradas contra 500

Prioridade: `P0`  
Tipo: frontend/backend/resiliencia  
Objetivo: garantir que filtros em paginas locais nunca retornem erro 500 publico.

Contexto:

- CSV registrou 10 erros 500 em `/companies/energia-solar/ap/macapa?...`
- os filtros envolvem `project_types` e `category_ids`
- uma rechecagem pontual retornou 200, entao o problema pode ser intermitente

Arquivos provaveis:

- `AB0-1-front/app/companies/[id]/local-page.tsx`
- API Rails responsavel por local listings
- serializers de company/category
- controllers de busca/listagem

Requisitos minimos:

- filtro valido com zero resultado retorna 200 com estado vazio controlado
- filtro invalido retorna 400 controlado ou ignora filtro com aviso
- nenhum filtro comum retorna 500
- filtros profundos devem ser `noindex, follow`
- URLs com query nao devem entrar no sitemap

Subtasks:

1. mapear parametros aceitos: `project_types`, `category_ids`, `rating`, `verified`, `q`, `sort`, `page`, `distance`, `radius`, `lat`, `lng`
2. validar normalizacao de acentos e encoding
3. revisar chamada de API para Macapa/AP
4. adicionar fallback quando backend falha parcialmente
5. adicionar teste frontend para metadata noindex em filtros
6. adicionar request spec backend para filtros problemáticos
7. testar os 10 exemplos do CSV

Testes obrigatorios:

```powershell
cd AB0-1-front
npm run typecheck
npm run lint

cd ..\AB0-1-back
bundle exec rspec
```

Headers manuais:

```powershell
curl.exe -I "https://www.avaliasolar.com.br/companies/energia-solar/ap/macapa?project_types=Comerciais"
curl.exe -I "https://www.avaliasolar.com.br/companies/energia-solar/ap/macapa?category_ids=65"
```

Criterios de aceite:

- 10 URLs historicas nao retornam 500
- query pages tem noindex quando filtro profundo
- pagina local base continua indexavel quando cumpre criterio de qualidade
- estado vazio nao quebra layout

Prompt da task:

```text
Investigue e blinde as paginas locais filtradas que apareceram com 500 no crawl, principalmente /companies/energia-solar/ap/macapa com project_types e category_ids. Garanta fallback robusto, noindex/follow para filtros profundos, estado vazio controlado e testes backend/frontend cobrindo os exemplos do CSV.
```

### TASK 1.4 - Definir contrato das review pages

Prioridade: `P0`  
Tipo: SEO tecnico/schema/reviews  
Objetivo: resolver paginas `/companies/{slug}/review` que parecem canonicalizar errado ou renderizar metadata generica.

Decisao necessaria:

| Opcao | Quando usar | Resultado |
| --- | --- | --- |
| Review page indexavel | se houver pagina publica rica de reviews | H1, reviews visiveis, Review schema, canonical proprio |
| Review page noindex | se for formulario/modal/fluxo | `noindex, follow`, canonical empresa |
| Redirect para perfil | se rota nao tem valor proprio | 301/308 para empresa |

Recomendacao inicial:

- se a rota e formulario para avaliar, usar `noindex, follow`
- se a rota lista avaliacoes publicas, indexar somente quando houver volume minimo

Arquivos provaveis:

- `AB0-1-front/app/companies/[id]/review/page.tsx` se existir
- `AB0-1-front/app/companies/[id]/page.tsx`
- componentes de reviews
- sitemap

Requisitos minimos:

- review page nao pode canonicalizar para home
- se indexavel, deve mostrar conteudo unico
- se noindex, nao entra no sitemap
- se redirect, deve preservar intencao quando possivel

Subtasks:

1. localizar rota review
2. identificar se e pagina de listagem, formulario ou fluxo
3. escolher contrato
4. implementar metadata correta
5. ajustar sitemap
6. validar JSON-LD visivel se indexavel
7. adicionar teste

Testes obrigatorios:

```powershell
cd AB0-1-front
npm run typecheck
npm run lint
```

Validacao manual:

```powershell
curl.exe -I https://www.avaliasolar.com.br/companies/weg/review
```

Criterios de aceite:

- nenhuma review page canonicaliza para `/`
- Search Console nao recebe soft-404 por review page
- contrato documentado na matriz de templates

Prompt da task:

```text
Investigue as rotas /companies/{slug}/review e defina o contrato SEO correto: indexavel, noindex/follow ou redirect. Implemente metadata/canonical coerente, remova do sitemap se noindex, garanta que nao canonicalize para home e adicione teste de regressao.
```

### TASK 1.5 - Padronizar host canonico com `www`

Prioridade: `P0`  
Tipo: canonical/schema/infra  
Objetivo: eliminar divergencia entre `https://avaliasolar.com.br` e `https://www.avaliasolar.com.br`.

Arquivos provaveis:

- `AB0-1-front/lib/site.ts`
- `AB0-1-front/app/companies/[id]/page.tsx`
- `AB0-1-front/components/JsonLd.tsx`
- `AB0-1-front/next.config.js`
- config de dominio/CDN/proxy

Requisitos minimos:

- toda URL absoluta no app vem de `SITE.url`
- JSON-LD usa `www`
- canonical usa `www`
- sitemap usa `www`
- host sem `www` redireciona permanentemente para `www`

Subtasks:

1. procurar hardcodes de `https://avaliasolar.com.br`
2. trocar por `SITE.url` ou helper central
3. validar `@id` de Organization/WebSite/LocalBusiness
4. validar sitemap
5. validar redirects host-level

Comandos:

```powershell
rg "https://avaliasolar\\.com\\.br" AB0-1-front
rg "https://www\\.avaliasolar\\.com\\.br" AB0-1-front
```

Testes obrigatorios:

```powershell
cd AB0-1-front
npm run typecheck
npm run lint
curl.exe -I https://avaliasolar.com.br/
curl.exe -I https://www.avaliasolar.com.br/
```

Criterios de aceite:

- nenhum hardcode sem `www` em schema/canonical
- sem cadeia de redirect host
- sitemap e canonical usam o mesmo host

Prompt da task:

```text
Padronize o host canonico do frontend para https://www.avaliasolar.com.br. Localize hardcodes sem www, substitua por SITE.url/helper central, valide schema @id/canonical/sitemap e confirme redirects host-level sem cadeia.
```

## 6. Fase 2 - P1 cache, schema e cobertura

### TASK 2.1 - Separar API client publico SEO de client autenticado

Prioridade: `P1`  
Tipo: performance/resiliencia/cache  
Objetivo: impedir que paginas publicas SEO fiquem `no-store/private` por uso de cookies ou credentials.

Contexto:

- homepage tem cache publico
- categoria e empresa foram observadas com `no-store/private`
- `api-client.ts` usa `credentials: include` por padrao

Arquivos provaveis:

- `AB0-1-front/lib/api-client.ts`
- `AB0-1-front/lib/api.ts`
- paginas publicas em `app/categories`, `app/companies`, `app/blog`
- middleware se existir

Requisitos minimos:

- criar client publico sem cookies para SSR SEO
- manter client autenticado separado para dashboard
- paginas publicas nao devem depender de sessao
- headers finais devem permitir cache publico/ISR

Subtasks:

1. mapear fetches usados em paginas publicas
2. criar helper `publicApiFetch` ou equivalente
3. remover `credentials: include` dos fetches publicos
4. preservar comportamento autenticado no dashboard
5. revisar `revalidate`
6. validar headers publicados

Testes obrigatorios:

```powershell
cd AB0-1-front
npm run typecheck
npm run lint
```

Validacao de headers:

```powershell
curl.exe -I https://www.avaliasolar.com.br/categories/energia-solar-residencial
curl.exe -I https://www.avaliasolar.com.br/companies/372
```

Criterios de aceite:

- categoria publica nao responde com `private`
- empresa publica nao responde com `private`
- dashboard continua autenticado
- sem vazamento de dados de usuario em paginas publicas

Prompt da task:

```text
Separe o fetch publico SEO do fetch autenticado. Investigue por que categorias e empresas respondem com Cache-Control private/no-store, crie um client publico sem credentials/cookies, mantenha dashboard autenticado intacto e valide headers finais com curl.
```

### TASK 2.2 - Implementar cache/ISR por template publico

Prioridade: `P1`  
Tipo: performance/infra  
Objetivo: tornar home, categoria, local, empresa e blog cacheaveis e resilientes.

Requisitos minimos:

- paginas publicas usam `revalidate` ou cache tags
- dados volateis usam stale/fallback
- erro parcial nao derruba pagina inteira
- headers finais coerentes com pagina publica

Templates alvo:

- `/`
- `/categories/[slug]`
- `/companies/[id]`
- `/companies/energia-solar/[state]/[city]`
- `/blog/[slug]`
- `/companies`

Subtasks:

1. definir TTL por template
2. aplicar `revalidate`
3. revisar chamadas `fetch`
4. implementar fallback para reviews/listagens
5. validar headers
6. documentar TTL na matriz SEO

TTL sugerido:

| Template | TTL inicial |
| --- | ---: |
| Home | 300s |
| Categoria | 1800s |
| Empresa | 900s |
| Local | 1800s |
| Blog | 3600s |
| Sitemap | 3600s |

Testes obrigatorios:

```powershell
cd AB0-1-front
npm run typecheck
npm run lint
```

Criterios de aceite:

- headers publicos confirmados em producao
- sem `no-store/private` em paginas SEO
- alteracoes importantes ainda conseguem revalidar

Prompt da task:

```text
Implemente politica de cache/ISR para templates publicos SEO: home, categoria, empresa, local e blog. Defina TTL por template, garanta fallback para falha parcial de API, valide headers com curl e documente a politica na matriz SEO.
```

### TASK 2.3 - Cobrir BreadcrumbList em todas as paginas publicas principais

Prioridade: `P1`  
Tipo: schema/UX/SEO  
Objetivo: resolver o maior gap transversal de schema identificado: breadcrumbs incompletos.

Rotas minimas:

- `/`
- `/companies`
- `/companies/[id]`
- `/companies/[id]/review`
- `/companies/energia-solar/[state]/[city]`
- `/categories/[slug]`
- `/blog`
- `/blog/[slug]`
- `/help`
- `/about`
- `/contact`
- `/search`
- `/products`
- `/solucoes/[slug]` se existir

Requisitos minimos:

- JSON-LD `BreadcrumbList`
- breadcrumbs coerentes com URL
- `item` absoluto com `www`
- ultimo item representa pagina atual
- nao duplicar breadcrumbs conflitantes

Subtasks:

1. criar helper central `buildBreadcrumbJsonLd`
2. mapear rotas publicas
3. aplicar nos templates
4. validar no Rich Results Test
5. adicionar testes snapshot/DOM para rotas criticas

Testes obrigatorios:

```powershell
cd AB0-1-front
npm run typecheck
npm run lint
npm test -- --runInBand
```

Criterios de aceite:

- rotas criticas emitem BreadcrumbList
- JSON-LD valido
- breadcrumbs nao entram em dashboard/admin

Prompt da task:

```text
Implemente BreadcrumbList centralizado em todas as rotas publicas principais. Crie/helper reutilizavel, use SITE.url com www, cubra home, companies, company detail, local pages, categories, blog, help, about, contact e search. Adicione testes e valide que nao ha JSON-LD duplicado conflitante.
```

### TASK 2.4 - Validar e corrigir LocalBusiness/AggregateRating/Review

Prioridade: `P1`  
Tipo: schema/reviews  
Objetivo: garantir que schema de reviews esteja correto, visivel e elegivel.

Requisitos minimos:

- reviews marcadas no JSON-LD aparecem na pagina
- `aggregateRating.reviewCount` bate com dado visivel
- `ratingValue` fica entre 1 e 5
- `bestRating` e `worstRating` coerentes
- `LocalBusiness.url` deve ser a URL do perfil Avalia Solar ou decisao documentada
- site oficial da empresa deve ir em campo apropriado se visivel
- imagem deve ser crawlable

Subtasks:

1. revisar JSON-LD atual em empresa
2. validar casos com review e sem review
3. validar empresa sem endereco completo
4. validar empresa com logo ausente
5. criar testes de schema
6. validar em Rich Results Test

Testes obrigatorios:

```powershell
cd AB0-1-front
npm run typecheck
npm run lint
npm test -- --runInBand
```

Criterios de aceite:

- empresa com reviews gera AggregateRating e Review validos
- empresa sem reviews nao gera schema falso
- dados do schema sao visiveis
- host canonico com `www`

Prompt da task:

```text
Audite e corrija o JSON-LD de paginas de empresa. Garanta LocalBusiness, AggregateRating e Review apenas quando houver dados reais visiveis, normalize URLs com SITE.url/www, trate empresas sem reviews/endereco/logo e adicione testes de schema para casos com e sem avaliacao.
```

### TASK 2.5 - Criar testes automatizados de metadata por template

Prioridade: `P1`  
Tipo: testes/SEO regression  
Objetivo: evitar regressao em title, description, canonical, robots e schema.

Templates minimos:

- home
- categoria
- empresa
- local
- blog post
- filtro local noindex
- rota legada redirect
- rota inexistente 404/410

Requisitos minimos:

- testar `generateMetadata`
- testar canonical
- testar robots noindex quando query/filtro
- testar schema renderizado quando aplicavel
- testar fallback quando dados SEO customizados ausentes

Subtasks:

1. identificar estrategia de teste existente
2. criar fixtures de company/category/article
3. testar metadados de empresa
4. testar metadados de categoria
5. testar local filtered noindex
6. testar schema basico

Testes obrigatorios:

```powershell
cd AB0-1-front
npm test -- --runInBand
npm run typecheck
npm run lint
```

Criterios de aceite:

- regressao de canonical quebra teste
- regressao de noindex em filtros quebra teste
- regressao de schema basico quebra teste

Prompt da task:

```text
Crie uma suite de testes SEO para os templates publicos principais. Cubra generateMetadata, canonical, robots/noindex, fallback de SEO, schema JSON-LD e filtros locais noindex. Use fixtures realistas de company/category/article e garanta que regressao de canonical ou sitemap seja detectada.
```

## 7. Fase 3 - Sitemap, filtros e escala programatica

### TASK 3.1 - Dividir sitemap em sitemap index por tipo

Prioridade: `P2`  
Tipo: sitemap/escala  
Objetivo: preparar a plataforma para milhares de URLs sem perder controle.

Sitemaps desejados:

- `sitemap.xml` como index
- `sitemap-static.xml`
- `sitemap-companies.xml`
- `sitemap-categories.xml`
- `sitemap-local.xml`
- `sitemap-blog.xml`

Requisitos minimos:

- sitemap index referencia os sitemaps filhos
- cada sitemap filho contem apenas URLs canonicas indexaveis
- nenhuma URL com query
- nenhuma URL redirect/noindex/404
- `lastmod` coerente
- paginacao backend cobre todas as empresas ativas

Subtasks:

1. revisar `app/sitemap.ts`
2. escolher implementacao Next para sitemap index
3. criar sitemaps por tipo
4. paginar empresas ativas
5. aplicar quality gate em paginas locais
6. validar XML

Testes obrigatorios:

```powershell
cd AB0-1-front
npm run typecheck
npm run lint
```

Validacao:

```powershell
Invoke-WebRequest -Uri "https://www.avaliasolar.com.br/sitemap.xml" -UseBasicParsing
```

Criterios de aceite:

- sitemap index valido
- URLs problemáticas nao aparecem
- quantidade por tipo documentada

Prompt da task:

```text
Reestruture o sitemap para usar sitemap index e sitemaps filhos por tipo: static, companies, categories, local e blog. Garanta paginacao de empresas, exclusao de URLs noindex/redirect/query, lastmod coerente e valide XML final.
```

### TASK 3.2 - Implementar quality gate para paginas locais indexaveis

Prioridade: `P2`  
Tipo: programmatic SEO/local SEO  
Objetivo: evitar thin content em paginas locais.

Regra minima sugerida para indexar cidade/categoria:

- minimo 3 empresas relevantes
- H1 unico com cidade/UF
- texto local unico
- ItemList com empresas
- BreadcrumbList
- canonical proprio
- sem filtros de query
- dados de cobertura ou contexto local

Quando nao indexar:

- menos de 3 empresas
- conteudo duplicado entre cidades
- pagina apenas com filtros vazios
- cidade sem cobertura real

Arquivos provaveis:

- `AB0-1-front/app/companies/[id]/local-page.tsx`
- `AB0-1-front/app/sitemap.ts`
- endpoint backend de local rankings

Subtasks:

1. definir funcao `isLocalPageIndexable`
2. aplicar na metadata
3. aplicar no sitemap
4. aplicar no endpoint se ja existir `seo.indexable`
5. criar teste com cidade forte e cidade fraca

Testes obrigatorios:

```powershell
cd AB0-1-front
npm run typecheck
npm run lint
npm test -- --runInBand
```

Criterios de aceite:

- cidade fraca nao entra no sitemap
- cidade fraca recebe noindex ou nao e gerada
- cidade forte e self-canonical/indexavel

Prompt da task:

```text
Implemente quality gate para paginas locais indexaveis. Uma pagina local so deve indexar se tiver massa critica de empresas, conteudo unico, canonical proprio, H1 local e ItemList. Aplique a regra em metadata e sitemap, com testes para cidade forte e cidade fraca.
```

### TASK 3.3 - Governar filtros e parametros

Prioridade: `P2`  
Tipo: crawl budget/indexabilidade  
Objetivo: impedir que filtros criem lixo indexavel ou explosao de URLs.

Parametros a controlar:

- `q`
- `rating`
- `verified`
- `sort`
- `page`
- `distance`
- `radius`
- `lat`
- `lng`
- `category_ids`
- `project_types`
- `city`
- `state`

Requisitos minimos:

- queries filtradas nao entram no sitemap
- filtros profundos recebem `noindex, follow`
- paginacao tem canonical claro
- parametros invalidos nao retornam 500
- combinacoes excessivas podem retornar canonical base ou noindex

Subtasks:

1. criar allowlist de parametros
2. criar funcao `shouldNoindexSearchParams`
3. aplicar em categorias, locais e busca
4. documentar regra
5. criar testes

Testes obrigatorios:

```powershell
cd AB0-1-front
npm run typecheck
npm run lint
npm test -- --runInBand
```

Criterios de aceite:

- filtro profundo = noindex
- pagina base = indexavel quando cumpre regra
- parametro desconhecido nao quebra pagina

Prompt da task:

```text
Crie uma governanca central para search params SEO. Defina allowlist, noindex para filtros profundos, canonical base quando adequado, exclusao do sitemap e tratamento seguro de parametro invalido. Aplique em categorias, paginas locais e busca.
```

## 8. Fase 4 - AEO e GEO

### TASK 4.1 - Criar blocos "Resposta rapida" nos templates publicos

Prioridade: `P2`  
Tipo: AEO/conteudo/template  
Objetivo: preparar paginas para respostas diretas, AI Overviews e assistentes.

Templates alvo:

- categoria
- pagina local
- empresa
- blog
- diagnostico solar/orcamento se criada

Formato minimo:

- pergunta no H2/H3
- resposta direta em 40-70 palavras
- dados concretos quando possivel
- link interno para aprofundamento
- tabela ou lista quando aplicavel

Exemplos:

- "Como escolher uma empresa de energia solar residencial?"
- "Quanto custa instalar energia solar em [cidade]?"
- "O que significa empresa verificada no Avalia Solar?"
- "Quais documentos avaliar antes de contratar?"

Requisitos minimos:

- conteudo visivel no HTML
- sem depender apenas de accordion fechado se isso ocultar conteudo para crawler
- sem FAQPage schema como aposta principal
- linguagem clara e factual

Subtasks:

1. definir componente `AnswerBlock`
2. criar conteudo dinamico por template
3. aplicar em categoria e local primeiro
4. aplicar em empresa depois
5. testar mobile e desktop

Testes obrigatorios:

```powershell
cd AB0-1-front
npm run typecheck
npm run lint
```

Criterios de aceite:

- resposta aparece no HTML inicial
- nao prejudica layout
- melhora densidade sem criar texto duplicado excessivo

Prompt da task:

```text
Crie blocos AEO de resposta rapida para paginas de categoria, locais e empresa. Cada bloco deve ter pergunta clara, resposta direta de 40-70 palavras, dados concretos quando possivel e links internos. Nao use FAQPage como principal alavanca; foque conteudo visivel e util.
```

### TASK 4.2 - Criar paginas de metodologia, ranking e verificacao

Prioridade: `P2`  
Tipo: GEO/E-E-A-T/confianca  
Objetivo: criar ativos citaveis para IA, imprensa e usuarios.

Paginas sugeridas:

- `/metodologia`
- `/como-funciona-o-ranking`
- `/empresas-verificadas`
- `/criterios-de-avaliacao`
- `/dados-do-setor`

Requisitos minimos:

- explicar como empresas sao avaliadas
- explicar o que e verificacao
- explicar como reviews sao coletadas/moderadas
- explicar que Avalia Solar nao vende, nao instala e nao intermedia
- incluir ultima atualizacao
- incluir responsavel/editorial owner
- usar Organization/WebPage/BreadcrumbList

Subtasks:

1. definir IA das paginas
2. escrever copy factual
3. implementar rotas
4. adicionar links no footer/sobre/help
5. incluir no sitemap
6. validar metadata/schema

Testes obrigatorios:

```powershell
cd AB0-1-front
npm run typecheck
npm run lint
```

Criterios de aceite:

- paginas indexaveis com conteudo robusto
- fortalecem E-E-A-T
- podem ser citadas por IA e midia

Prompt da task:

```text
Crie paginas institucionais de metodologia, ranking, verificacao e criterios de avaliacao para fortalecer GEO/E-E-A-T. O conteudo deve ser factual, transparente, indexavel, com metadata, BreadcrumbList, links internos e declaracao clara do papel do Avalia Solar.
```

### TASK 4.3 - Criar `llms.txt` e mapa de conteudo para IA

Prioridade: `P2`  
Tipo: GEO/AI crawler readiness  
Objetivo: ajudar modelos e crawlers de IA a entenderem as paginas canonicas e a proposta da plataforma.

Arquivos provaveis:

- `AB0-1-front/public/llms.txt`
- `AB0-1-front/app/llms.txt/route.ts` se dinamico
- paginas institucionais

Requisitos minimos:

- URL canonica da home
- descricao curta da plataforma
- links para metodologia
- links para categorias principais
- links para dados/relatorios
- links para contato/imprensa
- sem dados privados

Subtasks:

1. definir conteudo do `llms.txt`
2. adicionar arquivo publico
3. validar acesso em `/llms.txt`
4. linkar em docs internos
5. revisar periodicamente

Testes obrigatorios:

```powershell
curl.exe https://www.avaliasolar.com.br/llms.txt
```

Criterios de aceite:

- `/llms.txt` retorna 200 text/plain
- contem URLs canonicas com `www`
- nao contem paginas privadas

Prompt da task:

```text
Crie um llms.txt publico para o Avalia Solar com descricao da plataforma, paginas canonicas, metodologia, categorias principais, dados do setor e contato. Garanta que nao exponha rotas privadas e que use URLs com https://www.avaliasolar.com.br.
```

### TASK 4.4 - Criar relatorios proprietarios de dados

Prioridade: `P2`  
Tipo: GEO/conteudo/autoridade  
Objetivo: gerar conteudo citavel e backlinks naturais.

Relatorios iniciais:

- "Ranking de empresas de energia solar por estado"
- "Categorias solares mais buscadas no Brasil"
- "Tempo medio de resposta de empresas solares"
- "Mapa de cobertura de energia solar por cidade"
- "Empresas verificadas: panorama por UF"

Requisitos minimos:

- dados reais ou metodologia clara quando estimado
- data de atualizacao
- fonte dos dados
- tabelas HTML
- graficos acessiveis
- download CSV quando possivel
- schema `Dataset` apenas se fizer sentido; lembrar que Dataset e mais util para Dataset Search do que Search comum

Subtasks:

1. escolher primeiro relatorio
2. definir dados disponiveis no backend
3. criar endpoint ou export estatico
4. criar pagina indexavel
5. adicionar internal links
6. criar assets sociais/PR

Testes obrigatorios:

```powershell
cd AB0-1-front
npm run typecheck
npm run lint
```

Criterios de aceite:

- pagina tem dados originais
- conteudo e citavel sem login
- tabelas sao crawlable

Prompt da task:

```text
Planeje e implemente o primeiro relatorio proprietario do Avalia Solar para GEO: ranking/cobertura/tempo de resposta por estado ou cidade. Use dados reais disponiveis, metodologia visivel, tabelas HTML, metadata forte, links internos e pagina indexavel.
```

## 9. Fase 5 - Performance e Core Web Vitals

### TASK 5.1 - Criar dashboard de Web Vitals por template

Prioridade: `P2`  
Tipo: observabilidade/performance  
Objetivo: medir LCP, INP e CLS reais por tipo de pagina.

Arquivos provaveis:

- `AB0-1-front/components/WebVitalsReporter.tsx`
- `AB0-1-front/lib/web-vitals.ts`
- endpoint analytics/PostHog
- dashboard interno/admin

Requisitos minimos:

- capturar template name
- capturar device class
- capturar metric name/value/rating
- capturar URL sem query sensivel
- agregar p75 por template

Templates:

- home
- category
- company
- local
- blog
- dashboard

Subtasks:

1. revisar reporter atual
2. adicionar dimensao de template
3. enviar para ferramenta analitica
4. criar dashboard ou query
5. definir alertas

Testes obrigatorios:

```powershell
cd AB0-1-front
npm run typecheck
npm run lint
```

Criterios de aceite:

- p75 por template visivel
- INP medido
- dados de usuario privado nao sao enviados

Prompt da task:

```text
Evolua o WebVitalsReporter para registrar LCP, INP e CLS por template de pagina. Inclua dimensoes seguras como template, device e path normalizado, envie para analytics/PostHog e documente como consultar p75 por template.
```

### TASK 5.2 - Reduzir payload de paginas de listagem

Prioridade: `P2`  
Tipo: performance/frontend  
Objetivo: reduzir HTML/RSC/JS de home, categoria e local.

Requisitos minimos:

- acima da dobra renderiza rapido
- listas grandes usam paginacao ou lazy loading
- imagens abaixo da dobra lazy
- scripts de terceiros nao bloqueiam interacao
- mobile mantem layout estavel

Subtasks:

1. medir tamanho atual por template
2. identificar componentes pesados
3. separar client components desnecessarios
4. reduzir dados serializados
5. usar suspense/lazy onde fizer sentido
6. medir depois

Testes obrigatorios:

```powershell
cd AB0-1-front
npm run typecheck
npm run lint
npm run build
```

Criterios de aceite:

- build sem regressao
- HTML transferido menor nos templates alvo
- LCP/INP nao pioram

Prompt da task:

```text
Otimize payload das paginas de listagem publicas. Meça home/categoria/local, identifique componentes client pesados, reduza dados serializados, aplique lazy/paginacao quando adequado e compare tamanho/metricas antes e depois.
```

## 10. Fase 6 - Imagens e assets indexaveis

### TASK 6.1 - Definir estrategia de imagens crawlable para schema

Prioridade: `P2`  
Tipo: image SEO/schema  
Objetivo: garantir que imagens usadas em schema e cards possam ser acessadas por crawlers quando isso for estrategico.

Contexto:

- CSV mostrou imagens ActiveStorage em dominio API bloqueadas
- imagens em schema precisam ser crawlable para rich results

Requisitos minimos:

- logo da marca crawlable
- imagens de blog crawlable
- imagem principal de empresa crawlable quando usada em schema
- filenames descritivos quando possivel
- alt text contextual

Subtasks:

1. mapear fontes de imagem
2. decidir proxy por `www` vs liberar API assets
3. revisar robots da API
4. revisar next/image remote patterns
5. validar URL Inspection em imagens criticas

Testes obrigatorios:

```powershell
curl.exe -I "URL_DA_IMAGEM_CRITICA"
```

Criterios de aceite:

- imagem usada em JSON-LD retorna 200 para crawler
- sem bloquear imagens criticas por robots
- sem expor arquivos privados

Prompt da task:

```text
Defina e implemente estrategia de imagens crawlable para SEO/schema. Mapeie imagens de logo, blog e empresa, decida entre proxy no dominio www ou ajuste de robots na API, garanta que imagens usadas em JSON-LD retornem 200 e nao exponham ativos privados.
```

## 11. Fase 7 - Autoridade externa e reputacao

### TASK 7.1 - Criar playbook de perfis externos

Prioridade: `P3`  
Tipo: autoridade/GEO/local SEO  
Objetivo: padronizar presenca em plataformas que IAs e usuarios consultam.

Plataformas iniciais:

- Google Business Profile
- G2
- Trustpilot
- Reclame Aqui
- Crunchbase
- LinkedIn Company Page
- Product Hunt quando produto estiver pronto

Requisitos minimos:

- NAP consistente
- descricao curta e longa padronizada
- categoria correta
- logo atualizado
- URL canonica
- links para metodologia/verificacao
- processo de resposta a reviews

Subtasks:

1. criar documento de dados oficiais da empresa
2. criar copy padrao curta/media/longa
3. criar checklist por plataforma
4. registrar status e responsavel
5. revisar mensalmente

Criterios de aceite:

- todos os perfis usam NAP consistente
- links apontam para `www`
- descricoes reforcam marketplace de comparacao e reviews

Prompt da task:

```text
Crie um playbook de perfis externos para Avalia Solar em GBP, G2, Trustpilot, Reclame Aqui, Crunchbase e LinkedIn. Padronize NAP, descricoes, categorias, URLs, logos, links de metodologia e rotina de resposta a reviews.
```

## 12. Sequencia recomendada de execucao

### Semana 1

1. TASK 0.1 - baseline de crawl
2. TASK 0.2 - matriz de templates
3. TASK 1.1 - corrigir `/quote-wizard`
4. TASK 1.2 - redirects de categorias legadas
5. TASK 1.5 - host canonico `www`

### Semana 2

1. TASK 1.3 - blindar filtros locais
2. TASK 1.4 - contrato review pages
3. TASK 2.1 - separar API client publico
4. TASK 2.2 - cache/ISR

### Semana 3

1. TASK 2.3 - BreadcrumbList global
2. TASK 2.4 - LocalBusiness/Review validation
3. TASK 2.5 - testes automatizados de metadata
4. TASK 3.3 - governanca de filtros

### Semana 4

1. TASK 3.1 - sitemap index
2. TASK 3.2 - quality gate local
3. TASK 5.1 - Web Vitals por template
4. TASK 6.1 - imagens crawlable

### Meses 2 e 3

1. TASK 4.1 - blocos AEO
2. TASK 4.2 - metodologia/ranking/verificacao
3. TASK 4.3 - `llms.txt`
4. TASK 4.4 - relatorios proprietarios
5. TASK 7.1 - autoridade externa

## 13. Definition of Done global

Uma fase so deve ser considerada concluida quando:

- tasks da fase estao implementadas
- testes automatizados relevantes passaram
- headers foram validados em producao quando aplicavel
- sitemap/robots foram revalidados
- novo crawl nao mostra regressao de status code
- documentacao foi atualizada
- Search Console foi usado para validar pelo menos as URLs criticas

## 14. Comandos de verificacao consolidada

Frontend:

```powershell
cd AB0-1-front
npm run typecheck
npm run lint
npm test -- --runInBand
npm run build
```

Backend:

```powershell
cd AB0-1-back
bundle exec rspec
```

Headers:

```powershell
curl.exe -I https://www.avaliasolar.com.br/
curl.exe -I https://www.avaliasolar.com.br/quote-wizard
curl.exe -I https://www.avaliasolar.com.br/categories/energia-solar-residencial
curl.exe -I https://www.avaliasolar.com.br/companies/372
curl.exe -I "https://www.avaliasolar.com.br/companies/energia-solar/ap/macapa?project_types=Comerciais"
```

Sitemap e robots:

```powershell
Invoke-WebRequest -Uri "https://www.avaliasolar.com.br/robots.txt" -UseBasicParsing
Invoke-WebRequest -Uri "https://www.avaliasolar.com.br/sitemap.xml" -UseBasicParsing
```

Busca de hardcodes:

```powershell
rg "https://avaliasolar\\.com\\.br" AB0-1-front
rg "quote-wizard" AB0-1-front AB0-1-back docs
rg "canonical" AB0-1-front/app
rg "noindex" AB0-1-front/app
```

## 15. Prompts rapidos por tipo de trabalho

### Prompt para auditoria antes de editar

```text
Antes de editar, investigue o estado atual da task [NOME]. Leia o discovery SEO de 2026-07-14, os arquivos provaveis listados na task e rode buscas com rg. Depois apresente somente: causa raiz, arquivos afetados, plano de alteracao, testes necessarios e riscos.
```

### Prompt para implementacao segura

```text
Implemente a task [NOME] seguindo os requisitos minimos e criterios de aceite do documento SEO_GEO_AEO_IMPLEMENTATION_TASKS_2026-07-14.md. Nao altere escopo fora da task. Preserve mudancas existentes do usuario. Rode os testes obrigatorios e reporte o resultado.
```

### Prompt para revisao de PR

```text
Revise este PR como code review tecnico de SEO/performance. Priorize bugs, regressao de indexabilidade, canonical errado, noindex indevido, schema enganoso, cache privado em pagina publica, sitemap com URL invalida e riscos de 500. Mostre achados com arquivo/linha.
```

### Prompt para validacao pos-deploy

```text
Valide em producao a task [NOME]. Use curl/Invoke-WebRequest para headers, abra URLs criticas, confira sitemap/robots, verifique metadata/canonical/schema no HTML e compare com os criterios de aceite. Nao mude codigo; gere apenas relatorio de validacao.
```

### Prompt para novo crawl

```text
Com base no novo CSV de crawl, compare contra o baseline de 2026-07-14. Mostre variacao em status codes, indexability, canonicalised, missing title, missing meta description, missing H1, URLs 404, URLs 500 e URLs no sitemap com problema. Classifique regressao, melhoria ou neutro.
```

## 16. Riscos se pular etapas

| Etapa pulada | Risco |
| --- | --- |
| Baseline | nao saber se melhorou ou piorou |
| Redirects legados | soft-404 e canonical para home continuam |
| Filtros noindex | explosao de URLs duplicadas |
| Cache publico | baixa escala, TTFB ruim e risco de timeout |
| Breadcrumb/schema | perda de clareza semantica e rich eligibility |
| Quality gate local | thin content em massa |
| Web Vitals RUM | otimizar no escuro |
| Conteudo GEO | IA nao tem material confiavel para citar |

## 17. Resultado esperado apos concluir P0 e P1

Indicadores alvo no proximo crawl:

| Indicador | Atual | Alvo P0/P1 |
| --- | ---: | ---: |
| URLs 500 publicas | 10 | 0 |
| URLs 404 publicas conhecidas | 1 | 0 ou decisao 410 |
| Canonical para home indevido | desconhecido | 0 |
| Paginas SEO com cache privado | observado em categoria/empresa | 0 |
| Review pages sem contrato | sim | 0 |
| Slugs legados sem redirect | sim | 0 |
| URLs filtradas indexaveis | risco | 0 |
| Templates sem BreadcrumbList | parcial | minimo rotas criticas cobertas |

## 18. Resultado esperado apos concluir P2

Indicadores alvo:

- sitemap index por tipo
- quality gate local ativo
- p75 CWV por template conhecido
- `llms.txt` publico
- paginas de metodologia/ranking/verificacao publicadas
- blocos AEO em categoria/local/empresa
- imagens criticas de schema crawlable
- conteudo proprietario inicial publicado

## 19. Backlog futuro

Itens fora do primeiro ciclo, mas importantes:

- integracao Search Console API para URL Inspection em lote
- monitoramento diario de sitemap vs status code
- dashboard de indexacao por template
- alertas para aumento de canonicalized/noindex/500
- relatorios de ranking local por cidade
- paginas comparativas programaticas `empresa-a-vs-empresa-b`
- pagina publica de reviews por empresa quando houver volume
- feed de dados para imprensa e parceiros
- estrategia de backlinks por dados proprietarios
