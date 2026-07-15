# Baseline tecnico de crawl - internal_all_v2

Data do crawl: 2026-07-14  
Arquivo origem: `C:\Users\Bobi\Desktop\Avalia-gtm-data\internal_all_v2.csv`  
Dominio: `https://www.avaliasolar.com.br`  
Objetivo: congelar o estado tecnico antes das correcoes P0/P1 para comparar regressao em crawls futuros.

## Resumo numerico

| Indicador | Valor |
| --- | ---: |
| Total de linhas | 481 |
| HTML estimado por `Content Type` | 251 |
| URLs canonicalizadas | 174 |
| URLs com H1 ausente ou vazio em linhas HTML/200 | 93 |
| URLs com title ausente ou vazio em linhas HTML/200 | 51 |
| URLs com meta description ausente ou vazia em linhas HTML/200 | 51 |
| Erros 500 | 10 |
| Erros 404 | 1 |
| Candidatas com canonical para home | 50+ |

## Distribuicao por status code

| Status code | Quantidade | Leitura |
| --- | ---: | --- |
| 0 | 190 | Predominantemente bloqueios/no response em assets e robots. |
| 200 | 276 | Paginas e assets respondendo. |
| 307 | 4 | Redirect temporario; revisar se deveria ser permanente. |
| 404 | 1 | Rota publica quebrada. |
| 500 | 10 | Falhas criticas em paginas locais filtradas. |

## Distribuicao por indexability status

| Indexability status | Quantidade | Leitura |
| --- | ---: | --- |
| `Blocked by robots.txt` | 186 | Predomina em assets, mas imagens de schema devem ser revisadas. |
| `Canonicalised` | 174 | Alto; exige governanca de canonical por template. |
| vazio | 102 | Linhas sem classificacao explicita no CSV. |
| `Server Error` | 10 | Deve chegar a zero. |
| `No Response` | 4 | Revisar se sao assets irrelevantes ou paginas. |
| `Redirected` | 4 | Confirmar redirect permanente quando houver equivalente canonico. |
| `Client Error` | 1 | Corrigir rota ou remover descoberta. |

## URLs 404

| URL | Acao P0 |
| --- | --- |
| `https://www.avaliasolar.com.br/quote-wizard` | Redirecionar para fluxo valido ou recriar landing. |

## URLs 500

Todas as falhas 500 vieram do mesmo padrao: pagina local de `Macapa/AP` com filtros por tipo de projeto ou categoria.

| URL | Acao P0 |
| --- | --- |
| `https://www.avaliasolar.com.br/companies/energia-solar/ap/macapa?project_types=Comerciais` | Nunca retornar 500; se filtro falhar, retornar 200 controlado com `noindex, follow` ou erro vazio. |
| `https://www.avaliasolar.com.br/companies/energia-solar/ap/macapa?project_types=Condomínios` | Mesmo contrato. |
| `https://www.avaliasolar.com.br/companies/energia-solar/ap/macapa?project_types=Sistemas+Off-grid` | Mesmo contrato. |
| `https://www.avaliasolar.com.br/companies/energia-solar/ap/macapa?project_types=Industriais` | Mesmo contrato. |
| `https://www.avaliasolar.com.br/companies/energia-solar/ap/macapa?project_types=Rurais` | Mesmo contrato. |
| `https://www.avaliasolar.com.br/companies/energia-solar/ap/macapa?category_ids=65` | Mesmo contrato. |
| `https://www.avaliasolar.com.br/companies/energia-solar/ap/macapa?project_types=Carregadores+para+Veículos+Elétricos` | Mesmo contrato. |
| `https://www.avaliasolar.com.br/companies/energia-solar/ap/macapa?category_ids=64` | Mesmo contrato. |
| `https://www.avaliasolar.com.br/companies/energia-solar/ap/macapa?category_ids=76` | Mesmo contrato. |
| `https://www.avaliasolar.com.br/companies/energia-solar/ap/macapa?project_types=Residenciais` | Mesmo contrato. |

## Candidatas com canonical para home

Esse padrao e ruim quando a URL tem intencao propria. A regra correta e: redirect 301 para equivalente real, `noindex, follow` para pagina utilitaria, ou 404/410 quando nao existir.

| Padrao | Exemplos | Decisao recomendada |
| --- | --- | --- |
| Review de empresa | `/companies/weg/review`, `/companies/voltalia-brasil/review`, `/companies/intelbras/review` | `noindex, follow`; opcional canonical para pagina da empresa depois de refatorar para server metadata. |
| Claim de empresa | `/companies/930/claim`, `/companies/470/claim`, `/companies/942/claim` | `noindex, follow` ou exigir login com rota utilitaria fora do sitemap. |
| Categoria legada | `/categories/energia-solar-rural-agronegocio`, `/categories/monitoramento-om`, `/categories/baterias-armazenamento-energia`, `/categories/carport-solar-coberturas-solares`, `/categories/inversores` | 301 para slug novo canonico. |
| Auth/utilitarias | `/login`, `/register`, `/login?redirect=%2Fprofile`, `/dmca` | `noindex, follow` quando publico; nao canonicalizar para home. |
| Navegacao publica | `/search`, `/compare`, `/categories` | Decisao por template: indexavel com conteudo proprio ou `noindex, follow`. |

## Checklist de regressao para o proximo crawl

- [ ] Total de erros 500 em URL publica igual a `0`.
- [ ] `/quote-wizard` nao aparece mais como 404.
- [ ] Slugs legados de categoria retornam redirect permanente direto para slug novo.
- [ ] Paginas `/companies/{empresa}/review` nao canonicalizam mais para home.
- [ ] URLs com filtros profundos retornam `noindex, follow`.
- [ ] Sitemap contem apenas URLs canonicas, indexaveis e com status 200.
- [ ] Nenhuma URL indexavel usa canonical da home.
- [ ] Paginas principais tem title, description e H1 preenchidos.
- [ ] Host canonico em canonical/schema usa `https://www.avaliasolar.com.br`.
- [ ] Imagens declaradas em schema sao acessiveis para crawlers.

## Definition of Done do baseline

Este baseline esta aprovado quando um novo crawl conseguir comparar, no minimo:

- contagem por status code
- contagem por indexability status
- lista de 404
- lista de 500
- lista de URLs canonicalizadas para home
- lista de paginas indexaveis sem title, description ou H1
