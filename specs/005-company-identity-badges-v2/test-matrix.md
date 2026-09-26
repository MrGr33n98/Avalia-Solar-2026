# Matriz de testes

| Camada | Caso | Estado |
|---|---|---|
| Rails model | Primária pertence às categorias da empresa | Planejado |
| Rails model | Categoria primária nula para legado | Planejado |
| Serializer | `identity.primary_category` tem id/nome/slug ou null | Planejado |
| Serializer | Status de verificação usa regra backend única | Planejado |
| Serializer | Commercial/distribution/recognition/trust independentes | Planejado |
| REST/GraphQL | Projeções mantêm contrato compatível | Planejado |
| Web | Identity card link acessível e estado null | Planejado |
| Web | Verificação não libera/rotula premium | Planejado |
| Web | Destaque, patrocínio, badge e ranking independentes | Planejado |
| Mobile | Perfil e lead usam categoria primária explícita | Planejado |
| Migration | Upgrade sem backfill arbitrário; rollback reversível | Planejado |
| E2E | Perfil, categoria, verificação, plano e reconhecimento | Planejado |

Nenhum teste foi executado nesta etapa de discovery.
