'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useIsMobile } from '@/hooks/useIsMobile';

export type ScrollBlendMode = "normal" | "multiply";

export interface ScrollDrivenCanvasProps {
  /** Diretório base onde estão os quadros (ex: '/videos/drone-scan-frames') */
  framesPath: string;
  /** Diretório alternativo para dispositivos móveis (VRAM / resolução menor) */
  framesPathMobile?: string;
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
  /** Largura interna do canvas — mobile (padrão: 800) */
  widthMobile?: number;
  /** Altura interna do canvas — mobile (padrão: 1200) */
  heightMobile?: number;
  /** Altura da área de scroll (padrão: '240vh') */
  scrollTravel?: string;
  /** Altura da área de scroll — mobile (padrão: '280vh') */
  scrollTravelMobile?: string;
  /** Fator de suavização lerp (0.15 = suave, 0.25 = responsivo) */
  smoothing?: number;
  /** Fator de suavização — mobile (padrão: 0.18, mais fluido no momentum) */
  smoothingMobile?: number;
  /** Modo de mesclagem CSS para fundos com texturas ou curvas */
  blendMode?: ScrollBlendMode;
  /** Classes CSS adicionais */
  className?: string;
  /** Conteúdo sobreposto (títulos, CTAs, etc.) */
  children?: React.ReactNode;
  /** Fallback opcional: imagem ou vídeo a mostrar enquanto os frames carregam */
  fallbackSrc?: string;
  /** Fallback para prefers-reduced-motion: usar vídeo autoplay em vez de scrub */
  reducedMotionVideoSrc?: string;
  /** Pular todo o pinning e mostrar apenas o primeiro/último frame (acessibilidade) */
  disablePinningForReducedMotion?: boolean;
  /** Fator de zoom máximo aplicado ao canvas durante o scroll (efeito parallax leve) */
  maxZoom?: number;
}

const RAF_THRESHOLD = 0.0002;

export function ScrollDrivenCanvas({
  framesPath,
  framesPathMobile,
  framePrefix = "frame_",
  frameExtension = ".webp",
  totalFrames,
  width = 1280,
  height = 720,
  widthMobile = 800,
  heightMobile = 1200,
  scrollTravel = "240vh",
  scrollTravelMobile = "280vh",
  smoothing = 0.22,
  smoothingMobile = 0.18,
  blendMode = "normal",
  className = "",
  children,
  fallbackSrc,
  reducedMotionVideoSrc,
  disablePinningForReducedMotion = true,
  maxZoom = 1.02,
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

  const [preloadProgress, setPreloadProgress] = useState<number>(0);
  const [showFallback, setShowFallback] = useState<boolean>(!!fallbackSrc);
  const [hasEnoughFrames, setHasEnoughFrames] = useState<boolean>(false);

  const isMobile = useIsMobile();

  useEffect(() => {
    const effectiveFramesPath =
      isMobile && framesPathMobile ? framesPathMobile : framesPath;
    const effectiveWidth = isMobile ? widthMobile : width;
    const effectiveHeight = isMobile ? heightMobile : height;
    const effectiveSmoothing = isMobile ? smoothingMobile : smoothing;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    isReducedMotionRef.current = mediaQuery.matches;
    const handleMotionChange = (e: MediaQueryListEvent) => {
      isReducedMotionRef.current = e.matches;
    };
    mediaQuery.addEventListener("change", handleMotionChange);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    canvas.width = effectiveWidth;
    canvas.height = effectiveHeight;

    let preloadedCount = 0;
    const markOnePreloaded = () => {
      preloadedCount += 1;
      const ratio = preloadedCount / totalFrames;
      setPreloadProgress(ratio);
      if (ratio >= 0.25 && !hasEnoughFrames) {
        setHasEnoughFrames(true);
        setShowFallback(false);
      }
    };

    const drawFrame = (index: number) => {
      let img = imagesRef.current[index];

      if (!img || !img.complete || img.naturalWidth === 0) {
        for (let i = index; i >= 0; i--) {
          const candidate = imagesRef.current[i];
          if (candidate?.complete && candidate.naturalWidth > 0) {
            img = candidate;
            break;
          }
        }
        if (!img || !img.complete || img.naturalWidth === 0) {
          for (let i = index + 1; i < totalFrames; i++) {
            const candidate = imagesRef.current[i];
            if (candidate?.complete && candidate.naturalWidth > 0) {
              img = candidate;
              break;
            }
          }
        }
      }

      if (img && img.complete && img.naturalWidth > 0) {
        ctx.clearRect(0, 0, effectiveWidth, effectiveHeight);
        ctx.drawImage(img, 0, 0, effectiveWidth, effectiveHeight);
        lastRenderedIndexRef.current = index;
      }
    };

    const images: HTMLImageElement[] = [];
    for (let i = 0; i < totalFrames; i++) {
      const img = new Image();
      img.decoding = "async";
      img.loading = i < 20 ? "eager" : "lazy";
      const paddedIndex = String(i).padStart(3, "0");
      img.src = `${effectiveFramesPath}/${framePrefix}${paddedIndex}${frameExtension}`;

      img.onload = () => {
        markOnePreloaded();
        if (
          i === targetFrameIndexRef.current ||
          lastRenderedIndexRef.current === -1
        ) {
          drawFrame(targetFrameIndexRef.current);
        }
      };
      img.onerror = () => {
        markOnePreloaded();
      };

      if (img.complete && img.naturalWidth > 0 && lastRenderedIndexRef.current === -1) {
        drawFrame(0);
      }

      images.push(img);
    }
    imagesRef.current = images;

    const calculateScrollProgress = () => {
      if (!containerRef.current) {
        targetProgressRef.current = 0.5;
        return;
      }

      if (isReducedMotionRef.current && disablePinningForReducedMotion) {
        targetProgressRef.current = 1;
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

    const handleScroll = () => calculateScrollProgress();
    const handleResize = () => calculateScrollProgress();

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize, { passive: true });

    const loop = () => {
      const current = currentProgressRef.current;
      const target = targetProgressRef.current;

      const diff = target - current;
      let next = current;

      if (Math.abs(diff) < RAF_THRESHOLD) {
        next = target;
      } else {
        next = current + diff * effectiveSmoothing;
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

      const canvasEl = canvasRef.current;
      if (canvasEl && maxZoom > 1) {
        const zoom = 1 + (maxZoom - 1) * next;
        canvasEl.style.transform = `scale(${zoom.toFixed(4)})`;
        canvasEl.style.transformOrigin = "center center";
      }

      rafIdRef.current = requestAnimationFrame(loop);
    };

    rafIdRef.current = requestAnimationFrame(loop);

    return () => {
      mediaQuery.removeEventListener("change", handleMotionChange);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      imagesRef.current.forEach((img) => {
        img.onload = null;
        img.onerror = null;
        img.src = "";
      });
      imagesRef.current = [];
    };
  }, [
    framesPath,
    framesPathMobile,
    framePrefix,
    frameExtension,
    totalFrames,
    width,
    height,
    widthMobile,
    heightMobile,
    smoothing,
    smoothingMobile,
    maxZoom,
    disablePinningForReducedMotion,
    isMobile,
  ]);

  const effectiveScrollTravel =
    isMobile && scrollTravelMobile ? scrollTravelMobile : scrollTravel;

  const effectiveBlendMode = blendMode;

  return (
    <div
      ref={containerRef}
      className={`relative w-full bg-transparent ${className}`}
      style={{
        minHeight:
          isReducedMotionRef.current && disablePinningForReducedMotion
            ? "auto"
            : effectiveScrollTravel,
      }}
    >
      <div
        className={`sticky top-0 flex w-full flex-col items-center justify-between overflow-hidden ${
          isReducedMotionRef.current && disablePinningForReducedMotion
            ? "h-auto py-6"
            : "h-[100dvh] pt-16 sm:pt-20 pb-6 sm:pb-8"
        }`}
      >
        {children}

        <div className="relative mx-auto w-full my-auto flex items-center justify-center">
          {reducedMotionVideoSrc && isReducedMotionRef.current ? (
            <video
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              className="block w-full h-auto max-h-[56vh] sm:max-h-[60vh] object-contain object-center select-none pointer-events-none"
              aria-hidden="false"
            >
              <source src={reducedMotionVideoSrc} type="video/mp4" />
            </video>
          ) : (
            <>
              {showFallback && fallbackSrc ? (
                <img
                  src={fallbackSrc}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 block w-full h-auto max-h-[56vh] sm:max-h-[60vh] object-contain object-center select-none pointer-events-none opacity-100 transition-opacity duration-500"
                />
              ) : null}

              <canvas
                ref={canvasRef}
                width={width}
                height={height}
                style={{
                  mixBlendMode: effectiveBlendMode,
                  imageRendering: "auto",
                  willChange: "transform",
                }}
                className={`block w-full h-auto max-h-[56vh] sm:max-h-[60vh] object-contain object-center select-none pointer-events-none ${
                  showFallback && fallbackSrc ? "opacity-0" : "opacity-100"
                } transition-opacity duration-500`}
                role="img"
                aria-label="Animação 3D interativa controlada por rolagem"
              />

              {preloadProgress < 1 && !isReducedMotionRef.current ? (
                <div
                  className="absolute bottom-1 left-1/2 h-0.5 w-16 -translate-x-1/2 overflow-hidden rounded-full bg-slate-200/60"
                  aria-hidden="true"
                >
                  <div
                    className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-150"
                    style={{ width: `${Math.round(preloadProgress * 100)}%` }}
                  />
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ScrollDrivenCanvas;
