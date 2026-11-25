# Contratos HTTP e segurança

| Endpoint existente | Semântica | Política proposta |
|---|---|---|
| GET /api/v1/states | Alias legado de UFs oficiais | GET anônimo allowlisted, preservar shape |
| GET /api/v1/companies/states | UFs oficiais | GET anônimo allowlisted |
| GET /api/v1/companies/cities?state=SC | Municípios oficiais SC | GET anônimo allowlisted, query validada |
| GET /api/v1/companies/locations | Presença/sedes de empresas elegíveis | Cache backend curto, não cache de taxonomia |
| GET /api/v1/companies/count | Contagem por filtros | Dinâmico, política existente ou no-store |
| GET /api/v1/companies | Listagem e cobertura | Política existente, não mudar nesta spec |
| /api/v1/states/:id/cities | Rota inexistente na auditoria | Remover chamada interna, não criar fallback artificial |

Para os GETs de taxonomia anônima válidos, proposta: `Cache-Control: public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800`, `ETag` coerente com conteúdo, `X-Locations-Version` aditivo quando compatível, `Vary` conforme representação e CORS efetivos. Resposta 304 sem body para If-None-Match correspondente; preservar headers coerentes. Não enviar cache público em erros, respostas autenticadas, com cookies de sessão/Set-Cookie ou variantes não controladas. Se a política de cookies impedir cache público, avaliar fetch anônimo credentials: omit somente nos endpoints oficiais após teste. Não ignorar cookies por conveniência.

Preservar status/payload existente para UF inválida ou ausente após inspeção; qualquer mudança incompatível exige versionamento e aprovação. Validar query parameters e evitar chaves de cache ambíguas; não usar regex ampla ou cache global. Testar direto e via proxy/edge, inclusive 304, HEAD se suportado (não habilitar cache por padrão), POST, path semelhante, URL encoded, auth, cookies, query duplicada, 500, CORS. Não cachear 404/500 no SW.
