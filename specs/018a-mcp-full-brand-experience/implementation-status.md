# 018A — Incremento 1: hero institucional

Base: 93a8e2f55d7771e3c81e1ef3d33202b3cecde52e. Escopo exclusivamente público e de leitura. Sem merge/deploy.

- Contrato 1.0.0 preservado; campo opcional `hero_carousel` apenas no perfil detalhado.
- Flag nova `MCP_BRAND_PROFILE_HERO_ENABLED=true` necessária para a entrega do snapshot; padrão desligado. A elegibilidade comercial e `BRAND_HERO_CAROUSEL_ENABLED` continuam obrigatórias para os slides.
- Reutilização de BrandHero::PublicSnapshot; URL absoluta HTTPS via proxy do Active Storage.
- Card standalone: proporção 16:5, navegação manual, swipe, fallback, sem autoplay. A visualização interna da busca fica para o incremento seguinte a fim de proteger o orçamento de bundle.
- Testes de regressão escritos; execução CI, validação de bundle, homologação em host e versionamento de URI antes do rollout ainda pendentes.
- Busca list_integrators falha no ambiente atual; causa raiz exige logs do Rails. Não alterar SQL por hipótese.
- Próximos: portfólio, galeria, produtos, serviços, ferramentas adicionais, segurança, paridade entre superfícies e homologação mobile.

## Incremento 2 — hardening de rollout

- CI anterior verde (224 exemplos MCP, 0 falhas); os cinco bundles respeitaram o limite de 120 KiB.
- A URI de descoberta do perfil passa a v2 quando a flag 018A está ativa. V1 permanece legível para clientes antigos. Ambas resolvem o mesmo artefato HTML compilado; não se trata de dois builds independentes.
- Flag conectada ao compose de produção, staging, .env.example e workflow CD, com padrão false. Ativação efetiva depende do ambiente e aprovação posterior. Não modifica o rollout comercial existente.
- Testes de descoberta, leitura, kill switch e passagem da flag adicionados. CI deste incremento pendente.
- Search e Categories estavam em 119,4/119,8 KiB. A paridade do hero nesses bundles permanece pendente até otimização comprovada, sem elevar o limite.

## Incremento 3A — prévia pública de portfólio

- Flag independente `MCP_BRAND_PROFILE_PORTFOLIO_ENABLED=false` com passagem em compose e CD. Quando ativa, a descoberta do perfil usa a URI v2.
- Reuso de CompanyProject.published e DigitalAsset.published (status published + processing ready), gate projects_showcase, isolamento company_id, máximo 3 projetos com 1 imagem cada, ausência/falha/indisponibilidade distintas. URLs absolutas HTTPS somente nas origens configuradas no CSP.
- Card standalone responsivo com capacidade, localização, tecnologia, descrição e fallback de imagem. Preview parseado separadamente para não invalidar o perfil básico.
- Não equivale às tools list_company_projects/show_company_project: paginação, detalhes, galeria de cada projeto, busca interna, homologação e testes de imagem real seguem pendentes. Sem alterações em produção.
- Novos RSpec/Vitest escritos. CI e orçamento de bundles ainda precisam ser confirmados.

## Incremento 3B/4A — galerias limitadas

- Gate MCP de bc54d0d aprovado: 229 exemplos sem falhas; perfil 117,3 KiB gzip.
- Prévia de cada projeto passa a oferecer até 4 fotos publicadas/ready da própria empresa, com ampliação local. Não inclui ainda detalhe completo ou tools paginadas.
- Galeria institucional opcional: até 6 fotos do accessor público e 3 vídeos YouTube publicados, link externo via host; sem iframe de terceiros.
- Flag MCP_BRAND_PROFILE_GALLERY_ENABLED default false, integrada a compose/CD. URI v2 quando qualquer flag 018A estiver ativa.
- Allowlist de mídia HTTPS compartilhada, testes de estado/publicação/URLs/expansão escritos. CI deste commit pendente. Search/Categories não foram ampliados.

## Incremento 5A/6A — prévia de catálogo público

- Reutiliza Catalog::ShowcaseQuery, fonte existente da vitrine pública Web: até três produtos ativos próprios/vinculados e três serviços ativos.
- DTO reduzido a nome, descrição curta, categoria, imagem autorizada e link público validado. Não expõe preços, ofertas, contatos nem dados internos. Links de serviços restritos ao slug da empresa.
- Cards de produtos/serviços no perfil standalone, links para detalhes no Web, imagens com fallback. Flag MCP_BRAND_PROFILE_CATALOG_ENABLED=false.
- Prévia não substitui tools dedicadas de listagem/detalhes, paginação, galerias de produto/serviço ou filtros. Validar paridade de entitlements e catálogo público em staging antes de ativar.
- Testes adicionados; novo CI e limite 120 KiB ainda pendentes. Sem merge/deploy.
