# 018A — Incremento 1: hero institucional

Base: 93a8e2f55d7771e3c81e1ef3d33202b3cecde52e. Escopo exclusivamente público e de leitura. Sem merge/deploy.

- Contrato 1.0.0 preservado; campo opcional `hero_carousel` apenas no perfil detalhado.
- Flag nova `MCP_BRAND_PROFILE_HERO_ENABLED=true` necessária para a entrega do snapshot; padrão desligado. A elegibilidade comercial e `BRAND_HERO_CAROUSEL_ENABLED` continuam obrigatórias para os slides.
- Reutilização de BrandHero::PublicSnapshot; URL absoluta HTTPS via proxy do Active Storage.
- Card standalone: proporção 16:5, navegação manual, swipe, fallback, sem autoplay. A visualização interna da busca fica para o incremento seguinte a fim de proteger o orçamento de bundle.
- Testes de regressão escritos; execução CI, validação de bundle, homologação em host e versionamento de URI antes do rollout ainda pendentes.
- Busca list_integrators falha no ambiente atual; causa raiz exige logs do Rails. Não alterar SQL por hipótese.
- Próximos: portfólio, galeria, produtos, serviços, ferramentas adicionais, segurança, paridade entre superfícies e homologação mobile.
