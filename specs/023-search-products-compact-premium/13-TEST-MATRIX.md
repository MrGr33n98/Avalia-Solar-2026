## 12.2. Visual Regression Testing — Playwright

| Resolução | Superfície |
|---|---|
| 320 × 568 | Mobile compacto |
| 360 × 800 | Android |
| 375 × 812 | iPhone |
| 390 × 844 | PWA |
| 430 × 932 | Mobile grande |
| 768 × 1024 | Tablet |
| 1024 × 768 | Notebook |
| 1280 × 800 | Desktop compacto |
| 1440 × 900 | Desktop |
| 1920 × 1080 | Full HD |
| 2560 × 1440 | QHD |

Também devem ser verificadas as larguras do container com e sem sidebar, diferentes níveis de zoom e estados de autenticação.

## Matriz adicional
| Dimensão | Cobertura |
|---|---|
| Cardinalidade | 0, 1, 2, 3, 4, 8, 24 |
| Container | com/sem sidebar e limites de coluna ±1 px |
| Navegação | Todos, Produtos, filtros, ordenação, voltar/avançar |
| Auth | visitante, autenticado; favoritos ativo/inativo, falha de API |
| Dados | imagem ausente/quebrada, título longo, marca e fornecedor distintos, preço ausente, nota e selo |
| Acessibilidade | teclado, touch, zoom 200%, movimento reduzido, contraste, nome acessível |
| Regressão | catálogo, SmartEmptyCatalog, Brand Pages, analytics |

Referência: T01–T30 em [11-TDD-STRATEGY.md](11-TDD-STRATEGY.md). Fixtures sintéticas somente nos testes, jamais na produção.
