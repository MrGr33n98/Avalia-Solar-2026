# Documentação do Componente BlogPromoBanner

## Visão Geral
O componente `BlogPromoBanner` é um banner reutilizável desenvolvido com shadcn/ui e Tailwind CSS, projetado para exibir mensagens promocionais ou informativas em diversas partes da aplicação.

## Localização
`AB0-1-front/components/blog/BlogPromoBanner.tsx`

## Props
| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `type` | `'promotional' \| 'informative'` | `'informative'` | Define o estilo visual do banner. |
| `title` | `string` | - | Título do banner. |
| `message` | `string` | - | Mensagem principal. |
| `ctaText` | `string` | `undefined` | Texto do botão de ação (opcional). |
| `ctaUrl` | `string` | `undefined` | URL do botão de ação (opcional). |
| `className` | `string` | `''` | Classes CSS adicionais. |
| `onClose` | `() => void` | `undefined` | Função de callback para fechar o banner. |

## Exemplos de Integração

### 1. BlogFiltersBar (Navegação de Categorias)
Local: `AB0-1-front/components/blog/BlogFiltersBar.tsx`

```tsx
import { BlogPromoBanner } from './BlogPromoBanner';

// Dentro do componente
<BlogPromoBanner
  type="promotional"
  title="Oferta Especial"
  message="Confira nossos novos painéis solares com desconto."
  ctaText="Ver Detalhes"
  ctaUrl="/ofertas"
  className="mb-4"
/>
```

### 2. CategoryFilter (Sidebar de Filtros)
Local: `AB0-1-front/components/blog/CategoryFilter.tsx`

```tsx
import { BlogPromoBanner } from './BlogPromoBanner';

// Dentro do componente
<BlogPromoBanner
  type="informative"
  title="Dica"
  message="Use os filtros para encontrar o que precisa."
  className="mb-2"
/>
```

### 3. Active Admin (Backend)
O gerenciamento de banners de categoria (imagens) é feito via Active Admin em `AB0-1-back/app/admin/categories.rb`.
Campos disponíveis:
- `banner` (Image Attachment)
- `icon` (Image Attachment)

## Notas de Design
- **Responsividade**: O banner se adapta a telas móveis (stack vertical) e desktop (horizontal).
- **Acessibilidade**: Utiliza cores de contraste adequadas e botões com labels.
- **Estilo**: Segue o padrão visual do shadcn/ui com suporte a temas (variantes `default` e `outline` para botões).
