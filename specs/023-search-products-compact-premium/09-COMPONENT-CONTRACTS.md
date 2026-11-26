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

## Contrato de dados (sem inventar campos da API)
- Usar `product.id` como chave, `buildProductPath` para destino; conservar callbacks e origem de eventos.
- Fonte de reputação/verificação: empresa associada. Marca e fornecedor devem ser distinguidos quando ambos existirem.
- Preço: número finito positivo, BRL; caso contrário, sob consulta. Condições de pagamento somente se confirmadas no contrato real.
- Mídia: URL válida ou fallback de mesma geometria; sem requisições novas de layout.
- `density` omitido equivale a `default`; catálogo e SmartEmptyCatalog permanecem com variante original.
