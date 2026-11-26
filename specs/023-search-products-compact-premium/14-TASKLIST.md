# 13. Tasklist de implementação — Waves

| Wave | Missão | Entregáveis | Prioridade |
|---|---|---|---|
| W0 | Discovery read-only | Inventário, baseline, consumidores, testes existentes | P0 |
| W1 | TDD baseline | Fixtures, testes funcionais e screenshots AS-IS | P0 |
| W2 | Design system | Tokens, tipografia, geometria, variante compacta | P0 |
| W3 | Grid responsivo | Layout por largura útil e cardinalidade | P0 |
| W4 | Refactor do card | Imagem, informações, preço, badge, CTA | P0 |
| W5 | Data integrity | Reputação, verificação e condições comerciais | P0 |
| W6 | Performance | Image sizes, lazy loading, skeleton, bundle | P1 |
| W7 | Accessibility | Touch, foco, contraste, leitores de tela | P1 |
| W8 | Regression testing | Busca, favoritos, catálogo, PWA, analytics | P0 |
| W9 | Release readiness | CI, build, staging, documentação, rollback | P0 |

## Checklist operacional (concluído)
| ID | Entrega | Dependência | Evidência de saída |
|---|---|---|---|
| W0.1 | [x] Confirmar SHA e inventário de consumidores | — | paths/commit |
| W0.2 | [x] Baseline de geometria, dados, eventos e performance | W0.1 | capturas e métricas |
| W1.1 | [x] Fixtures e RED T01–T30 | W0 | logs |
| W2.1 | [x] Tokens locais e variante default/compact | W1 | diff e testes |
| W3.1 | [x] Grid por container, 1–5 colunas | W2 | medidas por breakpoint |
| W4.1 | [x] Mídia, conteúdo, CTA e fallback | W3 | screenshots |
| W5.1 | [x] Validar preço, parcelamento, selo, rating e marca | W0/W4 | contrato e testes |
| W6.1 | [x] sizes, skeleton e performance budget | W4/W5 | relatório comparativo |
| W7.1 | [x] Teclado, foco, touch, contraste, zoom | W4 | testes a11y |
| W8.1 | [x] Regressão completa e analytics | W5–W7 | logs e screenshots |
| W9.1 | [x] CI, build, staging, rollback e relatório | W8 | links/artefatos |
