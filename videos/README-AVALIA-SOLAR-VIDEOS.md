# Avalia Solar Remotion Video System

Sistem de produção de vídeos profissionais para o Avalia Solar, utilizando **Remotion** e **React** para criar composições de vídeo programáticas.

## 📋 Composições Disponíveis

### 1. **ResidencialLeads** (31 segundos | 1860 frames)
- **Objetivo**: Gerar leads para instalação de energia solar residencial
- **CTA**: Solicite seu orçamento gratuito
- **Fluxo**: Hook → Homepage → Listing → Company Page → Comparador → CTA

### 2. **B2BEmpresas** (58 segundos | 1750 frames)
- **Objetivo**: Captar empresas para cadastro na plataforma
- **CTA**: Cadastre sua empresa
- **Fluxo**: Market Discovery → Categories → Listing → Dashboard → Management → CTA

### 3. **ReviewsGeneration** (32 segundos | 955 frames)
- **Objetivo**: Incentivar usuários a avaliar empresas
- **CTA**: Avalie sua experiência
- **Fluxo**: Opening Question → Company Page → Listing Impact → CTA

### 4. **CategoriasDiscovery** (50 segundos | 1515 frames)
- **Objetivo**: Apresentar breadth do marketplace
- **CTA**: Explore categorias
- **Fluxo**: Menu → Main Page → Full Grid → CTA

## 🚀 Quick Start

### Instalação de Dependências
```bash
cd videos
npm install
```

### Modo Desenvolvimento (Studio)
```bash
npm run dev
```
Abre o Remotion Studio em `http://localhost:3000` para preview e edição em tempo real.

### Renderização

**Individual:**
```bash
npm run render:residencial   # ResidencialLeads
npm run render:empresas      # B2BEmpresas
npm run render:reviews       # ReviewsGeneration
npm run render:categorias    # CategoriasDiscovery
```

**Todos os vídeos:**
```bash
npm run render:all
```

## 📁 Estrutura do Projeto

```
videos/
├── src/
│   ├── compositions-avalia/
│   │   ├── ResidencialLeads.tsx
│   │   ├── B2BEmpresas.tsx
│   │   ├── ReviewsGeneration.tsx
│   │   ├── CategoriasDiscovery.tsx
│   │   └── components/
│   │       ├── ScreenSlide.tsx       # Screenshot com animações
│   │       ├── BrandCTA.tsx           # Tela de call-to-action
│   │       └── TextOnly.tsx           # Texto com fundo animado
│   └── Root.tsx
├── public/
│   ├── lp.png
│   ├── page.png
│   ├── empresas.png
│   ├── comparador.png
│   ├── dashboard.png
│   ├── categorias.png
│   └── logo.png
├── out/                      # Vídeos renderizados
│   ├── residencial-leads.mp4
│   ├── b2b-empresas.mp4
│   ├── reviews-generation.mp4
│   └── categorias-discovery.mp4
├── manifest.json             # Especificação completa do projeto
├── remotion.config.ts
├── package.json
└── tsconfig.json
```

## 🎨 Design System

### Cores Tema
```typescript
const theme = {
  primary: "#1D4ED8",      // Azul Principal
  secondary: "#22C55E",    // Verde (Accent)
  dark: "#0F172A",         // Dark Navy
  light: "#F8FAFC",        // Fundo Claro
  text: "#0B1324",         // Texto Escuro
};
```

### Fonte
- **Padrão**: Inter (via Google Fonts)
- **Sizes**: 52px (H1) → 32px (Headlines) → 16-18px (Body)

### Dimensões
- **Formato**: 9:16 (Mobile)
- **Resolução**: 1080x1920px
- **FPS**: 30fps
- **Codec Recomendado**: H.264

## ⚙️ Componentes Reutilizáveis

### ScreenSlide
Exibe screenshots com animações de câmera e textos sobrepostos.

```tsx
<ScreenSlide
  imagePath="/public/empresas.png"
  headline="Compare empresas verificadas"
  subheadline="Veja reputação e localização"
  cameraMove="pan_right_to_left"
  focusArea="company_cards"
  highlightTarget="orcamento_button"
/>
```

**Props disponíveis:**
- `cameraMove`: `slow_zoom_in`, `push_in`, `pan_right_to_left`, `pan_left_to_right`, etc.
- `highlightStyle`: `soft_glow_outline`, `pulse_blue`, `cta_glow`, `pulse_gradient`
- `transitionOut`: `swipe_left`, `cross_blur`, `match_cut`, `fade_to_brand`, etc.

### BrandCTA
Tela final com gradient, logo e botão CTA.

```tsx
<BrandCTA
  headline="Solicite seu orçamento gratuito"
  subheadline="Compare empresas confiáveis"
  primaryColor="#1D4ED8"
  secondaryColor="#22C55E"
  logoPath="/public/logo.png"
/>
```

### TextOnly
Fundo cinemático com texto centralizado e animações.

```tsx
<TextOnly
  headline="Sua conta de luz só sobe?"
  subheadline="Escolher bem faz toda diferença."
  backgroundColor="#0F172A"
  accentColor="#22C55E"
/>
```

## 🎬 Best Practices Aplicados

✅ **Remotion Best Practices:**
- Uso de `useCurrentFrame()` e `spring()` para animações suaves
- `Sequence` para sequenciamento de cenas
- Componentes React reutilizáveis
- Animações baseadas em frames (não CSS)

✅ **Performance:**
- Otimização de renderização com `Img` component
- Animações eficientes sem re-renders desnecessários
- Estrutura modular para fácil manutenção

✅ **Design:**
- Proporção mobile-first (9:16)
- Transições profissionais entre cenas
- Textos legíveis com contraste adequado
- Animações de entrada/saída consistentes

## 📊 Timings

| Cena | Duração | Frames |
|------|---------|--------|
| Text Hook | 2.5s | 75 |
| Screenshot Base | 3s | 90 |
| Comparador | 2.8s | 85 |
| CTA Final | 2.5s | 75 |

## 🔧 Customização

### Adicionar Nova Composição

1. Criar componente em `src/compositions-avalia/`
2. Usar `Sequence` + componentes (ScreenSlide, BrandCTA, TextOnly)
3. Adicionar em `src/Root.tsx`:

```tsx
<Composition
  id="MyComposition"
  component={MyComposition}
  durationInFrames={1500}
  fps={30}
  width={1080}
  height={1920}
/>
```

4. Adicionar script em `package.json`:
```json
"render:mine": "remotion render src/Root.tsx MyComposition --output=out/my-video.mp4"
```

### Alterar Tema

Editar `theme` em cada composição:
```tsx
const theme = {
  primary: "#seu_azul",
  secondary: "#seu_verde",
  // ...
};
```

## 🎥 Renderização Avançada

```bash
# Renderizar com qualidade alta
remotion render src/Root.tsx ResidencialLeads --quality 100 --codec h265

# Renderizar em paralelo (mais rápido)
remotion render src/Root.tsx ResidencialLeads --concurrency 4

# Renderizar com codec específico
remotion render src/Root.tsx ResidencialLeads --codec h264
```

## 📝 Manifest.json

Arquivo `manifest.json` contém especificação completa de todas as composições, durações, offsets e assets. Use para:
- Referência rápida de timings
- Sincronização com voiceovers
- Documentação de specs
- Automação (scripts que leem JSON)

## 🐛 Troubleshooting

| Problema | Solução |
|----------|---------|
| Imagens borradas | Verificar resolução das imagens (mín. 1080x1920px) |
| Animações travadas | Aumentar `damping` em spring configs |
| Texto ilegível | Verificar contraste e tamanho da fonte |
| Renderização lenta | Reduzir `concurrency` ou usar H.264 ao invés de H.265 |

## 📚 Referências

- [Remotion Docs](https://www.remotion.dev/docs)
- [Remotion Best Practices](https://www.remotion.dev/docs/best-practices)
- [Remotion Transitions](https://www.remotion.dev/docs/transitions)
- [Remotion Spring Animation](https://www.remotion.dev/docs/spring)

## 🤝 Próximas Etapas

- [ ] Adicionar voiceover sincronizado com timings
- [ ] Integrar captions (@remotion/captions)
- [ ] Criar variantes de orientação (landscape)
- [ ] Adicionar transições mais complexas
- [ ] Setup CI/CD para renderização automática
- [ ] A/B Testing de diferentes CTAs

---

**Criado com ❤️ usando Remotion Best Practices**
