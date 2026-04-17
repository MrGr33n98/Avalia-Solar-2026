# 🎨 Claymorphism Visual QA Checklist

## 📋 Pre-Deploy Validation

### 🏠 Home Page Components

#### ✅ Header/Navigation
- [ ] Logo has clay-convex effect with subtle shadow
- [ ] Menu items use clay-chip styling
- [ ] "Categorias" dropdown active state shows concave effect
- [ ] Auth buttons use clay-btn-primary styling
- [ ] Header background is clay-bg (#F0F3F9)

#### ✅ Category Chips Section
- [ ] Container uses clay-panel styling
- [ ] Individual chips have clay-chip convex effect
- [ ] Hover states reduce shadow smoothly
- [ ] Active/selected chips show concave effect
- [ ] Scroll button uses clay-chip styling

#### ✅ Savings Calculator
- [ ] Main card uses clay-panel effect
- [ ] Slider container is concave (clay-input)
- [ ] Slider thumb is convex when active
- [ ] CTA button uses clay-btn-primary
- [ ] Stats cards use clay-chip styling
- [ ] Background maintains dark theme

#### ✅ Category Cards Grid
- [ ] Each card uses clay-card effect
- [ ] Hover reduces shadows smoothly (no layout shift)
- [ ] "Explorar" buttons use clay-chip outline style
- [ ] Grid maintains responsive layout

#### ✅ Featured Companies Section
- [ ] Company cards use clay-card styling
- [ ] Logo containers have concave (molded) effect
- [ ] Primary CTAs use clay-btn-primary
- [ ] Secondary buttons use clay-chip styling
- [ ] Share buttons maintain clay-chip with backdrop blur

### 🔍 Filter & Search Components

#### ✅ Desktop Filter Sidebar
- [ ] Sidebar container uses clay-panel styling
- [ ] Filter chips use clay-chip convex/concave states
- [ ] "Limpar" button has clay-chip with red hover
- [ ] Status panel at bottom uses clay-panel
- [ ] Border uses clay-shadow-light color

#### ✅ Mobile Filter Button
- [ ] Floating button uses clay-btn-primary
- [ ] Active indicator badge maintains visibility
- [ ] Button shadow is prominent but not overwhelming

### 📱 Responsive Behavior

#### ✅ Desktop (1024px+)
- [ ] Full clay effects visible
- [ ] Hover states work smoothly
- [ ] Shadows are prominent but not excessive
- [ ] No performance issues with animations

#### ✅ Tablet (768px-1023px)
- [ ] Clay effects remain but are slightly reduced
- [ ] Touch targets are adequate (min 44px)
- [ ] Hover effects work on touch devices

#### ✅ Mobile (<768px)
- [ ] Clay effects are subtle but present
- [ ] No layout shift on interaction
- [ ] Buttons remain clay-btn-primary for hierarchy
- [ ] Text remains legible

## 🎨 Color & Contrast Validation

### ✅ Brand Colors Preserved
- [ ] Primary Blue: #0056D2 (used in clay-btn-primary)
- [ ] Secondary Purple: #6C5CE7 (available as clay-btn-secondary)
- [ ] Accent Green: #34C759 (available as clay-btn-accent)
- [ ] Clay Background: #F0F3F9 (used throughout)

### ✅ Contrast Requirements
- [ ] All text maintains AA contrast (4.5:1 minimum)
- [ ] Interactive elements are clearly distinguishable
- [ ] Focus states remain visible and accessible
- [ ] Dark mode automatically disables clay effects

## 🎭 Interaction States

### ✅ Default States
- [ ] Cards: Convex with medium shadow
- [ ] Buttons: Convex with brand-appropriate colors
- [ ] Inputs: Concave (sunken) appearance
- [ ] Chips: Subtle convex effect

### ✅ Hover States
- [ ] Shadows reduce by ~50% smoothly
- [ ] No sudden jumps or layout shifts
- [ ] Duration is consistent (250ms)
- [ ] Easing feels natural (cubic-bezier)

### ✅ Active/Pressed States
- [ ] Elements invert to concave (inset shadows)
- [ ] Active chips clearly show selection
- [ ] Press feedback is immediate
- [ ] Return animation is smooth

### ✅ Focus States
- [ ] Focus rings remain visible over clay effects
- [ ] Keyboard navigation works correctly
- [ ] Tab order is logical and preserved

## ♿ Accessibility Validation

### ✅ Motion & Animation
- [ ] `prefers-reduced-motion: reduce` disables clay animations
- [ ] Essential functionality works without animations
- [ ] No motion-triggered seizure risks

### ✅ Screen Readers
- [ ] All interactive elements remain properly labeled
- [ ] ARIA states are preserved
- [ ] Semantic HTML structure unchanged

### ✅ Keyboard Navigation
- [ ] Tab order follows logical flow
- [ ] Enter/Space activate buttons correctly
- [ ] Escape closes modals/dropdowns
- [ ] Focus management works in filters

## 🚀 Performance Check

### ✅ Rendering Performance
- [ ] No excessive repaints during hover
- [ ] Smooth 60fps animations on target devices
- [ ] No memory leaks from CSS animations
- [ ] Clay effects don't block main thread

### ✅ Loading Performance
- [ ] No additional HTTP requests for clay styles
- [ ] CSS bundle size impact is minimal
- [ ] Critical rendering path unchanged

## 🌙 Dark Mode Compatibility

### ✅ Auto-disable Clay in Dark Mode
- [ ] `.dark` class removes clay box-shadows
- [ ] Fallback to simple borders in dark mode
- [ ] Brand colors adapt correctly
- [ ] No broken visual elements

## 📱 Cross-browser Testing

### ✅ Modern Browsers (Chrome, Firefox, Safari, Edge)
- [ ] Box-shadow effects render consistently
- [ ] Border-radius values are respected
- [ ] CSS custom properties work correctly
- [ ] Smooth transitions function properly

### ✅ Older Browser Graceful Degradation
- [ ] Fallback to standard borders if box-shadow unsupported
- [ ] Core functionality remains intact
- [ ] No JavaScript errors from missing CSS features

## 🔧 Quick Fix Guide

### 🐛 If Clay Effects Don't Show:
1. Check HSL color values in CSS custom properties
2. Verify Tailwind config includes clay utilities
3. Ensure component classes are applied correctly
4. Check for conflicting styles overriding box-shadow

### 🐛 If Performance is Slow:
1. Verify `prefers-reduced-motion` is respected
2. Check for excessive re-renders during hover
3. Ensure GPU acceleration is enabled (transform/opacity)
4. Consider reducing shadow blur values

### 🐛 If Dark Mode Breaks:
1. Verify `.dark` overrides remove clay box-shadows
2. Check fallback border styles are applied
3. Ensure brand colors have dark variants
4. Test color contrast in dark theme

---

**QA Status**: 🟡 PENDING VALIDATION  
**Deploy Ready**: ❌ Awaiting QA Sign-off  
**Design Review**: ✅ APPROVED  
**A11y Review**: ✅ APPROVED