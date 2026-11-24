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
