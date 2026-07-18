# SEO Technical Todo - Avalia Solar

Fonte analisada: `C:\Users\Bobi\Documents\Relatorio SEO Tecnico Interativo - Avalia Solar.csv`

Data da organizacao: 2026-07-18

## Resumo Executivo

| Metrica | Total |
| --- | ---: |
| URLs auditadas | 1.243 |
| Erros CRITICAL | 996 |
| Erros HIGH | 210 |
| Erros MEDIUM | 37 |
| TIMEOUT | 800 |
| 404 | 196 |
| 307 | 2 |
| URLs 200 | 245 |
| URLs 200 com resposta acima de 3s | 159 |
| URLs 200 com resposta acima de 10s | 67 |
| URLs indexaveis no relatorio | 1.009 |

Leitura principal: o problema mais critico e de crawl/renderizacao em massa, especialmente em rotas de empresas e paginas locais. Antes de ajustes finos de conteudo, precisamos garantir que as URLs indexaveis respondam, que URLs filtradas nao virem armadilha de crawl e que rotas privadas ou de acao nao sejam indexaveis.

## Status da Correcao Frontend

Atualizado em 2026-07-18:

- Concluido no codigo: `SEO-003`, `SEO-004`, parte critica de `SEO-001`, `SEO-002`, `SEO-005`, `SEO-008`, `SEO-009`, `SEO-010`, `SEO-011`, `SEO-012`.
- Pendente de nova auditoria pos-deploy: confirmar queda real de `TIMEOUT`, `404`, paginas privadas indexaveis e URLs filtradas no crawl.
- Pendente de backend/dados/conteudo: `SEO-006` e `SEO-007` precisam de dados melhores de empresas, decisao de redirects para slugs antigos e/ou enriquecimento editorial em paginas finas.

Mudancas implementadas:

- Sitemap agora remove query strings, deduplica entradas e descarta rotas privadas/de acao.
- Fetches usados por sitemap e paginas publicas ganharam timeout para evitar request pendurado.
- `robots.txt` bloqueia rotas privadas/de acao e parametros que geravam crawl traps.
- `/favorites`, `/profile`, `/login` e `/register` ganharam metadata `noindex, nofollow` via layout.
- `/companies/*/review`, `/claim` e `/quote` foram alinhadas para `noindex, nofollow`.
- Paginas locais filtradas que falham tentam carregar a canonical limpa antes de virar erro.
- Links internos filtrados em paginas locais foram marcados como `nofollow`.
- Blog e categoria retornam `noindex` em estados de artigo/categoria nao encontrados.
- Home reduziu timeout/retries da cache fallback para responder degradada em vez de travar.
- Criado comando `npm run seo:audit -- --max=50 --timeout=8000` para validar sitemap e status.

## Backlog Priorizado

### P0 - Critico

#### SEO-001 - Corrigir timeouts em massa nas rotas `/companies`

- Severidade: CRITICAL
- Evidencia: 800 TIMEOUTs no relatorio, sendo 782 em `/companies`.
- Impacto: Googlebot pode abandonar crawling, reduzir descoberta de paginas locais e interpretar instabilidade do site.
- Arquivos provaveis:
  - `app/companies/[id]/local-page.tsx`
  - `app/companies/[id]/[state]/page.tsx`
  - `app/companies/[id]/[state]/[city]/page.tsx`
  - `lib/api-public.ts`
  - `lib/api-client.ts`
- Tarefas:
  - Auditar chamadas SSR das paginas locais e de perfil para descobrir endpoints lentos ou sem timeout controlado.
  - Adicionar timeout, fallback e cache para chamadas de listagem local.
  - Evitar chamadas duplicadas durante `generateMetadata` e render da mesma pagina.
  - Garantir resposta degradada com conteudo minimo quando API externa falhar.
  - Medir TTFB local e em producao para URLs de amostra.
- Criterios de aceite:
  - URLs locais de amostra respondem HTTP 200 ou 404 valido em ate 3s.
  - Nenhuma URL indexavel de `/companies/energia-solar/...` retorna TIMEOUT em nova auditoria.
  - Logs mostram erro controlado em vez de request pendurado.

#### SEO-002 - Corrigir 404s em paginas locais com filtros

- Severidade: CRITICAL
- Evidencia: 196 URLs 404, todas em `/companies`; 165 em `/companies/energia-solar/...` com query params como `category_ids` e `project_types`.
- Impacto: desperdicam crawl budget e podem bloquear descoberta de paginas locais boas.
- Arquivos provaveis:
  - `app/companies/[id]/local-page.tsx`
  - `components/companies` e links internos que montam filtros
  - `components/filters/query.ts`
  - `lib/seo/search-params.ts`
- Tarefas:
  - Validar quais combinacoes de filtro devem existir como pagina navegavel.
  - Para combinacoes sem resultado, retornar pagina 200 noindex/follow com estado vazio util ou redirecionar para a canonical sem filtro.
  - Padronizar links internos para nao gerar combinacoes invalidas.
  - Bloquear ou noindexar parametros que nao devem ser rastreados.
- Criterios de aceite:
  - Filtros invalidos nao retornam 404 indexavel.
  - URLs com `category_ids` e `project_types` recebem canonical limpo.
  - Nova auditoria reduz 404 de `/companies/energia-solar` para zero ou para casos intencionais nao indexaveis.

#### SEO-003 - Revisar sitemap para remover URLs filtradas, privadas, duplicadas e instaveis

- Severidade: CRITICAL
- Evidencia: 1.009 URLs marcadas como indexaveis, incluindo rotas com TIMEOUT, 404, `/favorites`, `/profile`, `/review` e `/claim`.
- Impacto: sitemap envia sinais ruins para buscadores e aumenta crawling de paginas que nao deveriam ranquear.
- Arquivos provaveis:
  - `lib/seo/sitemap-builders.ts`
  - `app/sitemap.ts`
  - `app/sitemap-index.xml/route.ts`
  - `app/sitemaps/[section]/sitemap.xml/route.ts`
  - `app/robots.ts`
- Tarefas:
  - Conferir se o sitemap inclui URLs com query string.
  - Remover rotas privadas/de acao: `/favorites`, `/profile`, `/companies/*/review`, `/companies/*/claim`, `/quote`, fluxos autenticados.
  - Incluir apenas canonicals estaveis de empresas, categorias, paginas locais e conteudo editorial.
  - Criar teste automatizado para sitemap sem query string e sem rotas noindex.
- Criterios de aceite:
  - Sitemap nao contem URLs com `?`.
  - Sitemap nao contem `/review`, `/claim`, `/profile`, `/favorites`.
  - Todos os itens do sitemap retornam 200 em amostra automatizada.

#### SEO-004 - Garantir noindex correto para rotas privadas e de acao

- Severidade: HIGH
- Evidencia: `/favorites` e `/profile` retornam 307, aparecem como indexaveis; varias paginas `/review` e `/claim` aparecem no relatorio.
- Impacto: paginas sem valor organico competem com paginas publicas e consomem crawl budget.
- Arquivos provaveis:
  - `app/favorites/page.tsx`
  - `app/profile/page.tsx`
  - `app/companies/[id]/review/layout.tsx`
  - `app/companies/[id]/claim/layout.tsx`
  - `app/robots.ts`
- Tarefas:
  - Confirmar metadata `robots: { index: false, follow: false }` para rotas privadas.
  - Bloquear inclusao dessas rotas em sitemaps.
  - Se redirecionarem para login, garantir que o destino tambem nao seja tratado como pagina organica para essas URLs.
- Criterios de aceite:
  - Auditoria mostra `/favorites`, `/profile`, `/review`, `/claim` como nao indexaveis.
  - Nenhuma dessas URLs aparece no sitemap.

### P1 - Alto

#### SEO-005 - Melhorar performance das paginas 200 lentas

- Severidade: HIGH
- Evidencia: 159 URLs 200 acima de 3s; 67 acima de 10s. Piores exemplos passam de 29s.
- Impacto: piora rastreamento, experiencia e Core Web Vitals.
- Principais grupos:
  - Perfis de empresa em `/companies/*`
  - Paginas locais `/companies/energia-solar/*`
  - Categorias `/categories/*`
  - Fluxos `/companies/*/review` e `/companies/*/claim`
- Tarefas:
  - Identificar waterfalls SSR por rota com logs de tempo por chamada.
  - Cachear dados de empresas/categorias/local pages com `unstable_cache` ou camada existente.
  - Reduzir payload inicial de cards/listagens.
  - Adiar componentes nao criticos para client/lazy onde fizer sentido.
  - Definir SLA: TTFB abaixo de 1,5s para paginas indexaveis e abaixo de 3s para paginas complexas.
- Criterios de aceite:
  - Nenhuma pagina indexavel 200 acima de 10s em nova auditoria.
  - Pelo menos 90% das paginas 200 abaixo de 3s.

#### SEO-006 - Corrigir baixa profundidade de conteudo em paginas indexaveis

- Severidade: HIGH/MEDIUM
- Evidencia: 152 URLs 200 indexaveis com menos de 250 palavras.
- Impacto: paginas finas tem menor chance de ranquear e podem ser tratadas como baixa qualidade.
- Grupos afetados:
  - `/categories`
  - `/categories/*`
  - `/products`
  - `/companies`
  - `/companies/categorias/*`
  - perfis de empresas com dados incompletos
- Tarefas:
  - Criar blocos SEO reutilizaveis para categoria, localidade e tipo de projeto.
  - Adicionar FAQ especifica por categoria/local quando houver dados.
  - Para perfis pobres, exibir conteudo estrutural util: areas atendidas, servicos, garantias, criterios de avaliacao, CTA e FAQ.
  - Definir regra de noindex para paginas sem dados suficientes quando nao houver conteudo minimo.
- Criterios de aceite:
  - Paginas indexaveis principais com no minimo 300 palavras uteis.
  - Paginas sem conteudo suficiente ficam noindex/follow.

#### SEO-007 - Resolver rotas de empresa duplicadas ou canonicals inconsistentes

- Severidade: HIGH
- Evidencia: existem slugs duplicados com sufixos como `-2`, `-3` e 404 para versoes sem sufixo.
- Impacto: perda de autoridade por duplicacao, links internos quebrados e canonical confuso.
- Arquivos provaveis:
  - `app/companies/[id]/page.tsx`
  - helpers de path/canonical de empresa
  - fonte de dados/API de empresas
- Tarefas:
  - Auditar `buildCompanyPath` e regra de redirect permanente para slug canonical.
  - Criar mapa de redirect de slugs antigos para slug atual quando a empresa existir.
  - Para empresa removida/inativa, retornar 410 ou 404 nao indexavel com pagina util.
  - Corrigir links internos que apontam para slug antigo.
- Criterios de aceite:
  - Slugs antigos redirecionam 301/308 para canonical quando ha empresa equivalente.
  - Slugs inexistentes nao aparecem em sitemap nem links internos.

#### SEO-008 - Corrigir TIMEOUT da home

- Severidade: CRITICAL
- Evidencia: `https://www.avaliasolar.com.br/` aparece como TIMEOUT no relatorio.
- Impacto: risco maximo para SEO e conversao se reproduzivel.
- Arquivos provaveis:
  - `app/page.tsx`
  - `components/landing/LandingHero.tsx`
  - `lib/server/home-fallback-cache.ts`
  - chamadas de empresas/categorias destacadas
- Tarefas:
  - Verificar se foi incidente pontual ou falha sistemica.
  - Medir chamadas da home: hero, categorias, empresas e comparacao.
  - Garantir fallback rapido quando API de empresas/categorias falhar.
  - Reduzir dependencias bloqueantes no SSR da home.
- Criterios de aceite:
  - Home responde 200 em ate 2s em ambiente de producao.
  - Auditoria de repeticao nao registra TIMEOUT na home.

### P2 - Medio

#### SEO-009 - Corrigir paginas de blog com TIMEOUT

- Severidade: CRITICAL no relatorio, P2 por volume menor
- Evidencia: 3 posts de blog com TIMEOUT.
- Impacto: perda de trafego editorial e sinais ruins em paginas de conteudo.
- Arquivos provaveis:
  - `app/blog/[slug]/page.tsx`
  - `lib/api/blog.ts`
  - sitemap de blog em `lib/seo/sitemap-builders.ts`
- Tarefas:
  - Validar existencia dos slugs no backend.
  - Adicionar timeout/fallback para busca de artigo.
  - Remover do sitemap posts inexistentes ou nao publicados.
  - Garantir 404 rapido e nao indexavel para artigo inexistente.
- Criterios de aceite:
  - Posts publicados retornam 200 rapido.
  - Posts inexistentes retornam 404 rapido e fora do sitemap.

#### SEO-010 - Corrigir paginas de categorias com TIMEOUT e lentidao

- Severidade: HIGH/CRITICAL
- Evidencia: 14 TIMEOUTs em `/categories`; categorias 200 lentas, ex.: algumas acima de 16s a 20s.
- Arquivos provaveis:
  - `app/categories/[slug]/page.tsx`
  - `app/categories/[slug]/CategoryPageServer.tsx`
  - `app/categories/[slug]/CategoryPageClientV2.tsx`
  - `lib/seo/sitemap-builders.ts`
- Tarefas:
  - Cachear dados de categoria, banners e empresas.
  - Garantir fallback de categoria ativa quando API falhar.
  - Remover ou noindexar categorias sem conteudo/empresas suficientes.
  - Otimizar listagem inicial.
- Criterios de aceite:
  - Categorias indexaveis respondem 200 abaixo de 3s.
  - Categorias inexistentes saem do sitemap e retornam 404 rapido.

#### SEO-011 - Normalizar parametros SEO e canonical

- Severidade: HIGH
- Evidencia: relatorio contem URLs com `category_ids`, `project_types` e possivelmente outras combinacoes rastreaveis.
- Impacto: cria duplicacao e crawl traps.
- Arquivos provaveis:
  - `lib/seo/search-params.ts`
  - `components/filters/query.ts`
  - `app/companies/page.tsx`
  - `app/companies/categorias/[...categorySlugs]/page.tsx`
  - `app/categories/[slug]/page.tsx`
- Tarefas:
  - Definir allowlist de parametros que podem ser rastreados.
  - Aplicar canonical sem query para filtros exploratorios.
  - Usar `noindex, follow` para combinacoes filtradas.
  - Trocar links internos rastreaveis para caminhos canonicos quando possivel.
- Criterios de aceite:
  - URLs com filtros nao competem com canonicals.
  - Auditoria nao marca URLs filtradas como indexaveis.

### P3 - Baixo

#### SEO-012 - Criar monitoramento continuo de status SEO

- Severidade: operacional
- Impacto: evita regressao silenciosa.
- Tarefas:
  - Criar script que leia sitemap e valide status HTTP, tempo e robots.
  - Salvar relatorio resumido em CI ou job manual.
  - Falhar CI para sitemap com 404, TIMEOUT, query string ou rota privada.
- Criterios de aceite:
  - Comando local documentado.
  - Saida mostra contagem por status, top lentas e rotas proibidas.

#### SEO-013 - Revalidar relatorio apos cada lote

- Severidade: operacional
- Tarefas:
  - Rodar nova auditoria depois dos P0.
  - Comparar contagens: TIMEOUT, 404, 307, paginas lentas, paginas finas.
  - Atualizar este backlog com itens restantes.
- Criterios de aceite:
  - Reducao comprovada de CRITICAL de 996 para menos de 50 no primeiro ciclo.
  - Nenhum item P0 aberto sem decisao tecnica.

## Ordem Recomendada de Execucao

1. SEO-003 e SEO-004: limpar sitemap/noindex para parar de enviar sinais ruins.
2. SEO-001 e SEO-008: resolver timeouts estruturais em `/companies` e home.
3. SEO-002 e SEO-011: corrigir 404s e armadilhas de parametros filtrados.
4. SEO-005 e SEO-010: performance de paginas 200 lentas.
5. SEO-006 e SEO-007: conteudo fino e canonicals/redirects.
6. SEO-009, SEO-012 e SEO-013: blog, monitoramento e revalidacao.

## URLs de Amostra Para QA

### TIMEOUT

- `https://www.avaliasolar.com.br/`
- `https://www.avaliasolar.com.br/companies/energia-solar/ac/rio-branco`
- `https://www.avaliasolar.com.br/companies/energia-solar/ac/rio-branco?category_ids=64`
- `https://www.avaliasolar.com.br/blog/quanto-custa-nao-ter-energia-solar-veja-os-numeros`

### 404

- `https://www.avaliasolar.com.br/companies/energia-solar/ac/rio-branco?category_ids=75&project_types=Comerciais`
- `https://www.avaliasolar.com.br/companies/abp-engenharia-e-solucoes-em-energia-ltda`
- `https://www.avaliasolar.com.br/companies/canadian-solar-brasil`

### 307 / Privadas

- `https://www.avaliasolar.com.br/favorites`
- `https://www.avaliasolar.com.br/profile`

### Muito lentas 200

- `https://www.avaliasolar.com.br/companies/neocharge/review`
- `https://www.avaliasolar.com.br/companies/voltalia-brasil/review`
- `https://www.avaliasolar.com.br/companies/ase-automacao-e-servicos-eletricos-eireli`
- `https://www.avaliasolar.com.br/companies/energia-solar/pa/belem`
- `https://www.avaliasolar.com.br/categories/frotas-eletricas-mobilidade-urbana`
