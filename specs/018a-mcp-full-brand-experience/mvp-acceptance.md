# 018A — Gate de aceite do MVP standalone

## Escopo
Perfil público em leitura, com hero institucional, prévias de projetos e suas fotos, galeria institucional, catálogo de produtos/serviços, FAQ, selos atribuídos e reputação agregada. Mantém as cinco ferramentas MCP originais. Não é a entrega das 15 ferramentas do GOAL completo.

## Gates antes de liberar
- [ ] CI Web & Backend, MCP Transport e Comparison verdes no SHA final.
- [ ] Cinco bundles <= 120 KiB gzip, sem aumento do teto.
- [ ] Teste de transporte real com todas as flags em ON e saída <= 32 KiB para fixture.
- [ ] Validar perfil real com mídia, produto, serviço, projeto e FAQ em staging; conferir ausência de rascunhos e recursos bloqueados.
- [ ] Validar perfil Free e perfil elegível: limites comerciais, capa, galeria e catálogo.
- [ ] Testar cache e descoberta de URI v2, rollback para flags OFF.
- [ ] Validar Web e clientes ChatGPT compatíveis em 320/375/390/768/1024 px; tema claro/escuro, scroll, swipe, zoom, teclado e erro de imagem.
- [ ] Reproduzir e resolver list_integrators com logs do runtime; não declarar busca corrigida sem evidência.
- [ ] Confirmar CSP de api.avaliasolar.com.br e demais origens necessárias, incluindo vídeo por link externo.
- [ ] Revisar documentação do conector/distribuição mobile.
- [ ] Aprovação explícita para merge, staging/deploy e ativação.

## Flags
Todas default false:
- MCP_BRAND_PROFILE_HERO_ENABLED
- MCP_BRAND_PROFILE_PORTFOLIO_ENABLED
- MCP_BRAND_PROFILE_GALLERY_ENABLED
- MCP_BRAND_PROFILE_CATALOG_ENABLED
- MCP_BRAND_PROFILE_TRUST_ENABLED

Hero também depende da flag de domínio BRAND_HERO_CAROUSEL_ENABLED e elegibilidade. Configurar em staging isolado; não alterar produção nesta PR.

## Limites e follow-up
A prévia não é o catálogo integral. Paginação, tools dedicadas, detalhe nativo, ledger de achievements, avaliações individuais (revisão de privacidade), materiais e telemetria Buyer Intent ainda não entregues. Busca/Categories não incluem a nova composição visual por restrição de bundle. Não reduzir segurança nem elevar teto para liberar.

Se o perfil expandido exceder 32 KiB, o backend omite seções opcionais em ordem explícita, preserva a identidade e informa a limitação. O limite rígido de 64 KiB continua no OutputValidator.
