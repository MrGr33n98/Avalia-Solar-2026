# Critérios de aceite verificáveis

| ID | Gate | Evidência |
|---|---|---|
| AC01 | Card de referência ≥35% menor; alvo 280–340 px desktop quando conteúdo permitir | bounding boxes antes/depois |
| AC02 | 3 colunas em 840 px úteis; card único mantém largura equivalente; máximo 5 colunas | Playwright |
| AC03 | Mídia 128–152 px, sem corte/deformação; fallback estável | screenshots e testes |
| AC04 | Categoria, título acessível, fornecedor, reputação, verificação, preço, favoritos e CTA preservados quando válidos | testes de dados |
| AC05 | Não exibir parcelamento não confirmado; sem selo/nota ambíguos | testes de contrato |
| AC06 | Filtros, ordenação, tabs, navegação e autenticação preservados | E2E |
| AC07 | Catálogo e SmartEmptyCatalog mantêm variante default | regressão visual/funcional |
| AC08 | Sem overflow a 320 px; foco, touch 44 px, contraste e movimento reduzido | a11y / E2E |
| AC09 | Sem dependências ou requisições extras de layout; orçamento CWV documentado | comparação performance |
| AC10 | Lint, types, unit, integração, E2E e build aprovados | CI e logs |
| AC11 | Redução da seção ≥30% no cenário de referência, sem perda de conteúdo válido | captura e medida |
| AC12 | Sem duplicação/perda de analytics ou regressão conhecida | comparação de eventos |

Metas de geometria e performance são propostas, não resultados obtidos. Caso o conteúdo válido não caiba na altura-alvo, priorizar integridade e acessibilidade, registrar exceção.
