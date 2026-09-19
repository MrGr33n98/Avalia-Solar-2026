================================================================================
PROMPT DETALHADO: EDGE FEATHERING & SEAMLESS BACKGROUND INTEGRATION
Canvas Scroll-Driven — Landing Hero Avalia Solar 2026
================================================================================

AUTOR:          Felipe Henrique Morais Almeida
PROJETO:        MrGr33n98/Avalia-Solar-2026 / AB0-1-front
TIPO:           Composição CSS/canvas — sem alterar assets WebP originais
ESTILO VISUAL:  Apple product landing + soft feathering + premium SaaS + seamless

================================================================================
0. RESUMO DA TASK (EXECUTIVE SUMMARY)
================================================================================

A animação scroll-driven de 120 frames WebP do hero está renderizando com um
"retângulo perceptível" nas 4 bordas. O objetivo é fazer com que o canvas pareça
PARTE DA PÁGINA, e não uma imagem colada.

ESTRATÉGIA PRIORITÁRIA (por ordem de preferência):
  1. CSS mask-image (mask + -webkit-mask) com gradientes radiais/lineares
  2. Overlays de gradiente em pseudo-elementos / divs pointer-events-none
  3. Background matching exato com as cores do HeroBackground
  4. Feathering localizado nas 4 extremidades, preservando 80%+ do centro nítido
  5. Blur localizado APENAS em camada traseira de preenchimento (se necessário)

PROIBIDO ESTRITAMENTE:
  ❌ filter: blur(...) no canvas principal
  ❌ Alterar arquivos WebP em /public/videos/*
  ❌ Vinheta forte / halo artificial perceptível
  ❌ Modificar lógica do motor de scroll (useScrollDrivenFrames.ts) sem necessidade
  ❌ backdrop-filter em viewport inteira
  ❌ Nova faixa branca / descontinuidade visual

================================================================================
1. EVIDÊNCIAS CONCRETAS DA AUDITORIA (NÃO ASSUMIR — USAR ISSO)
================================================================================

Arquivo de produção do hero:
  → AB0-1-front/components/landing/LandingHero.tsx (USAR ESTE. ScrollDrivenCanvas.tsx
    é um componente genérico reutilizável; nesta landing o canvas está hardcoded
    dentro do LandingHero.tsx para máxima performance.)

Canvas real (alvo das alterações):
  Linhas 144-158 de LandingHero.tsx
  ├── wrapper-pai:   linha 116:  absolute inset-y-0 right-0 h-full w-[50%] lg:block
  │                     maxWidth = 'calc((100% - 1320px) / 2 + 50%)'
  │                     zIndex = 1
  ├── wrapper-interno: linha 124: relative h-full w-full
  └── <canvas>:         absolute inset-0 h-full w-full
                         object-contain object-right-bottom
                         width=1280  height=720  (desktop)
                         opacity-0 → opacity-100 só após hasRenderedValidFrame

Fundo REAL da landing (confirmado em HeroBackground.tsx linhas 23-98):
  Camada 1 (base — cor mais importante):
    linear-gradient(135deg, #ffffff 0%, #f8fbff 55%, #eef5ff 100%)
  Camada 2 (halo solar):
    radial-gradient(circle at 88% 10%, rgba(255,184,0,0.18) 0%, ..., transparent 40%)
  → Ponto chave: a cor na região do canvas (lado direito, meio/baixo) é
    predominantemente #f8fbff com leve tendência a #eef5ff no rodapé.

Overlay JÁ EXISTENTE (linhas 194-201 de LandingHero.tsx):
  className: pointer-events-none absolute inset-0 z-[2]
  background:
    linear-gradient(90deg,
      #f8fbff 0%,
      rgba(248,251,255,0.5) 30%,
      rgba(248,251,255,0.12) 55%,
      transparent 72%)
  → Este overlay só cobre a BORDA ESQUERDA (onde encontra o texto).
  → ELE DEVE SER PRESERVADO e REFINADO. As outras 3 bordas (topo, direita, baixo)
    estão NUMAS e precisam de tratamento.

Composição do objeto principal dentro dos frames (bounding box aproximada — NÃO BORRAR):
  - Carro: região central-inferior, cerca de 40%–85% vertical, 25%–80% horizontal
  - Rodas: não feather
  - Luzes/energia azul: não feather
  - Carregador/cabo azul: não feather
  - Arquitetura/fachada: manter nítida

================================================================================
2. RESULTADO VISUAL DESEJADO
================================================================================

Hoje (CONCEITUAL):
  PÁGINA (#f8fbff)
  ┌──────────────────────────────────────────────────┐
  │                    │  ┌─────────────────────┐   │
  │     TEXTO          │  │  FRAME CANVAS       │   │
  │                    │  │  (retângulo visível)│   │
  │                    │  └─────────────────────┘   │
  └──────────────────────────────────────────────────┘

Depois (DESEJADO):
  PÁGINA (#f8fbff com gradiente)
  ┌──────────────────────────────────────────────────┐
  │        ← transição invisível sem cortes →        │
  │                                                  │
  │     TEXTO            [CARRO  +  ARQUITETURA  ]   │
  │                      (100% nítidos no centro)    │
  │                                                  │
  │    ← extremidades desaparecem gradual. →         │
  └──────────────────────────────────────────────────┘

Sensação final: O carro e a arquitetura EMERGEM do fundo da página.
NÃO é possível dizer exatamente onde o asset começa/termina.

================================================================================
3. IMPLEMENTAÇÃO PASSO A PASSO (ORDENADA POR PRIORIDADE)
================================================================================

──────────────────────────────────────────────────────────────────────────────
PASSO 1 — Adicionar CSS mask-image no canvas-wrapper (MAIS IMPORTANTE)
──────────────────────────────────────────────────────────────────────────────

Aplicar no <div> que envolve DIRETAMENTE canvas + fallback imagem, ou no
próprio <canvas> + <Image> do fallback sincronizados.

A máscara DEVE ser COMBINADA (horizontal + vertical) usando a sintaxe de
múltiplas máscaras do CSS. NÃO usar apenas um gradiente único.

Concentos de pontos de parada (AJUSTAR FINALMENTE, não usar cegamente):

  HORIZONTAL (esquerda ←→ direita):
    Preservar centro completamente visível ~70%–80%
    0%  → transparent  (borda esquerda dura some)
    7%  → black        (início conteúdo)
    88% → black        (fim conteúdo)
    100%→ transparent  (borda direita some)
    → linear-gradient(to right, transparent 0%, black 7%, black 88%, transparent 100%)

  VERTICAL (topo ←→ base):
    Inferior fade é MAIS LONGO (conforme item 6 do master prompt):
    0%  → transparent
    6%  → black
    70% → black
    92% → rgba(0,0,0,0.85)
    100%→ transparent
    → linear-gradient(to bottom,
        transparent 0%,
        black 6%,
        black 70%,
        rgba(0,0,0,0.85) 92%,
        transparent 100%)

  COMBINAR as duas com mask-composite (ou ordem em múltiplas máscaras separadas
  por vírgula). Em navegadores WebKit usar -webkit-mask-image equivalente.

  APLICAR em:
  • o <canvas> principal
  • a <Image> de fallback estática
  • o <video> de prefers-reduced-motion
  → OU, MELHOR: aplicar em um NOVO wrapper comum aos 3 (linha 128 de LandingHero.tsx,
    a div className="relative h-full w-full"). Assim não precisa replicar em 3 nós.

──────────────────────────────────────────────────────────────────────────────
PASSO 2 — Refinar o overlay existente e adicionar overlays complementares
──────────────────────────────────────────────────────────────────────────────

O overlay de esquerda já existe (linhas 194-201). Mantê-lo, mas adicionar 3 novos
overlay divs, todos com:
  pointer-events: none
  aria-hidden: true
  z-index entre [1] e [2] (abaixo do sponsoredBanner que é z-[3])

Overlay TOPO (suave, integra com halo solar do HeroBackground):
  Cobrir só os ~12% superiores
  background: linear-gradient(180deg,
              rgba(255,255,255,0.95) 0%,   ← topo quase branco (match HeroBackground)
              rgba(248,251,255,0.5) 25%,
              rgba(248,251,255,0.0) 60%)

Overlay DIREITA (hoje está NUA — corte duro):
  Cobrir só os ~18% da borda direita
  background: linear-gradient(270deg,
              rgba(238,245,255,0.90) 0%,   ← match #eef5ff do rodapé
              rgba(248,251,255,0.40) 30%,
              rgba(248,251,255,0.00) 70%)
  NOTA: o halo solar está no canto superior-direito então este overlay deve
  ser MENOS opaco na parte superior para não conflitar. Podemos usar um
  gradiente bilinear ou duas camadas se necessário.

Overlay INFERIOR (ITEM MAIS IMPORTANTE dos 3 — master prompt item 6):
  Cobrir os ~25%–30% inferiores com FADE LONGO E SUAVE:
  background: linear-gradient(0deg,
              rgba(238,245,255,1) 0%,      ← exatamente o tom final do Hero
              rgba(238,245,255,0.85) 12%,
              rgba(248,251,255,0.50) 30%,
              rgba(248,251,255,0.10) 55%,
              rgba(248,251,255,0.00) 80%)
  Finalizar na cor real do fundo (eef5ff) para eliminar o corte branco inferior.

──────────────────────────────────────────────────────────────────────────────
PASSO 3 — Camada de blurred-background auxiliar (OPCIONAL — só se feather não for suficiente)
──────────────────────────────────────────────────────────────────────────────

SOMENTE SE após Passo 1 + 2 ainda houver linha perceptível, adicionar uma camada
DETRÁS do canvas, com mesmo src do frame atual OU uma única instância do primeiro
frame (fallback image) com:
  position: absolute
  inset: -2%   (levemente maior para preencher bordas)
  filter: blur(14px) saturate(1.05)
  opacity: 0.55
  transform: scale(1.02)
  z-index: 0 (abaixo do canvas real que fica em z padrão)
  pointer-events: none
  object-contain object-right-bottom (igual ao canvas)

Esta camada NÃO degrada a nitidez do canvas principal. Ela só existe para
"espalhar" as cores das bordas para fora, eliminando qualquer linha residual.

Para não adicionar peso: usar a mesma <Image> de fallback como fonte, via CSS
::after ou uma div adicional que só é renderizada se hasRenderedValidFrame for true.

──────────────────────────────────────────────────────────────────────────────
PASSO 4 — Responsividade / Breakpoints
──────────────────────────────────────────────────────────────────────────────

A implementação padrão do LandingHero.tsx já esconde o canvas abaixo de `lg:`
(1024px). Entretanto, se o breakpoint mudar ou o ScrollDrivenCanvas genérico for
usado em outras páginas, aplicar:

lg (1024px+) → feather completo conforme itens 1-3 acima.
md (768-1023px) → se canvas for visível, reduzir feather em ~30% (centro visível maior)
sm (< 768px) → manter apenas fade inferior e superior (cuidado para não
               cortar carro, que fica centralizado em mobile e ocupa mais área)

Mobile no ScrollDrivenCanvas.tsx genérico:
  ajustar os % da máscara para:
  horizontal: transparent 0%, black 4%, black 96%, transparent 100%
              (menos agressivo, o carro ocupa quase toda a largura)
  vertical:   manter fade inferior longo, mas topo menos agressivo

================================================================================
4. NÃO ALTERAR (preservar como está hoje)
================================================================================

• Toda a lógica de useScrollDrivenFrames (preload, RAF, erro, enabled, etc.)
• sticky / 280vh / disableExtendedScroll
• fallback crossfade (opacity-0 → opacity-100 só com hasRenderedValidFrame)
• o overlay ESQUERDO já existente (apenas garantir que continue sincronizado)
• sponsoredBanner z-[3] / vídeos reduced-motion
• barra de progresso de pré-carregamento (bottom-6 left-6)
• composição do grid (texto esquerda 7/12, imagem direita 5/12)

================================================================================
5. CRITÉRIOS DE ACEITAÇÃO (CHECKLIST OBRIGATÓRIO)
================================================================================

 [ ] 80% central da cena continua 100% nítida (carro, rodas, luzes, cabo)
 [ ] Não existe borda direita perceptível (hoje é um corte duro)
 [ ] Borda inferior desaparece em fade longo até o #eef5ff (sem corte branco)
 [ ] Borda superior desaparece em fade suave até #ffffff / halo solar
 [ ] Borda esquerda continua integrada (overlay já existente preservado)
 [ ] Não existe vinheta forte / "efeito perceptível"
 [ ] Apenas CSS mask + gradientes (sem blur no canvas)
 [ ] scroll-driven continua funcionando (fwd/reverse, 0%→25%→50%→75%→100%)
 [ ] fallback → canvas crossfade continua intacto
 [ ] prefers-reduced-motion vídeo continua visível
 [ ] mobile abaixo de 1024px não tem regressão
 [ ] lint e typecheck passam
 [ ] build não quebra
 [ ] Não há nova descontinuidade / faixa branca em nenhum breakpoint

================================================================================
6. REFERÊNCIAS DE ARQUIVOS E LINHAS (ALTERAR APENAS OS INDICADOS)
================================================================================

EDITAR:
  • AB0-1-front/components/landing/LandingHero.tsx
    - Linhas 127-188: criar um wrapper único para canvas/fallback/video,
      aplicar mask-image e -webkit-mask-image nele.
    - Linhas 194-201: preservar overlay esquerdo, adicionar divs overlay
      top / right / bottom irmãs a este.

OPCIONALMENTE EDITAR (se for reaproveitar feather em outras páginas):
  • AB0-1-front/components/ui/ScrollDrivenCanvas.tsx
    - Aplicar mesma estratégia de máscara + 4 overlays no wrapper interno do canvas.

NÃO EDITAR:
  • AB0-1-front/hooks/useScrollDrivenFrames.ts (a menos de bug comprovado)
  • AB0-1-front/public/videos/*  (assets originais)
