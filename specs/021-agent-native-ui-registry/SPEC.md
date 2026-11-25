# Especificação funcional
## MVP W0–W7
Auditar e preservar as cinco superfícies existentes; consolidar tokens; criar componentes reutilizáveis inspirados no mcpcn; adaptar Search, Profile/Brand Hero/Catalog, Compare e Reputation; disponibilizar registry e playground interno local com documentação, fixtures e validação. Não criar novas ferramentas públicas para produtos/avaliações se não houver contratos; usar preview existente. Não remover fallback textual, recursos ou flags.

## Comportamento
Search: filtros coerentes, paginação por cursor, seleção persistente por ID, comparação 2–3 conforme contrato público. Categorias: seleção acessível e busca contextual. Profile: identidade, selo cadastral, hero 16:5 sem recorte indevido, catálogo e portfólio existentes. Compare: dados por critério, desconhecido explícito, fullscreen se host suportar, sem vencedor absoluto. Reputation: nota nula quando não houver avaliações, contagem, distribuição somente agregada aprovada. Evidence: origem e data quando fornecidas; limitações visíveis.

## Fora do MVP
Mapa, orçamento com envio, agenda, checkout, mensagens privadas, eventos, licenciamento público e composição generativa. Cada um requer contrato, política, consentimento, testes e feature flag. Propostas W8–W12 não são compromissos de deploy.

## Estados
Initial loading → ready/empty/error/offline; refreshing preserva dados válidos com indicação; ações indisponíveis ficam ocultas ou explicadas, não simulam sucesso; retries limitados; respostas antigas não sobrescrevem novas; fallback textual legível. Todos os modos dependem de capabilities reais do host.
