# 🎬 Avalia Solar Video - Mobile Optimized

## ✨ Novo Vídeo Mobile (BRAND SQUAD BEST PRACTICES)

**Localização:** `C:\Users\Bobi\Downloads\avalia-solar-mobile.mp4`

### 📱 Otimizações para Smartphone

| Feature | Descrição |
|---------|-----------|
| **Safe Areas** | Margens para notch e home indicator do iPhone |
| **Progress Bar** | Barra de progresso no topo (estilo Instagram Stories) |
| **Logo Watermark** | Logo sempre visível no canto (brand recall) |
| **Legendas Dinâmicas** | Auto-generated captions com highlight de palavras-chave |
| **Áudio Ready** | Estrutura pronta para background music |

### 🎵 COMO ADICIONAR ÁUDIO

1. **Baixe música royalty-free:**
   - [Pixabay Music](https://pixabay.com/music/)
   - [Bensound](https://www.bensound.com/)
   - [Mixkit](https://mixkit.co/free-sound-effects/)

2. **Recomendações de estilo:**
   - Corporate Tech / Uplifting (120-130 BPM)
   - Electronic / Modern Business
   - Duração: 30-35 segundos

3. **Salve o arquivo:**
   ```
   videos/public/background-music.mp3
   ```

4. **Edite o arquivo `AvaliaTrustVideoMobile.tsx`:**
   ```tsx
   // Descomente esta linha (aproximadamente linha 140):
   <Audio
     src="/background-music.mp3"
     volume={0.25}
     loop={true}
   />
   ```

5. **Renderize novamente:**
   ```bash
   npm run render:mobile
   ```

### 🎯 BRAND SQUAD BEST PRACTICES

Seguindo os ensinamentos dos maiores especialistas em branding:

#### Donald Miller (StoryBrand)
- ✅ **Mensagem clara**: Hierarquia de informação bem definida
- ✅ **CTA explícito**: "Transforme confiança em faturamento"
- ✅ **Problema → Solução**: Estrutura narrativa clara

#### Byron Sharp (Evidence-Based Branding)
- ✅ **Distinctive Assets**: Cores consistentes (blue, cyan, emerald)
- ✅ **Logo sempre visível**: Watermark para brand recall
- ✅ **Mental Availability**: Progresso visual constante

#### Alina Wheeler (Brand Identity)
- ✅ **Consistência visual**: Mesma paleta em todas as cenas
- ✅ **Tipografia hierárquica**: Inter/Outfit para modernidade
- ✅ **Claymorphism premium**: AS-EDS design system

### 📊 Legendas Automáticas

As legendas são geradas automaticamente com:
- **Highlight de palavras-chave** em cyan
- **Fade in/out** suave
- **Background com blur** para legibilidade
- **Safe zone** na parte inferior

Para editar as legendas, modifique `src/components/Subtitles.tsx`:

```typescript
const subtitles: SubtitleLine[] = [
  {text: "Seu texto aqui", startFrame: 0, endFrame: 90},
  {text: "Próxima frase", startFrame: 90, endFrame: 150, highlight: "palavra"},
];
```

### 🎬 Comandos Disponíveis

```bash
# Preview no Remotion Studio
npm start

# Renderizar vídeo mobile (com legendas)
npm run render:mobile

# Renderizar vídeo TaaS original (sem legendas)
npm run render:taas

# Renderizar vídeo original (15s)
npm run render
```

### 📁 Estrutura de Arquivos

```
videos/
├── src/
│   ├── AvaliaTrustVideoMobile.tsx    # Versão mobile com áudio/legendas
│   ├── AvaliaTrustVideo.tsx          # Versão TaaS original
│   ├── AvaliaVideo.tsx               # Versão original (15s)
│   ├── components/
│   │   ├── Subtitles.tsx             # Componente de legendas
│   │   ├── AudioPlayer.tsx           # Componente de áudio
│   │   └── Logo.tsx                  # Logo do Avalia Solar
│   └── scenes/
│       ├── Scene01MarketHook.tsx
│       ├── Scene02TrustCrisis.tsx
│       ├── Scene03AvaliaIntro.tsx
│       ├── Scene04TrustScore.tsx
│       ├── Scene05LeadershipPillars.tsx
│       ├── Scene06Dashboard.tsx
│       ├── Scene07Journey.tsx
│       └── Scene08CTA.tsx
├── public/
│   ├── logo.png                      # Logo oficial
│   └── background-music.mp3          # (adicione seu áudio aqui)
└── out/
    ├── avalia-solar-mobile.mp4       # Versão mobile
    ├── avalia-solar-taas.mp4         # Versão TaaS
    └── avalia-solar.mp4              # Versão original
```

### 🎨 Especificações Técnicas

| Parâmetro | Valor |
|-----------|-------|
| **Resolução** | 1080×1920 (9:16 vertical) |
| **Frame Rate** | 30 fps |
| **Duração** | ~32 segundos (960 frames) |
| **Codec** | H.264 |
| **Tamanho** | ~5.2 MB |
| **Formato** | MP4 |

### 🚀 Próximos Passos

1. ✅ Adicionar áudio de fundo
2. ✅ Ajustar volume do áudio (0.25 = 25%)
3. ✅ Testar no celular (Instagram Reels, TikTok, YouTube Shorts)
4. ✅ Opcional: Adicionar voice-over

### 📞 Suporte

Para dúvidas sobre o Brand Squad ou otimizações:
- Consulte a documentação em `.antigravity/squads/brand-squad/README.md`
- Use `@brand-chief` para ativar o orchestrator

---

**© 2026 Avalia Solar - Trust as a Service**
