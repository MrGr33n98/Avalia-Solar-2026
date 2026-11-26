# AVALIA SOLAR — SPEC 023 (proposta)
## Search Product Discovery · Compact Premium UI/UX A+++

**Web App · PWA · Responsive Design · Design-Driven Development · TDD · Performance-first · Zero Regression**

**Modo atual:** diagnóstico e auditoria read-only.

Entendi o problema. Não se trata especificamente do produto da GoodWe, mas da arquitetura de apresentação de **todos os produtos retornados pelo mecanismo de busca do Avalia Solar (`/search`)**, independentemente da marca, categoria, palavra-chave ou quantidade de resultados.

O card atual utiliza uma geometria mais próxima de uma vitrine de e-commerce tradicional do que de uma interface de descoberta de produtos. Isso prejudica a densidade informacional, a velocidade de navegação e a percepção de qualidade da plataforma.

O objetivo é tornar essa seção mais compacta, sofisticada e funcional, seguindo uma linguagem visual inspirada em **IBM Carbon, Swiss Design e interfaces enterprise de alta densidade**, preservando as informações e funcionalidades existentes.

---

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

---

# 4. Root Cause Analysis — causas raiz

## RC-01 — Proporção da imagem vinculada à largura do card

**Confirmado no código.**

Em `ProductCardEnhanced.tsx`, linha 32:

```tsx
<div className="relative aspect-[4/3] bg-white p-5">
```

O problema é que, quanto maior a largura disponível para o card, maior será também a altura da imagem.

Uma imagem dentro de um card de aproximadamente 413 px de largura acaba reservando aproximadamente 310 px de altura.

**Solução proposta:**

```tsx
<div className="relative h-[136px] overflow-hidden bg-white">
```

A altura poderá variar responsivamente dentro de limites estabelecidos, sem crescer indiscriminadamente com o grid.

**Prioridade:** P0.

## RC-02 — Grid dependente da viewport, não do espaço disponível

**Confirmado no código.**

Em `SearchPageClient.tsx`, linha 642:

```tsx
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
```

Atualmente, o grid alterna entre uma, duas e quatro colunas. Não existe uma etapa intermediária de três colunas.

Além disso, a sidebar ocupa 280 px, mas os breakpoints são definidos pela largura da viewport, não pela largura efetivamente disponível para os produtos.

**Solução proposta:**

```css
.search-products-grid {
  display: grid;
  grid-template-columns:
    repeat(auto-fill, minmax(min(100%, 240px), 1fr));
  gap: 12px;
}
```

O uso de `auto-fill`, associado ao dimensionamento máximo dos cards quando necessário, evita que um único produto ocupe toda a largura disponível.

**Prioridade:** P0.

## RC-03 — Acúmulo de espaçamentos verticais

O componente possui diversos espaçamentos independentes:

```tsx
p-4
pt-2
mt-2
mt-1
mt-3
mt-4
min-h-10
mt-auto
```

Esses valores, somados ao tamanho da imagem, produzem um card excessivamente alto.

**Solução:** estabelecer uma escala de espaçamento específica para a variante compacta, utilizando principalmente 4, 8 e 12 px.

## RC-04 — Animações visualmente excessivas

Atualmente:

```tsx
hover:-translate-y-1
hover:shadow-lg
group-hover:scale-105
transition-all
```

Não é necessário combinar elevação, ampliação de imagem e sombras intensas em uma interface que prioriza descoberta e comparação.

**Solução:** transições de cor e borda entre 120 e 160 ms, respeitando `prefers-reduced-motion`.

## RC-05 — Reserva excessiva entre as seções

Em `SearchPageClient.tsx`:

```tsx
<div className="space-y-10">
```

Isso representa 40 px de separação entre blocos como Empresas, Produtos e Avaliações.

A paginação imediatamente anterior também utiliza `mt-6`, `py-4` e `gap-4`, aumentando a distância até os produtos.

**Solução:** reduzir o espaçamento específico ao redor da seção de produtos. Alterações na paginação das empresas devem ser tratadas separadamente para não ampliar desnecessariamente o escopo.

## RC-06 — Informações comerciais sem fonte explícita

Durante a auditoria, identifiquei um problema além da geometria.

O componente da busca apresenta automaticamente:

```tsx
10x de {price / 10} sem juros
```

Isso acontece sempre que existe um preço válido, sem consultar uma condição comercial específica nesse trecho.

No `ProductCard.tsx` global, existe ainda outra inconsistência: o cálculo divide o preço por 12, mas o texto apresenta 10 parcelas.

Também foram identificados os seguintes pontos:

| Informação | Comportamento atual | Comportamento necessário |
|---|---|---|
| Parcelamento | Calculado automaticamente | Exibir somente condição comercial comprovada |
| Nota | Proveniente da empresa | Identificar como avaliação da empresa |
| Selo verificado | Proveniente da empresa | Não sugerir certificação do produto |
| Marca | Fallback para nome da empresa | Distinguir fabricante de fornecedor quando necessário |
| Avaliações | Exibe `1 avaliações` | Corrigir singular e plural |
| Nota decimal | `3.7` | Localizar para `3,7` |

Para uma plataforma de reputação e confiança, esses pontos são tão importantes quanto a aparência visual.

---

# 5. GAP Analysis consolidada

| ID | GAP | Causa raiz | Solução | Impacto | Prioridade |
|---|---|---|---|---|---|
| G01 | Card muito largo | Grid fixo | Grid adaptativo | Alto | P0 |
| G02 | Card muito alto | Aspect ratio 4:3 | Imagem com altura controlada | Alto | P0 |
| G03 | Espaço branco excessivo | Imagem e paddings | Media container compacto | Alto | P0 |
| G04 | Ausência de três colunas | Breakpoints atuais | Container-responsive | Alto | P0 |
| G05 | Distância entre informações | Margens independentes | Density tokens | Alto | P1 |
| G06 | Distância entre seções | `space-y-10` | Espaçamento contextual | Médio | P1 |
| G07 | Hierarquia tipográfica | Pesos e tamanhos variados | Typography scale | Médio | P1 |
| G08 | CTA ocupa área excessiva | Layout vertical | CTA compacto | Médio | P1 |
| G09 | Hover exagerado | Zoom e elevação | Microinterações sutis | Médio | P2 |
| G10 | Imagem quebrada | Sem tratamento explícito de erro no card de busca | Fallback resiliente | Alto | P1 |
| G11 | Título longo truncado | `line-clamp-2` | Acesso ao título completo | Médio | P1 |
| G12 | Parcelamento presumido | Valor hardcoded | Condições comerciais reais | Crítico | P0 |
| G13 | Ambiguidade da reputação | Rating da empresa no produto | Identificação semântica | Alto | P0 |
| G14 | Risco de regressão | Componente compartilhado | Variante isolada | Alto | P0 |
| G15 | Imagens potencialmente superdimensionadas | `sizes` baseado na viewport | Ajustar ao grid efetivo | Médio | P1 |
| G16 | Risco de layout shift | Alterações de carregamento | Skeleton com geometria equivalente | Alto | P1 |
| G17 | Densidade inconsistente | Ausência de variante compacta | Contrato reutilizável | Alto | P1 |
| G18 | Cobertura automatizada | Ainda não inventariada integralmente | Auditoria e ampliação dos testes | Alto | P0 |

---

# 6. Design System — especificação TO-BE

## 6.1. Anatomia do novo card compacto

A representação abaixo demonstra a organização proposta. Os dados comerciais são ilustrativos, baseados na captura apresentada.

```text
┌──────────────────────────────┐
│  ✓ Verificado            ♡   │
│                              │
│        IMAGEM PRODUTO        │  136 px
│                              │
├──────────────────────────────┤
│ Baterias e armazenamento    │
│ Kit Solar Fotovoltaico       │
│ On-Grid 10,12kWp + Wallbox... │
│ GoodWe Brasil                │
│ ★ 3,7 (1 avaliação da empresa)│
│                              │
│ R$ 28.000,00                 │
│ Parcelamento, quando válido  │
│ ┌──────────────────────────┐ │
│ │     Ver detalhes     →   │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

A proposta preserva a categoria, identificação do produto, fornecedor, reputação, verificação, preço, condições comerciais válidas, favoritos e navegação.

## 6.2. Tipografia

| Elemento | Desktop | PWA | Peso |
|---|---:|---:|---:|
| Título da seção Produtos | 18 px | 16 px | 600 |
| Contador de produtos | 12 px | 12 px | 400 |
| Categoria | 11 px | 11 px | 500 |
| Nome do produto | 14 px | 14 px | 600 |
| Marca/fornecedor | 12 px | 12 px | 400–500 |
| Nota | 12 px | 12 px | 600 |
| Quantidade de avaliações | 11–12 px | 12 px | 400 |
| Preço | 18 px | 16–18 px | 700 |
| Parcelamento | 11–12 px | 12 px | 400 |
| Badge | 10–11 px | 11 px | 600 |
| CTA | 12 px | 13 px | 600 |

Manter a família tipográfica oficial do Avalia Solar. Não introduzir novas fontes ou dependências para essa implementação.

## 6.3. Paleta visual proposta

A implementação deve reutilizar os tokens oficiais existentes, priorizando os seguintes valores de referência:

| Token | Cor | Aplicação |
|---|---|---|
| Surface | `#FFFFFF` | Fundo do card |
| Background | `#F4F6F8` | Fundo da página |
| Border | `#DDE1E6` | Contorno |
| Text primary | `#09172F` | Nome e preço |
| Text secondary | `#475569` | Informações auxiliares |
| Brand blue | `#0F62FE` | Ações e foco |
| Verified background | `#D1FAE5` | Fundo do selo |
| Verified text | `#047857` | Texto do selo |
| Rating | `#F59E0B` | Estrela |
| Hover surface | `#EDF5FF` | Estados interativos |

Sem gradientes desnecessários, glassmorphism, sombras pesadas ou novos elementos decorativos.

## 6.4. Design tokens de densidade

```css
.search-product-card-compact {
  --card-padding: 12px;
  --card-radius: 8px;
  --card-gap: 12px;

  --media-height: 136px;
  --media-padding: 8px;

  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 12px;

  --title-size: 14px;
  --title-line-height: 18px;

  --price-size: 18px;
  --price-line-height: 24px;

  --cta-height: 36px;
  --transition-duration: 150ms;
}
```

Esses tokens devem ser mapeados ao design system existente, evitando a criação de um sistema paralelo.

---

# 7. Layout responsivo — Web App e PWA

O número de colunas deve ser determinado pela largura útil da seção, e não simplesmente pela largura do monitor.

| Largura útil do container | Colunas | Comportamento |
|---|---:|---|
| Até 491 px | 1 | Card compacto |
| 492–743 px | 2 | Grid compacto |
| 744–995 px | 3 | Grid premium |
| 996–1.247 px | 4 | Grid enterprise |
| Acima de 1.248 px | Até 5 | Respeitar limite visual |

### Na sua tela atual

A área de resultados possui aproximadamente 840 px de largura na captura.

**Antes:**

```text
┌────────────────┐ ┌────────────────┐
│                │ │                │
│    Produto     │ │ Espaço vazio   │
│                │ │                │
│                │ │                │
│                │ │                │
│                │ │                │
└────────────────┘ └────────────────┘
```

**Depois:**

```text
┌────────────┐ ┌────────────┐ ┌────────────┐
│  Produto   │ │  Produto   │ │  Produto   │
│            │ │            │ │            │
│  Dados     │ │  Dados     │ │  Dados     │
│  Preço     │ │  Preço     │ │  Preço     │
└────────────┘ └────────────┘ └────────────┘
```

Quando houver apenas um resultado, o card permanecerá com a geometria equivalente à de uma coluna normal. Não serão criados cards vazios nem produtos fictícios para preencher a seção.

---

# 8. PRD — Product Requirements Document

| Requisito | Descrição | Critério de aceite |
|---|---|---|
| RF-01 | Compactar todos os cards de produtos da busca | Independente de marca ou categoria |
| RF-02 | Preservar informações válidas | Nenhuma informação comercial comprovada removida |
| RF-03 | Preservar favoritos | Adicionar e remover normalmente |
| RF-04 | Preservar filtros | Categoria, marca, preço, região e verificação |
| RF-05 | Preservar navegação | Mesma URL de destino do produto |
| RF-06 | Grid responsivo | Adaptar à largura útil |
| RF-07 | Exibir imagens integralmente | Sem deformação ou cortes indevidos |
| RF-08 | Tratar ausência de imagem | Placeholder na mesma geometria |
| RF-09 | Tratar ausência de preço | Preço sob consulta |
| RF-10 | Preservar ordenação | Ranking atual permanece intacto |
| RF-11 | Preservar abas | Todos e Produtos |
| RF-12 | Identificar origem da reputação | Não atribuir nota da empresa ao produto |
| RF-13 | Parcelamento confiável | Somente condições comerciais válidas |
| RF-14 | Compatibilidade PWA | Sem overflow horizontal |
| RF-15 | Preservar analytics | Sem perda ou duplicação de eventos existentes |
| RF-16 | Isolar variante compacta | Demais superfícies inalteradas |
| RF-17 | Acessibilidade | Teclado, leitores de tela e touch |
| RF-18 | Suportar nomes extensos | Conteúdo completo acessível |

---

# 9. Arquitetura de componentes proposta

```text
SearchPageClient
│
├── SearchHero
├── SearchFilters
│
└── SearchResults
    │
    ├── CompaniesSection
    │
    ├── SearchProductsSection
    │   │
    │   ├── SearchSectionHeader
    │   │
    │   └── SearchProductsGrid
    │       │
    │       └── ProductCardEnhanced
    │           density="compact"
    │           │
    │           ├── ProductMedia
    │           ├── VerificationBadge
    │           ├── FavoriteButton
    │           ├── ProductIdentity
    │           ├── ProductReputation
    │           ├── ProductPricing
    │           └── ProductDetailsCTA
    │
    └── ReviewsSection
```

Essa árvore representa responsabilidades propostas, não uma exigência de criar um arquivo React para cada elemento. O agente deve evitar sobrearquitetura.

### Contrato de variante

```tsx
interface ProductCardEnhancedProps {
  product: Product;
  favorite: boolean;
  onToggleFavorite: () => void;
  density?: 'default' | 'compact';
}
```

Na busca:

```tsx
<ProductCardEnhanced
  product={product}
  favorite={productFavorites.has(product.id)}
  onToggleFavorite={handleFavorite}
  density="compact"
/>
```

Nas outras superfícies, o comportamento padrão permanece inalterado.

---

# 10. Quick Wins

| Quick Win | Ação | Esforço | Impacto |
|---|---|---|---|
| QW-01 | Substituir grid fixo por adaptativo | Baixo | Muito alto |
| QW-02 | Controlar altura da imagem | Baixo | Muito alto |
| QW-03 | Reduzir padding interno | Baixo | Alto |
| QW-04 | Reduzir gap entre cards para 12 px | Baixo | Alto |
| QW-05 | Padronizar border radius | Baixo | Médio |
| QW-06 | Remover elevação no hover compacto | Baixo | Médio |
| QW-07 | Compactar cabeçalho da seção | Baixo | Médio |
| QW-08 | Ajustar singular, plural e decimais | Baixo | Médio |
| QW-09 | Ajustar atributo `sizes` das imagens | Baixo | Alto |
| QW-10 | Implementar fallback de imagem | Baixo | Alto |
| QW-11 | Isolar variante compacta | Baixo | Muito alto |
| QW-12 | Corrigir representação do parcelamento | Depende do contrato de dados | Crítico |
| QW-13 | Identificar avaliação e verificação da empresa | Baixo | Alto |
| QW-14 | Ajustar skeleton à nova geometria | Baixo | Alto |

Os três maiores ganhos visuais imediatos são QW-01, QW-02 e QW-03.

---

# 11. Performance Engineering

A compactação deve melhorar a densidade visual sem adicionar complexidade ao runtime.

| Área | Estratégia |
|---|---|
| Next.js Image | Preservar otimização nativa |
| Image sizes | Refletir a largura real dos cards |
| Lazy loading | Imagens fora da área visível |
| LCP | Priorizar apenas imagens críticas identificadas pela medição |
| CLS | Reservar a geometria da mídia |
| Hydration | Não adicionar estado React para calcular colunas |
| Responsividade | CSS Grid e container queries quando necessárias |
| JavaScript | Nenhuma nova biblioteca |
| Animações | Evitar `transition-all` |
| Re-render | Medir antes de introduzir memoização |
| Network | Nenhuma requisição adicional para renderizar o card |
| API | Preservar contratos existentes |
| Skeleton | Mesmas proporções do resultado carregado |
| DOM | Evitar wrappers desnecessários |

O grid deve ser resolvido preferencialmente por CSS, sem `window.innerWidth`, listeners de resize ou cálculos JavaScript desnecessários.

### Performance budgets

| Indicador | Meta |
|---|---:|
| LCP | ≤ 2,5 s |
| INP | ≤ 200 ms |
| CLS | ≤ 0,1 |
| TTFB | ≤ 600 ms como meta do ambiente |
| Dependências adicionadas | 0 |
| Requisições adicionais para layout | 0 |
| Overflow horizontal | 0 |
| Regressão de bundle | 0 como objetivo |
| Redução da altura do card padrão | ≥ 35% |
| Redução da altura da seção | ≥ 30% no cenário de referência |

Esses são critérios propostos, não medições já realizadas em produção.

---

# 12. TDD — Test-Driven Development

A implementação deve seguir o ciclo **RED → GREEN → REFACTOR**, com os testes escritos antes das modificações funcionais.

| Teste | Cenário | Resultado esperado |
|---|---|---|
| T01 | Um produto | Card não expande toda a seção |
| T02 | Dois produtos | Geometria uniforme |
| T03 | Três produtos | Três colunas quando houver espaço |
| T04 | 24 produtos | Grid e navegação estáveis |
| T05 | Nome extenso | Título completo acessível |
| T06 | Categoria extensa | Sem quebra estrutural |
| T07 | Sem imagem | Placeholder preserva geometria |
| T08 | URL de imagem inválida | Fallback funcional |
| T09 | Sem preço | Preço sob consulta |
| T10 | Preço elevado | Formatação BRL correta |
| T11 | Parcelamento indisponível | Nenhuma condição fictícia |
| T12 | Parcelamento confirmado | Valores reais apresentados |
| T13 | Empresa verificada | Badge correto |
| T14 | Empresa não verificada | Sem badge indevido |
| T15 | Uma avaliação | Singular correto |
| T16 | Múltiplas avaliações | Plural correto |
| T17 | Favoritar | Estado atualizado |
| T18 | Desfavoritar | Estado atualizado |
| T19 | Usuário não autenticado | Fluxo existente preservado |
| T20 | Ver detalhes | Navegação correta |
| T21 | Alterar filtro | Resultados corretos |
| T22 | Alterar ordenação | Ordem preservada |
| T23 | Aba Produtos | Variante compacta |
| T24 | Aba Todos | Variante compacta |
| T25 | Nenhum resultado | Empty state preservado |
| T26 | Carregamento | Skeleton sem salto visual |
| T27 | Teclado | Foco e navegação acessíveis |
| T28 | PWA 320 px | Sem overflow |
| T29 | Movimento reduzido | Animações respeitam preferência |
| T30 | Catálogo empresarial | Variante padrão preservada |

## 12.1. BDD — Behavior-Driven Development

```gherkin
Feature: Compact product discovery

  Scenario: Buscar uma marca com apenas um produto
    Given que o usuário pesquisou "goodwe"
    And existe apenas um produto correspondente
    When a seção de produtos é renderizada
    Then o card deve manter sua geometria compacta
    And não deve ocupar toda a largura disponível
    And todas as informações válidas devem ser preservadas

  Scenario: Buscar produtos de qualquer marca
    Given que existem múltiplos produtos correspondentes
    When os resultados são apresentados
    Then o grid deve utilizar o espaço disponível
    And todos os cards devem respeitar os tokens de densidade

  Scenario: Produto sem condição de parcelamento
    Given que o produto possui preço
    But não possui parcelamento confirmado
    When o card é renderizado
    Then o preço deve ser apresentado
    And nenhuma condição comercial deve ser presumida

  Scenario: Componente usado fora da busca
    Given que o ProductCardEnhanced é usado no catálogo
    When a variante compacta não é solicitada
    Then a geometria padrão deve ser preservada
```

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

---

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

---

# 14. Estrutura recomendada do pacote SPEC

```text
specs/
└── 023-search-products-compact-premium/
    ├── README.md
    ├── 01-AS-IS-INVENTORY.md
    ├── 02-ROOT-CAUSE-ANALYSIS.md
    ├── 03-GAP-ANALYSIS.md
    ├── 04-PRD.md
    ├── 05-QUICK-WINS.md
    ├── 06-UI-UX-SPEC.md
    ├── 07-DESIGN-TOKENS.md
    ├── 08-RESPONSIVE-GEOMETRY.md
    ├── 09-COMPONENT-CONTRACTS.md
    ├── 10-PERFORMANCE-BUDGET.md
    ├── 11-TDD-STRATEGY.md
    ├── 12-BDD-SCENARIOS.md
    ├── 13-TEST-MATRIX.md
    ├── 14-TASKLIST.md
    ├── 15-ACCEPTANCE-CRITERIA.md
    ├── 16-DEFINITION-OF-DONE.md
    ├── 17-ROLLBACK-PLAN.md
    └── 18-AGENT-PROMPT.md
```

O número 023 é uma sugestão, devendo ser validado contra o inventário atual de SPECs antes da criação da pasta.

---

# 15. Skills recomendadas para o agente

Para essa implementação, eu selecionaria skills com as seguintes especialidades, validando os nomes efetivamente instalados no ambiente do agente:

| Skill ou especialidade | Finalidade |
|---|---|
| UI/UX Design System | Consistência visual |
| IBM Carbon Design | Densidade enterprise |
| Swiss Design | Hierarquia, tipografia e geometria |
| Frontend Design | Refinamento premium |
| Tailwind CSS | Tokens e responsividade |
| React Best Practices | Arquitetura dos componentes |
| Next.js Best Practices | Renderização e otimização de imagens |
| Web Performance | Core Web Vitals |
| Accessibility / WCAG | Interação acessível |
| Playwright | E2E e visual regression |
| Test-Driven Development | Testes antes da implementação |
| Systematic Debugging | Validação das causas raiz |
| Verification Before Completion | Evidências de conclusão |

Não é necessário utilizar todas simultaneamente. Cada skill deve ser acionada na wave correspondente.

---

# 16. Prompt para o agente de desenvolvimento

# GOAL: AVALIA SOLAR — SEARCH PRODUCTS COMPACT PREMIUM A+++

MODE: READ-ONLY DISCOVERY FIRST → DESIGN-DRIVEN DEVELOPMENT → TDD → IMPLEMENTATION → VERIFICATION

## MISSÃO

Redesenhar exclusivamente a seção de produtos do mecanismo de busca do Avalia Solar, tornando a experiência significativamente mais compacta, premium, responsiva e eficiente, sem perder informações válidas, funcionalidades, integridade comercial ou performance.

A solução deverá funcionar para qualquer termo de pesquisa, marca, categoria, localização, ordenação e quantidade de produtos.

URL de referência:

https://www.avaliasolar.com.br/search?q=goodwe&sort=rating&page=1

## ETAPA 1 — DISCOVERY READ-ONLY

Antes de modificar qualquer arquivo:

- Identificar todos os consumidores de ProductCardEnhanced.
- Inventariar componentes, dependências, tokens, estilos, breakpoints e contratos.
- Validar as causas raiz documentadas.
- Capturar screenshots desktop, mobile e PWA.
- Medir geometria real por getBoundingClientRect.
- Registrar baseline de performance, bundle, requests, LCP e CLS.
- Inventariar testes existentes.
- Validar a origem das informações de reputação, verificação, preço e parcelamento.
- Identificar a SPEC disponível para este trabalho.
- Entregar diagnóstico, GAP Analysis, Quick Wins e plano de implementação.

## ETAPA 2 — DESIGN-DRIVEN DEVELOPMENT

Utilizar como referências conceituais IBM Carbon, Swiss Design e interfaces enterprise de alta densidade.

Preservar a identidade visual oficial do Avalia Solar.

Implementar uma variante compacta isolada para ProductCardEnhanced, inicialmente utilizada somente em /search.

Metas:

- Redução mínima de 35% da altura do card de referência.
- Altura alvo de 280–340 px no desktop, com crescimento quando necessário para preservar conteúdo.
- Imagem com altura controlada entre 128–152 px.
- Padding de 12 px.
- Gap de 12 px.
- Border radius de 8 px.
- Grid adaptativo baseado na largura útil.
- Três colunas na área útil de aproximadamente 840 px.
- Sem expansão indevida quando existir somente um produto.
- Sem truncamento que torne informações essenciais inacessíveis.
- Sem deformação de imagens.
- Sem novas dependências.
- Sem alteração global do design system.

Preservar categoria, nome, marca, fornecedor, avaliação, quantidade de avaliações, verificação, preço, favoritos e CTA.

Exibir condições de parcelamento apenas quando respaldadas por dados comerciais válidos.

Identificar corretamente quando a reputação e a verificação pertencem à empresa, e não ao produto.

## ETAPA 3 — TDD

Escrever os testes antes da implementação.

Executar RED → GREEN → REFACTOR.

Cobrir estados de 0, 1, 2, 3, 4, 8 e 24 resultados, imagens ausentes ou inválidas, nomes extensos, preços ausentes, condições comerciais, favoritos, filtros, ordenação, autenticação, acessibilidade e responsividade.

Implementar testes unitários, de integração, Playwright E2E e visual regression utilizando a infraestrutura existente.

## ETAPA 4 — IMPLEMENTAÇÃO

Priorizar:

- SearchPageClient.tsx
- ProductCardEnhanced.tsx
- Componentes e estilos exclusivos da seção de produtos.
- Testes correspondentes.

Preservar os consumidores externos de ProductCardEnhanced.

Não alterar indiscriminadamente ProductCard.tsx, globals.css, backend Rails, endpoints, ranking, filtros geográficos ou mecanismos de entitlement.

Não utilizar dados fictícios.

Não adicionar JavaScript para calcular dimensões que podem ser resolvidas por CSS.

Não aumentar o bundle sem justificativa.

## ETAPA 5 — VERIFICATION

Executar lint, typecheck, testes unitários, integration tests, Playwright, build e pipeline CI aplicável.

Comparar AS-IS e TO-BE com evidências reais.

Apresentar screenshots antes e depois em todas as resoluções relevantes.

Validar ausência de regressões no catálogo, Brand Pages, favoritos, filtros, ordenação e analytics.

Validar LCP ≤ 2,5 segundos, INP ≤ 200 ms e CLS ≤ 0,1 como objetivos de performance, documentando condições de medição e eventuais limitações.

## DEFINITION OF DONE

Considerar a missão concluída somente quando:

- A variante compacta estiver funcional.
- Todas as informações válidas estiverem preservadas.
- A redução geométrica estiver comprovada.
- O grid estiver responsivo.
- Os testes estiverem aprovados.
- Nenhuma regressão conhecida tiver sido introduzida.
- A integridade comercial estiver validada.
- O build estiver aprovado.
- A documentação estiver atualizada.
- As evidências visuais estiverem anexadas.
- O rollback estiver documentado.

Não declarar conclusão sem evidências.

Entregar o relatório final contendo arquivos modificados, causas raiz resolvidas, resultados dos testes, métricas antes e depois, screenshots, riscos residuais e status de readiness para produção.

---

# 17. KPIs de sucesso da experiência

Além dos critérios técnicos, a alteração deve ser avaliada pela sua contribuição à experiência de descoberta de produtos.

| KPI | Meta proposta |
|---|---:|
| Redução da altura dos cards | 35–50% |
| Capacidade de produtos por linha na tela apresentada | +50% |
| Redução de scroll para acessar avaliações | ≥30% no cenário de referência |
| CTR em Ver detalhes | +15% |
| Interações com favoritos | +10% |
| Taxa de abandono da busca | −10% |
| Tempo até primeira interação com produto | −20% |
| Regressões funcionais | 0 |
| Informações comerciais fictícias | 0 |

As metas comportamentais são hipóteses para validação posterior por analytics e, idealmente, experimentação controlada.

---

## 18. Resultado esperado

O Avalia Solar deve sair de uma apresentação de produtos com estética de vitrine convencional para uma experiência de **Product Discovery Enterprise**, com alta densidade informacional, leitura rápida e componentes consistentes.

O mesmo conceito poderá posteriormente ser aplicado ao catálogo `/products`, às Brand Pages e aos componentes de descoberta de produtos, utilizando a variante compacta de forma controlada.

**Status desta auditoria:** diagnóstico visual realizado, componentes localizados, causas raiz estruturais confirmadas no código e especificação proposta. Nenhum arquivo do repositório foi alterado. Não executei medições de runtime, Lighthouse ou testes automatizados nesta etapa, nem confirmei se o commit consultado corresponde exatamente ao deploy atual de produção. Essas validações integram a Wave 0.
