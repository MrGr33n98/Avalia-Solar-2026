# 1. Diagnóstico executivo

Consegui localizar no repositório do Avalia Solar o componente específico responsável pela apresentação dos produtos na busca. Portanto, já temos evidências no código, além das duas capturas de tela.

| Dimensão | Diagnóstico | Prioridade |
|---|---|---|
| Geometria dos cards | Dimensões excessivas | P0 |
| Área da imagem | Desproporcional ao conteúdo | P0 |
| Densidade informacional | Baixa | P0 |
| Distribuição das colunas | Ineficiente em determinadas larguras | P0 |
| Espaçamento vertical | Excessivo | P1 |
| Hierarquia tipográfica | Necessita refinamento | P1 |
| Aproveitamento da tela | Insuficiente | P0 |
| Responsividade | Dependente dos breakpoints da viewport | P1 |
| Consistência entre produtos | Necessita padronização | P1 |
| Microinterações | Animações mais intensas que o necessário | P2 |
| Performance | Oportunidades de otimização a validar | P1 |
| Experiência premium | Abaixo do padrão desejado | P0 |
| Integridade das informações comerciais | Inconsistências identificadas no código | P0 |

**Minha proposta é reduzir aproximadamente entre 35% e 50% da altura do card vertical no desktop**, sem eliminar informações relevantes ou simplesmente diminuir indiscriminadamente o tamanho das fontes.

---

# 2. Inventário técnico — arquitetura AS-IS

A consulta ao GitHub identificou os seguintes componentes no snapshot do commit `408ea189738be1500500f1adcd294a9df2b83607`:

| Arquivo | Responsabilidade | Escopo |
|---|---|---|
| [SearchPageClient.tsx](https://github.com/MrGr33n98/Avalia-Solar-2026/blob/408ea189738be1500500f1adcd294a9df2b83607/AB0-1-front/app/search/SearchPageClient.tsx) | Organização dos resultados, grid e filtros | Principal |
| [ProductCardEnhanced.tsx](https://github.com/MrGr33n98/Avalia-Solar-2026/blob/408ea189738be1500500f1adcd294a9df2b83607/AB0-1-front/components/search/ProductCardEnhanced.tsx) | Card específico dos produtos na busca | Principal |
| [ProductCard.tsx](https://github.com/MrGr33n98/Avalia-Solar-2026/blob/408ea189738be1500500f1adcd294a9df2b83607/AB0-1-front/components/ProductCard.tsx) | Card utilizado em outras superfícies do marketplace | Referência e regressão |
| [EnterpriseSearchPagination.tsx](https://github.com/MrGr33n98/Avalia-Solar-2026/blob/408ea189738be1500500f1adcd294a9df2b83607/AB0-1-front/components/search/EnterpriseSearchPagination.tsx) | Paginação das empresas, imediatamente acima dos produtos | Secundário |
| `FavoriteButton` | Controle de favoritos | Preservar |
| `buildProductPath` | Navegação e URL dos produtos | Preservar |
| `SearchFilters` | Filtragem dos resultados | Preservar |

**Descoberta importante:** existem dois componentes distintos de produtos. Não devemos alterar indiscriminadamente o `ProductCard.tsx` global para resolver o problema da busca. O principal alvo é o `ProductCardEnhanced.tsx`, juntamente com o grid de `SearchPageClient.tsx`.

Isso reduz o risco de regressão nas Brand Pages, no catálogo e nas demais superfícies do marketplace.

### 2.1. Dependências compartilhadas

Uma segunda consulta ao código revelou que o `ProductCardEnhanced` também é utilizado em:

- `CatalogClient.tsx`
- `SmartEmptyCatalog.tsx`

Portanto, a compactação deve ser implementada por uma variante explícita, como `density="compact"`, inicialmente habilitada apenas na busca. Não devemos alterar o comportamento padrão dos demais consumidores do componente.

---

# 3. Inventário geométrico — AS-IS × TO-BE

As dimensões atuais são estimadas pelas capturas de tela. Os valores propostos são metas em CSS pixels, que deverão ser validadas no navegador com zoom de 100%.

| Elemento | AS-IS atual | TO-BE proposto | GAP |
|---|---:|---:|---|
| Largura do card observado | ~413 px | 240–280 px | Reduzir |
| Altura do card observado | ~529 px | 280–340 px | Reduzir até 47% |
| Área reservada à imagem | ~310 px | 128–152 px | Reduzir ~50% |
| Proporção da imagem | 4:3 | Altura controlada | Desacoplar da largura |
| Colunas na tela apresentada | 2 | 3 | +50% de capacidade |
| Gap entre cards | 16 px | 12 px | −25% |
| Padding do conteúdo | 16 px | 12 px | −25% |
| Distância entre seções | 40 px | 20–24 px | −40% a 50% |
| Margem do cabeçalho da seção | 16 px | 12 px | −25% |
| Border radius | 12 px | 8 px | Refinamento |
| Espaçamento entre informações | 4–16 px | 4–8 px | Padronizar |
| Altura do título | Mínimo de 40 px | Dinâmica | Eliminar reserva desnecessária |
| Botão de detalhes | 40 px no código | 36 px desktop / 44 px touch | Compactar com acessibilidade |
| Sombra | Normal + elevada no hover | Sutil | Reduzir ruído visual |
| Animação hover | Elevação + zoom | Alteração de borda | Simplificar |

O maior ganho não virá da redução da tipografia, mas da **eliminação do espaço improdutivo e do controle da geometria da imagem**.

## W0 — evidência a coletar
- Confirmar SHA em produção e SHA da branch alvo; registrar diferenças.
- Medir bounding boxes, CSS computado, gap, padding, altura de mídia e largura útil, com zoom 100%.
- Inventariar imports/consumidores, API, eventos, fixtures, scripts e estilos globais.
- Capturas originais: [AS-IS 1](assets/as-is-01.png) e [AS-IS 2](assets/as-is-02.png).
- Salvar evidências com data, ambiente, viewport, DPR e commit. Não confundir estimativa de screenshot com medição CSS.
