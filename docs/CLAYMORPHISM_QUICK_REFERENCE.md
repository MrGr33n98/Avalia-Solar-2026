# 🎨 Clay Design System - Quick Reference

## 🚀 Ready-to-Use Classes

### 📦 Container & Surface Classes
```css
.clay-surface       /* Base clay surface with background */
.clay-panel         /* Container/card with full clay styling */
.clay-card          /* Enhanced card with hover/active states */
.clay-header        /* Header/navbar specific styling */
```

### 🎛️ Interactive Element Classes
```css
.clay-btn-primary   /* Primary button (Blue #0056D2) */
.clay-btn-secondary /* Secondary button (Purple #6C5CE7) */
.clay-btn-accent    /* Accent button (Green #34C759) */
.clay-chip          /* Pills/tags with active states */
.clay-input         /* Form inputs (concave styling) */
```

### ✨ Effect Classes
```css
.clay-convex        /* Raised/protruding effect */
.clay-concave       /* Sunken/pressed effect */
.smooth-transition  /* Consistent 250ms transitions */
```

## 🎯 Usage Patterns

### 🏢 Company Cards
```jsx
<Card className="clay-card">
  <div className="clay-surface clay-convex"> {/* Logo container */}
    <img src="logo.png" />
  </div>
  <Button className="clay-btn-primary">Orçamento</Button>
  <Button className="clay-chip">Avaliar</Button>
</Card>
```

### 🧭 Navigation Items
```jsx
<Link className="clay-chip px-3 py-1.5">Menu Item</Link>
<Button className="clay-chip active">Active Item</Button>
```

### 🔍 Filter Components
```jsx
<aside className="clay-panel">
  <Button className="clay-chip">Filter Option</Button>
  <input className="clay-input" />
</aside>
```

### 📊 Dashboard Cards
```jsx
<Card className="clay-panel">
  <h3>Statistics</h3>
  <Button className="clay-btn-primary">Action</Button>
</Card>
```

## 🎨 Color Reference

### 🎯 Brand Colors (HSL)
- **Primary**: `hsl(211, 100%, 41%)` - #0056D2
- **Secondary**: `hsl(262, 83%, 58%)` - #6C5CE7  
- **Accent**: `hsl(131, 73%, 52%)` - #34C759
- **Clay BG**: `hsl(240, 15%, 96%)` - #F0F3F9

### 🌟 Clay Surface Colors
- **Surface**: `hsl(0, 0%, 100%)` - Pure white
- **Raised**: `hsl(240, 15%, 98%)` - Slightly raised
- **Sunken**: `hsl(240, 15%, 94%)` - Sunken areas

## 📐 Spacing & Radius

### 🔘 Clay Radius Scale
- **Small**: `0.875rem` (14px) - Chips, inputs
- **Medium**: `1.25rem` (20px) - Buttons
- **Large**: `1.75rem` (28px) - Panels  
- **XL**: `2.25rem` (36px) - Main cards

### ⚡ Animation Timing
- **Duration**: `250ms`
- **Easing**: `cubic-bezier(0.4, 0, 0.2, 1)`

## 🎭 State Behaviors

### 🖱️ Interactive States
```css
/* Default: Convex (raised) */
.clay-card { /* 10px shadow */ }

/* Hover: Reduced shadow */
.clay-card:hover { /* 6px shadow */ }

/* Active/Pressed: Concave (inset) */
.clay-card:active { /* inset shadows */ }
```

### 🎯 Selection States
```css
/* Inactive chip */
.clay-chip { /* convex */ }

/* Active/Selected chip */
.clay-chip.active { /* concave + primary color */ }
```

## 🔧 Implementation Tips

### ✅ Do's
- Use `.clay-btn-primary` for main CTAs
- Apply `.clay-chip` for filter options
- Use `.clay-panel` for containers
- Add `.smooth-transition` for consistency
- Combine with existing utility classes

### ❌ Don'ts  
- Don't mix with conflicting shadows
- Don't use on dark backgrounds (auto-disabled)
- Don't override core shadow properties
- Don't use excessive nesting of clay effects

### 🎯 Responsive Strategy
```css
/* Desktop: Full effects */
@media (min-width: 1024px) {
  .clay-card { /* full shadows */ }
}

/* Mobile: Subtle effects */
@media (max-width: 767px) {
  .clay-card { /* reduced shadows */ }
}
```

## ♿ Accessibility Notes

### 🎛️ Motion Sensitivity
```css
@media (prefers-reduced-motion: reduce) {
  .clay-* { transition: none !important; }
}
```

### 🌙 Dark Mode Override
```css
.dark .clay-* {
  box-shadow: none;
  border: 1px solid hsl(var(--border));
}
```

## 🧪 Testing Shortcuts

### 🎨 Visual Validation
```javascript
// Check if clay classes exist
document.querySelector('.clay-card') !== null

// Test hover state
element.classList.contains('clay-card:hover')

// Verify transition timing
getComputedStyle(element).transitionDuration === '0.25s'
```

### 📱 Device Testing
- **Desktop**: Full clay effects visible
- **Tablet**: Reduced but present
- **Mobile**: Subtle but functional

---

**Quick Start**: Add `clay-card` to any card, `clay-btn-primary` to main buttons, `clay-chip` to interactive pills.  
**Emergency**: If broken, add `.shadow-sm` fallback classes.