# Safe-Area Implementation Guide

## When to use

Use safe-area offsets em qualquer elemento:

- `fixed` no topo ou rodapé
- `sticky` próximo do topo em páginas mobile
- overlays e drawers full-screen
- CTAs que tocam nas bordas da viewport

## Available variables

```css
--safe-area-inset-top
--safe-area-inset-right
--safe-area-inset-bottom
--safe-area-inset-left
```

## Utility classes

- `.safe-top`
- `.safe-right`
- `.safe-bottom`
- `.safe-left`
- `.safe-x`
- `.safe-y`
- `.safe-all`

## Recommended patterns

```tsx
className="fixed bottom-0 left-0 right-0 px-4 pt-4 pb-[max(1rem,var(--safe-area-inset-bottom))]"
```

```tsx
className="sticky top-[calc(5rem+var(--safe-area-inset-top))] pt-[max(1rem,var(--safe-area-inset-top))]"
```

## Validation checklist

- testar com notch e sem notch
- validar gesture navigation no Android
- confirmar fallback em desktop
- revisar conflitos com headers sticky existentes
