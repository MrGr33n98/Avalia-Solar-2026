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
