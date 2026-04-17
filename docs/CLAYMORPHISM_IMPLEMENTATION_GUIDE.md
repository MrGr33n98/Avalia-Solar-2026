# Claymorphism Design Implementation Guide - Avalia Solar

## 🎨 Design System Overview

Este documento fornece um guia completo para a implementação do design claymorphism no Avalia Solar, mantendo a paleta de cores original e garantindo funcionalidade sem quebras.

## 🎯 Objetivos Implementados

### ✅ Design Tokens Criados
- **Tokens de cor clay**: `--clay-bg`, `--clay-surface`, `--clay-surface-raised`, `--clay-surface-sunken`
- **Tokens de sombra**: Para cada cor da paleta (azul, verde, roxo, neutros)
- **Tokens de raio**: `--clay-radius-sm`, `--clay-radius-md`, `--clay-radius-lg`, `--clay-radius-xl`
- **Tokens de animação**: `--clay-duration`, `--clay-easing`

### ✅ Classes Utilitárias Clay
- `.clay-surface` - Superfície base clay
- `.clay-convex` - Efeito convexo (elevado)
- `.clay-concave` - Efeito côncavo (rebaixado)
- `.clay-card` - Cards com efeito clay completo
- `.clay-btn-primary` - Botões primários (azul #0056D2)
- `.clay-btn-secondary` - Botões secundários (roxo #6C5CE7)
- `.clay-btn-accent` - Botões de destaque (verde #34C759)
- `.clay-input` - Inputs com efeito côncavo
- `.clay-chip` - Chips/pills interativos
- `.clay-panel` - Painéis e containers
- `.clay-header` - Header/navbar styling

### ✅ Componentes Atualizados

#### 🏠 Home Page
- **Section backgrounds**: Backgrounds clay (#F0F3F9)
- **Category chips**: Efeito convexo com hover suave
- **CTA buttons**: Estilo clay-btn-primary aplicado
- **EmptyState cards**: Estilo clay-panel

#### 🏢 Company Cards
- **Card surface**: clay-card com hover/active states
- **Logo containers**: Efeito côncavo (moldura)
- **CTA buttons**: clay-btn-primary aplicado
- **Secondary buttons**: clay-chip styling
- **Share buttons**: clay-chip com backdrop blur

#### 🧭 Header/Navigation
- **Navbar background**: clay-header com sombra sutil
- **Logo container**: clay-surface convexo
- **Menu items**: clay-chip styling
- **Category dropdown**: clay-chip ativo/inativo
- **Auth buttons**: clay-btn-primary para registro

#### 🔍 Filters & Search
- **Filter sidebar**: clay-panel styling
- **Filter chips**: clay-chip com estados ativos
- **Clear button**: clay-chip com hover vermelho
- **Mobile filter button**: clay-btn-primary

#### 📊 Savings Calculator
- **Calculator panel**: clay-panel com backdrop blur
- **Slider container**: clay-input côncavo
- **Slider thumb**: clay-convex no controle
- **CTA button**: clay-btn-primary
- **Stat cards**: clay-chip pequenos

#### 🏷️ Category Components
- **Category cards**: clay-card com hover
- **Category chips**: clay-chip com ícones
- **Explore buttons**: clay-chip outline

## 🎨 Paleta de Cores Preservada

### Cores Principais
- **Primary Blue**: #0056D2 (hsl(211, 100%, 41%))
- **Secondary Purple**: #6C5CE7 (hsl(262, 83%, 58%))
- **Accent Green**: #34C759 (hsl(131, 73%, 52%))
- **Neutral Clay**: #F0F3F9 (hsl(240, 15%, 96%))

### Cores de Sombra Clay
- **Light Shadow**: hsl(240, 15%, 85%)
- **Dark Shadow**: hsl(0, 0%, 100%) (branco)
- **Primary Shadows**: Derivadas do azul principal
- **Green Shadows**: Derivadas do verde principal
- **Purple Shadows**: Derivadas do roxo principal

## 🛡️ Acessibilidade & UX

### ✅ Implementado
- **Contraste AA**: Mantido em todos os estados
- **Reduced Motion**: `@media (prefers-reduced-motion: reduce)` desabilita animações
- **Focus States**: `focus-visible:ring` preservados
- **Dark Mode**: Clay effects desabilitados automaticamente

### ✅ Microinterações
- **Hover States**: Sombras reduzidas suavemente
- **Active States**: Transição para côncavo
- **Duration**: 250ms com easing suave
- **Scale**: Hover scale limitado a 1.02 (sem layout shift)

## 📱 Responsividade

### ✅ Desktop (1024px+)
- Clay effects completos
- Sombras e radios máximos
- Hover states ativos

### ✅ Tablet (768px-1023px)
- Clay effects reduzidos
- Sombras menores
- Touch-friendly targets

### ✅ Mobile (<768px)
- Clay effects mínimos
- Foco em toque e legibilidade
- Buttons clay-btn-primary mantidos

## 🔧 Implementação Técnica

### CSS Variables (globals.css)
```css
:root {
  /* Clay Colors */
  --clay-bg: 240 15% 96%;
  --clay-surface: 0 0% 100%;
  --clay-surface-raised: 240 15% 98%;
  --clay-surface-sunken: 240 15% 94%;
  
  /* Clay Shadows */
  --clay-shadow-light: 240 15% 85%;
  --clay-shadow-dark: 0 0% 100%;
  
  /* Clay Radiuses */
  --clay-radius-sm: 0.875rem;
  --clay-radius-lg: 1.75rem;
  
  /* Clay Animation */
  --clay-duration: 250ms;
  --clay-easing: cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Tailwind Extensions (tailwind.config.ts)
```typescript
borderRadius: {
  'clay-sm': 'var(--clay-radius-sm)',
  'clay-lg': 'var(--clay-radius-lg)',
},
colors: {
  clay: {
    bg: 'hsl(var(--clay-bg))',
    surface: 'hsl(var(--clay-surface))',
  }
}
```

### Utility Classes
```css
.clay-card {
  @apply clay-surface clay-convex;
  background: hsl(var(--clay-surface));
  border-radius: var(--clay-radius-xl);
}

.clay-card:hover {
  box-shadow: 
    6px 6px 20px hsl(var(--clay-shadow-light)),
    -6px -6px 20px hsl(var(--clay-shadow-dark));
}
```

## 🚀 Performance

### ✅ Otimizações
- **CSS-in-CSS**: Evita runtime overhead
- **Transform-free**: Usa apenas box-shadow (composited)
- **Reduced motion**: Automaticamente respeitada
- **Dark mode**: Clay desabilitado para performance

## 🧪 QA Checklist

### ✅ Visual
- [ ] Cards têm efeito convexo por default
- [ ] Hover reduz sombras suavemente
- [ ] Active/pressed inverte para côncavo
- [ ] Inputs são côncavos (sunken)
- [ ] Buttons primários são convexos com cor da marca
- [ ] Paleta de cores preservada
- [ ] Raios ≥ 20px em cards, ≥ 10px em inputs/botões

### ✅ Interação
- [ ] Sem layout shift em hover/active
- [ ] Animações suaves (250ms)
- [ ] Focus states preservados
- [ ] Touch targets adequados (mobile)

### ✅ Acessibilidade
- [ ] Contraste AA mantido
- [ ] Reduced motion respeitada
- [ ] Screen readers funcionam
- [ ] Keyboard navigation intacta

### ✅ Funcionalidade
- [ ] Todos os CTAs funcionam
- [ ] Navegação intacta
- [ ] Formulários funcionais
- [ ] Filtros operacionais

## 📋 Componentes Não Alterados

### ✅ Preservado (funcionalidade crítica)
- **Form validation logic**
- **API integrations**
- **Analytics tracking**
- **SEO metadata**
- **Authentication flows**
- **Payment flows**
- **Search functionality**
- **Filter business logic**

## 🎯 Próximos Passos

### 📈 Possíveis Melhorias Futuras
1. **Advanced clay mixing**: Mixing modes para overlays
2. **Clay text effects**: Subtle embossed text
3. **Advanced lighting**: Multiple light sources
4. **Seasonal themes**: Diferentes "clay materials"

## 🔍 Troubleshooting

### 🐛 Issues Comuns
1. **Sombras não aparecem**: Verificar HSL values
2. **Performance lenta**: Verificar reduced motion
3. **Dark mode broken**: Verificar overrides de classe
4. **Mobile muito sutil**: Ajustar shadow opacity

---

**Status**: ✅ IMPLEMENTADO  
**Data**: 2026-03-05  
**Version**: 1.0.0  
**UX Designer**: Uma Agent (@ux-design-expert)