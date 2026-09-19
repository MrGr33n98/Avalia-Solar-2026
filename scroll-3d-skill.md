# Blueprint de Engenharia & Design: Animações 3D Controladas por Scroll (Zero-Lag Canvas Scrubbing)

Este documento contém a **especificação técnica completa**, os **scripts de processamento de asset**, o **código-fonte de referência em React/TypeScript** e o **Prompt Mestre Reutilizável** para replicar a estética e performance de produto de alto padrão (padrão Apple, Linear e Awwwards) em qualquer projeto web.

---

## 📑 Sumário

1. [Filosofia & Padrão Visual (*Aesthetic Standard*)](https://www.google.com/search?q=%25231-filosofia--padr%25C3%25A3o-visual&utm_source=gemini)
2. [Arquitetura Técnica & Motivação](https://www.google.com/search?q=%25232-arquitetura-t%25C3%25A9cnica--motiva%25C3%25A7%25C3%25A3o&utm_source=gemini)
3. [Script de Processamento de Assets (Python / OpenCV)](https://www.google.com/search?q=%25233-script-de-processamento-de-assets&utm_source=gemini)
4. [Componente React / Next.js / TypeScript Drop-in](https://www.google.com/search?q=%25234-componente-react--nextjs--typescript-drop-in&utm_source=gemini)
5. [Prompt Mestre Reutilizável para Novos Projetos](https://www.google.com/search?q=%25235-prompt-mestre-reutiliz%25C3%25A1vel&utm_source=gemini)
6. [Checklist de Qualidade & Critérios de Aceite](https://www.google.com/search?q=%25236-checklist-de-qualidade&utm_source=gemini)
7. [Compatibilidade Mobile & PWA (Gestão de VRAM e UX)](https://www.google.com/search?q=%25237-compatibilidade-mobile--pwa-gest%25C3%25A3o-de-vram-e-ux&utm_source=gemini)

---

## 1. Filosofia & Padrão Visual

### ❌ O que NÃO fazer (AI Slop / Default Amador):

* Inserir a animação dentro de um card pesado com borda grossa, fundo escuro `bg-[#081525]` ou gradientes roxos genéricos.
* Poluir a tela com mockups de HUD pesados, falsas linhas de laser, retículas sobrepostas ou estatísticas genéricas que competem com o produto.
* Usar players de vídeo HTML5 `<video>` com controles ou com atraso perceptível de decodificação.
* Deixar a silhueta retangular do vídeo visível em contraste com o fundo da página (diferença entre off-white `#F5F5F5` e branco puro `#FFFFFF`).

### ✅ O Padrão de Alto Nível (*High-End Product Storytelling*):

* **Integração 100% Homogênea (*Seamless Blend*)**: A animação 3D parece flutuar diretamente no espaço da página, sem caixas, cortes ou molduras.
* **Scroll Bidirecional Quadro a Quadro (*Frame-by-Frame Scrub*)**:
* Rolar para baixo avança a animação no tempo.
* Rolar para cima retrocede a animação.


* **Latência Zero (0ms Seek)**: Resposta tátil instantânea na rolagem rápida, lenta, trackpad ou teclado a 60/120 FPS.
* **Pinning Suave via CSS Sticky**: A seção se fixa no topo da tela enquanto o usuário explora a animação e é liberada suavemente ao final da rolagem.

---

## 2. Arquitetura Técnica & Motivação

### Por que o elemento `<video>` nativo falha no scroll scrub?

Arquivos MP4 (H.264/H.265) comprimem vídeo agrupando quadros em *GOP (Group of Pictures)* com *Keyframes (I-frames)* espaçados a cada 2 a 5 segundos.
Ao mudar continuamente `video.currentTime = X`, o decodificador do navegador precisa buscar o I-frame anterior e calcular os P-frames/B-frames intermediários em uma fila assíncrona. Isso gera **gargalo de CPU/GPU, travamentos e latência perceptível**.

### A Solução: Pipeline HTML5 Canvas + WebP Preload (Padrão Apple)

1. Extrai-se a animação em uma sequência de quadros otimizados em formato `.webp` (ex: 120 quadros a 1280x720 $\approx$ 6MB no total).
2. Equaliza-se o ponto de branco (*White Point Lift*) de modo que o fundo da imagem seja rigorosamente `[255, 255, 255]` (`#FFFFFF`).
3. O componente React pré-carrega os quadros na memória RAM/VRAM via `new Image()`.
4. Um loop a 60/120 FPS com `requestAnimationFrame` e interpolação *Lerp* calcula o progresso de scroll da seção e desenha o quadro no `<canvas>` via `ctx.drawImage()` em **0.05 milissegundos**.

---

## 3. Script de Processamento de Assets

Script em Python para extrair os quadros de qualquer vídeo `.mp4`, equalizar o fundo para branco puro absoluto (`#FFFFFF`) e eliminar linhas/silhuetas de borda.

Salvar como `scripts/process_scroll_frames.py`:

```python
import os
import cv2
import numpy as np
from PIL import Image

def process_video_to_clean_frames(
    video_path: str,
    output_dir: str,
    target_fps: int = 12,
    quality: int = 88,
    edge_pad_px: int = 60,
    white_threshold: float = 225.0
):
    """
    Extrai quadros de um vídeo MP4, equaliza o fundo para branco puro (#FFFFFF)
    e remove qualquer linha ou vinheta periférica.
    """
    os.makedirs(output_dir, exist_ok=True)
    cap = cv2.VideoCapture(video_path)
    
    total_raw_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    native_fps = cap.get(cv2.CAP_PROP_FPS) or 24.0
    step = max(1, int(round(native_fps / target_fps)))
    
    print(f"Processando '{video_path}': {total_raw_frames} quadros (step={step})...")
    
    frame_idx = 0
    saved_count = 0
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
            
        if frame_idx % step == 0:
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            arr = rgb.astype(np.float32)
            h, w, _ = arr.shape
            
            y, x = np.ogrid[:h, :w]
            cy, cx = h / 2.0, w / 2.0
            dist_x = np.abs(x - cx) / cx
            dist_y = np.abs(y - cy) / cy
            
            r, g, b = arr[:,:,0], arr[:,:,1], arr[:,:,2]
            lum = 0.299 * r + 0.587 * g + 0.114 * b
            
            # 1. Nivelamento de ponto de branco (Highlight Lift)
            for c in range(3):
                scaled = arr[:,:,c] * (255.0 / white_threshold)
                arr[:,:,c] = np.where(arr[:,:,c] > 170, np.clip(scaled, 0.0, 255.0), arr[:,:,c])
            
            # 2. Suavização e eliminação de bordas/vinhetas periféricas
            mask_x = np.minimum(x, w - 1 - x) / float(edge_pad_px)
            mask_y = np.minimum(y, h - 1 - y) / float(edge_pad_px)
            edge_fade = np.clip(np.minimum(mask_x, mask_y), 0.0, 1.0)
            
            for c in range(3):
                is_bg = (lum > 140)
                arr[:,:,c] = np.where(is_bg, 255.0 - (255.0 - arr[:,:,c]) * edge_fade, arr[:,:,c])
                
            arr = np.clip(arr, 0.0, 255.0).astype(np.uint8)
            
            out_img = Image.fromarray(arr, 'RGB')
            file_name = f"frame_{saved_count:03d}.webp"
            out_img.save(os.path.join(output_dir, file_name), 'WEBP', quality=quality, method=4)
            saved_count += 1
            
        frame_idx += 1
        
    cap.release()
    print(f"Sucesso! {saved_count} quadros gerados em '{output_dir}'.")

if __name__ == "__main__":
    process_video_to_clean_frames(
        video_path="public/videos/meu-video.mp4",
        output_dir="public/videos/meu-video-frames",
        target_fps=12,
        quality=88
    )

```

---

## 4. Componente React / Next.js / TypeScript Drop-in

Salvar como `components/ui/ScrollDrivenCanvas.tsx`:

```tsx
"use client";

import React, { useEffect, useRef } from "react";

interface ScrollDrivenCanvasProps {
  /** Diretório base onde estão os quadros (ex: '/videos/drone-scan-frames') */
  framesPath: string;
  /** Prefixo dos arquivos (padrão: 'frame_') */
  framePrefix?: string;
  /** Extensão dos arquivos (padrão: '.webp') */
  frameExtension?: string;
  /** Total de quadros da sequência */
  totalFrames: number;
  /** Largura interna do canvas (padrão: 1280) */
  width?: number;
  /** Altura interna do canvas (padrão: 720) */
  height?: number;
  /** Altura da área de scroll (padrão: '240vh') */
  scrollTravel?: string;
  /** Fator de suavização lerp (0.15 = suave, 0.25 = responsivo) */
  smoothing?: number;
  /** Modo de mesclagem CSS para fundos com texturas ou curvas */
  blendMode?: "normal" | "multiply";
  className?: string;
  children?: React.ReactNode;
}

export function ScrollDrivenCanvas({
  framesPath,
  framePrefix = "frame_",
  frameExtension = ".webp",
  totalFrames,
  width = 1280,
  height = 720,
  scrollTravel = "240vh",
  smoothing = 0.22,
  blendMode = "normal",
  className = "",
  children,
}: ScrollDrivenCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const lastRenderedIndexRef = useRef<number>(-1);
  const targetFrameIndexRef = useRef<number>(0);
  const rafIdRef = useRef<number | null>(null);

  const targetProgressRef = useRef<number>(0);
  const currentProgressRef = useRef<number>(0);
  const isReducedMotionRef = useRef<boolean>(false);

  useEffect(() => {
    // 1. Detecção de acessibilidade (Reduced Motion)
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    isReducedMotionRef.current = mediaQuery.matches;
    const handleMotionChange = (e: MediaQueryListEvent) => {
      isReducedMotionRef.current = e.matches;
    };
    mediaQuery.addEventListener("change", handleMotionChange);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 2. Função de renderização com fallback para quadro disponível mais próximo
    const drawFrame = (index: number) => {
      let img = imagesRef.current[index];

      // Se o quadro exato ainda estiver baixando, busca o quadro disponível mais próximo
      if (!img || !img.complete || img.naturalWidth === 0) {
        for (let i = index; i >= 0; i--) {
          if (imagesRef.current[i]?.complete && imagesRef.current[i].naturalWidth > 0) {
            img = imagesRef.current[i];
            break;
          }
        }
        if (!img || !img.complete || img.naturalWidth === 0) {
          for (let i = index + 1; i < totalFrames; i++) {
            if (imagesRef.current[i]?.complete && imagesRef.current[i].naturalWidth > 0) {
              img = imagesRef.current[i];
              break;
            }
          }
        }
      }

      if (img && img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, 0, 0, width, height);
        lastRenderedIndexRef.current = index;
      }
    };

    // 3. Pré-carregamento dos quadros
    const images: HTMLImageElement[] = [];
    for (let i = 0; i < totalFrames; i++) {
      const img = new Image();
      const paddedIndex = String(i).padStart(3, "0");
      img.src = `${framesPath}/${framePrefix}${paddedIndex}${frameExtension}`;

      img.onload = () => {
        if (i === targetFrameIndexRef.current || lastRenderedIndexRef.current === -1) {
          drawFrame(targetFrameIndexRef.current);
        }
      };

      if (img.complete && img.naturalWidth > 0 && lastRenderedIndexRef.current === -1) {
        drawFrame(0);
      }

      images.push(img);
    }
    imagesRef.current = images;

    // 4. Cálculo de progresso de scroll relativo
    const calculateScrollProgress = () => {
      if (!containerRef.current || isReducedMotionRef.current) {
        targetProgressRef.current = 0.5;
        return;
      }

      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight || document.documentElement.clientHeight;
      const scrollDistance = rect.height - windowHeight;

      if (scrollDistance <= 0) {
        targetProgressRef.current = 0;
        return;
      }

      const rawProgress = -rect.top / scrollDistance;
      targetProgressRef.current = Math.max(0, Math.min(1, rawProgress));
    };

    calculateScrollProgress();

    window.addEventListener("scroll", calculateScrollProgress, { passive: true });
    window.addEventListener("resize", calculateScrollProgress, { passive: true });

    // 5. Loop de animação Lerp 60/120 FPS
    const loop = () => {
      const current = currentProgressRef.current;
      const target = targetProgressRef.current;

      const diff = target - current;
      let next = current;

      if (Math.abs(diff) < 0.0002) {
        next = target;
      } else {
        next = current + diff * smoothing;
      }

      currentProgressRef.current = next;

      const targetFrame = Math.min(
        totalFrames - 1,
        Math.max(0, Math.round(next * (totalFrames - 1)))
      );

      targetFrameIndexRef.current = targetFrame;

      if (targetFrame !== lastRenderedIndexRef.current) {
        drawFrame(targetFrame);
      }

      rafIdRef.current = requestAnimationFrame(loop);
    };

    rafIdRef.current = requestAnimationFrame(loop);

    // 6. Cleanup
    return () => {
      mediaQuery.removeEventListener("change", handleMotionChange);
      window.removeEventListener("scroll", calculateScrollProgress);
      window.removeEventListener("resize", calculateScrollProgress);
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [framesPath, framePrefix, frameExtension, totalFrames, width, height, smoothing]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full bg-transparent ${className}`}
      style={{ minHeight: scrollTravel }}
    >
      {/* Container Sticky Fixado durante a exploração de rolagem */}
      <div className="sticky top-0 flex h-[100dvh] w-full flex-col items-center justify-between overflow-hidden px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-6 sm:pb-8">
        
        {/* Renderiza cabeçalhos ou overlays passados como children */}
        {children}

        {/* Canvas de alta performance acelerado por hardware */}
        <div className="relative mx-auto w-full max-w-[1020px] my-auto flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            style={{ mixBlendMode: blendMode }}
            className="block w-full h-auto max-h-[56vh] sm:max-h-[60vh] object-contain object-center select-none pointer-events-none"
          />
        </div>
      </div>
    </div>
  );
}

```

---

## 5. Prompt Mestre Reutilizável

Copie e cole este prompt em qualquer nova tarefa ou projeto para replicar exatamente essa estética e técnica:

```markdown
# BRIEFING & SPEC: ANIMAÇÃO 3D CONTROLADA POR SCROLL (CANVAS 120 FPS ZERO-LAG)

OBJETIVO:
Implementar uma experiência interativa de animação de produto 3D controlada estritamente pelo scroll (frame-by-frame scrub), seguindo o padrão de design da Apple (AirPods/Mac Pro), Linear e Awwwards.

DIRETRIZES VISUAIS & ESTÉTICA:
1. SEM MOLDURAS OU BORDAS: A animação NÃO deve ficar dentro de cards pesados, caixas escuras ou molduras retangulares. Deve parecer desenhada diretamente no espaço da página.
2. FUNDO 100% HOMOGÊNEO: O fundo do asset deve ser equalizado para coincidir exatamente com a cor de fundo da página (ex: #FFFFFF absoluto), sem linhas de corte, vinhetas cinzas ou silhuetas retangulares perceptíveis.
3. SEM POLUIÇÃO DE HUD: Não inserir falsas linhas de laser, retículas ou blocos de estatísticas a menos que seja explicitamente solicitado. Manter foco absoluto no objeto/produto 3D.
4. PINNING SUAVE DA SEÇÃO: Usar container sticky CSS (ex: min-height: 240vh + sticky top-0 h-[100dvh]) para prender a seção durante a exploração e liberá-la suavemente ao fim do scroll.

DIRETRIZES DE PERFORMANCE (ZERO-LAG):
1. NÃO USAR O ELEMENTO <video> NATIVO PARA O SCRUBBING: Decodificação assíncrona de H.264/GOP gera delay, travamento e busca lenta.
2. UTILIZAR MOTOR HTML5 <canvas> + FRAMES WEBP PRÉ-CARREGADOS:
   - Extrair a sequência de quadros (100 a 120 frames) em formato WebP otimizado (qualidade ~85).
   - Nivelar o ponto de branco dos quadros (White Point Lift) via script Python/OpenCV para garantir [255, 255, 255] nas bordas.
   - Pré-carregar os quadros na memória do navegador via new Image().
   - Renderizar no Canvas via ctx.drawImage() dentro de um loop requestAnimationFrame com interpolação suave (Lerp ~0.2).
3. RESPOSTA BIDIRECIONAL IMEDIATA: Scroll down avança a animação; scroll up retrocede imediatamente, com resposta instantânea em menos de 0.1ms na GPU.
4. FALLBACK ROBUSTO: Garantir que o frame mais próximo seja desenhado caso uma imagem demore para carregar, evitando qualquer tela em branco.
5. ACESSIBILIDADE: Respeitar prefers-reduced-motion: reduce desativando o pin longo se o usuário preferir.

```

---

## 6. Checklist de Qualidade

Antes de considerar a implementação concluída em qualquer projeto, valide os itens:

* [ ] **Zero Silhueta / Borda**: As bordas do canvas se fundem 100% invisivelmente com a cor de fundo da página (branco puro ou escuro).
* [ ] **Resposta Imediata**: O objeto se move no exato milissegundo em que o usuário toca na roda do mouse ou trackpad.
* [ ] **Bidirecionalidade Perfeita**: Scroll para baixo avança; scroll para cima volta sem atraso.
* [ ] **Pinning e Liberação Suaves**: A seção fica fixa durante a interação e libera o scroll da página normalmente após o último frame.
* [ ] **Zero Erros de Console**: Sem warnings de seek, sem problemas de hidratação e sem re-renders de estado React no loop de animação.
* [ ] **Testado em Múltiplas Resoluções**: Validado em Desktop (1920x1080, 1440x900) e Mobile (375x812, 390x844).

---

## 7. Compatibilidade Mobile & PWA (Gestão de VRAM e UX)

A arquitetura baseada em HTML5 `<canvas>` é 100% compatível nativamente com navegadores móveis (Safari/Chrome) e PWAs (Progressive Web Apps), entregando uma experiência de aplicativo nativo. No entanto, a implementação requer adaptações específicas de design e engenharia:

### 1. A Sensação Tátil (Momentum Scroll)

No mobile, o scroll é feito por deslizamento e inércia (*momentum*). Graças à função de interpolação matemática (*Lerp*) já incluída no componente React, a animação 3D não para de forma abrupta quando o dedo sai da tela. Ela acompanha a desaceleração natural da página, criando uma sensação física e tátil.

### 2. Adaptação de Layout (Z-Index UI)

Devido à falta de espaço lateral em telas verticais, o modelo 3D passa a ser o protagonista absoluto no fundo. O `<canvas>` deve ficar fixado (*sticky*) ocupando grande parte da tela, enquanto os blocos de texto (idealmente com fundos transparentes ou efeito *glassmorphism*) deslizam **por cima** da animação, com o 3D reagindo no plano de fundo.

### 3. O Fator Crítico: Gestão de Memória (VRAM)

Limites rigorosos de alocação de memória RAM/VRAM por aba (especialmente no Safari do iOS) podem causar o recarregamento forçado da página (erro *"This webpage was reloaded because it was using significant memory"*) se os assets forem muito pesados.

* **Art Direction (Proporção Vertical):** Não reuse a sequência de frames horizontais do desktop. Renderize uma nova sequência de quadros em proporção vertical (ex: 4:5 ou 9:16) focada no objeto.
* **Resolução Otimizada:** Exporte os quadros mobile com no máximo **800x1200 pixels**. A alta densidade de pixels das telas Retina manterá a imagem perfeitamente nítida, cortando o peso do arquivo drasticamente.
* **Peso Máximo Estrito:** A pasta total de quadros `.webp` carregada no mobile não deve ultrapassar **4 a 6 MB**.
* **Lógica de Carregamento Condicional:** O componente ou a página deve detectar o dispositivo/viewport via *Media Queries* ou JS e fazer o download (preload) apenas da pasta de assets apropriada para aquela tela, evitando saturar a rede e a memória do smartphone.