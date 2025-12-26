# CategoryCard UI Redesign (AB0-1-front)

## Arquivo alterado
- `AB0-1-front\components\CategoryCard.tsx`

## Confirmação de uso do componente
O `CategoryCard` está sendo usado diretamente em:
- `AB0-1-front\app\page.tsx`
- `AB0-1-front\app\categories\CategoriesList.tsx`
- `AB0-1-front\components\CategoriesIndex.tsx`
- `AB0-1-front\components\CategoriesIndexV2.tsx`

(Referência: buscas por `import CategoryCard from '@/components/CategoryCard'`).

## Objetivos atendidos no redesign

### 1) Logo (tratamento visual)
- Inserido **logo circular 1:1** sobre o banner (canto inferior esquerdo).
- `border-radius: 50%` via Tailwind `rounded-full` + `aspect-square`.
- Contorno **2px semitransparente** via `ring-2 ring-black/10 dark:ring-white/15`.
- Fundo de suporte para legibilidade em qualquer banner (`bg-background/95`) + `shadow-sm`.

### 2) Card (container)
- Border-radius consistente de **8px**: `rounded-lg`.
- Box-shadow base conforme especificado: `shadow-[0_4px_6px_rgba(0,0,0,0.1)]`.
- Padding **16px** mantido: `p-4`.
- Transição suave **0.3s** (todas as propriedades animáveis): `transition-all duration-300`.
- Ajuste para suportar tema claro/escuro usando tokens do design system: `bg-card text-card-foreground border-border`.

### 3) Banner
- Proporção **16:9**: `aspect-[16/9]`.
- Hover com "opacity: 0.9" (equivalente) e duração **200ms** usando wrapper `transition-opacity duration-200 group-hover:opacity-90`.
- Mantida animação de zoom suave do banner no hover.

## Restrições respeitadas
- Sem mudanças na lógica de estado existente (`imageError`, `isHovered`).
- Funcionalidades preservadas (link overlay, badges, CTA).
- Alterações focadas em classes Tailwind e adição de bloco visual da logo.

## Checklist de validação sugerido
- Viewports: 320px, 375px, 768px, 1024px, 1440px, 1920px.
- Cross-browser: Chrome/Firefox/Safari/Edge.
- Acessibilidade: contraste do texto no banner + foco/hover.
- Lighthouse: confirmar que o impacto de CSS permaneceu mínimo (classes Tailwind). 
