'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useIsMobile } from '@/hooks/useIsMobile';
import useScrollDrivenFrames from '@/hooks/useScrollDrivenFrames';

export type ScrollBlendMode = 'normal' | 'multiply';

export interface ScrollDrivenCanvasProps {
  framesPath: string;
  framesPathMobile?: string;
  framePrefix?: string;
  frameExtension?: string;
  totalFrames: number;
  width?: number;
  height?: number;
  widthMobile?: number;
  heightMobile?: number;
  scrollTravel?: string;
  scrollTravelMobile?: string;
  smoothing?: number;
  smoothingMobile?: number;
  blendMode?: ScrollBlendMode;
  className?: string;
  children?: React.ReactNode;
  fallbackSrc?: string;
  reducedMotionVideoSrc?: string;
  disablePinningForReducedMotion?: boolean;
  maxZoom?: number;
  autoPlay?: {
    enabled?: boolean;
    durationMs?: number;
    direction?: 'forward' | 'pingpong';
    pauseOnScroll?: boolean;
    pauseOnHover?: boolean;
    resumeIdleAfterMs?: number;
  };
}

export function ScrollDrivenCanvas({
  framesPath,
  framesPathMobile,
  framePrefix = 'frame_',
  frameExtension = '.webp',
  totalFrames,
  width = 1280,
  height = 720,
  widthMobile = 800,
  heightMobile = 1200,
  scrollTravel = '240vh',
  scrollTravelMobile = '280vh',
  smoothing = 0.22,
  smoothingMobile = 0.18,
  blendMode = 'normal',
  className = '',
  children,
  fallbackSrc,
  reducedMotionVideoSrc,
  disablePinningForReducedMotion = true,
  maxZoom = 1.02,
  autoPlay,
}: ScrollDrivenCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const animationEnabled = !prefersReducedMotion;

  const {
    canvasRef,
    progressRef,
    preloadProgress,
    isReady,
    hasRenderedValidFrame,
    hasCriticalFailure,
  } = useScrollDrivenFrames({
    totalFrames,
    enabled: animationEnabled,
    framesPathDesktop: framesPath,
    framesPathMobile,
    framePrefix,
    frameExtension,
    canvasWidthDesktop: width,
    canvasHeightDesktop: height,
    canvasWidthMobile: widthMobile,
    canvasHeightMobile: heightMobile,
    smoothingDesktop: smoothing,
    smoothingMobile,
    travelRef: containerRef as React.RefObject<HTMLElement>,
    preloadReadyThreshold: 0.25,
    autoPlay: animationEnabled ? autoPlay : undefined,
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handleMotionChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };
    mediaQuery.addEventListener('change', handleMotionChange);
    return () => mediaQuery.removeEventListener('change', handleMotionChange);
  }, []);

  useEffect(() => {
    if (maxZoom <= 1) return;

    let frameId = 0;
    const updateZoom = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const zoom = 1 + (maxZoom - 1) * progressRef.current;
        canvas.style.transform = `scale(${zoom.toFixed(4)})`;
        canvas.style.transformOrigin = 'center center';
      }
      frameId = window.requestAnimationFrame(updateZoom);
    };

    frameId = window.requestAnimationFrame(updateZoom);

    return () => window.cancelAnimationFrame(frameId);
  }, [canvasRef, progressRef, maxZoom]);

  const effectiveScrollTravel = useMemo(
    () => (isMobile && scrollTravelMobile ? scrollTravelMobile : scrollTravel),
    [isMobile, scrollTravel, scrollTravelMobile]
  );

  const disableExtendedScroll =
    hasCriticalFailure || (prefersReducedMotion && disablePinningForReducedMotion);

  return (
    <div
      ref={containerRef}
      className={`relative w-full bg-transparent ${className}`}
      style={{ minHeight: disableExtendedScroll ? 'auto' : effectiveScrollTravel }}
    >
      <div
        className={`sticky top-0 flex w-full flex-col items-center justify-between overflow-hidden ${
          disableExtendedScroll ? 'h-auto py-6' : 'h-[100dvh] pt-16 pb-6 sm:pt-20 sm:pb-8'
        }`}
      >
        {children}

        <div className="relative mx-auto my-auto flex w-full items-center justify-center">
          {/* Wrapper comum com edge feathering via CSS mask.
              Preserva ~85% central nítido; fade apenas nas extremidades.
              Responsivo: no mobile (telas estreitas) feather é MENOS agressivo
              para não cortar carro / carregador / elementos principais. */}
          <div
            className="relative w-full"
            style={{
              WebkitMaskImage:
                'linear-gradient(to right, transparent 0%, black 2.5%, black 97.5%, transparent 100%),' +
                'linear-gradient(to bottom, black 0%, black 93%, rgba(0,0,0,0.75) 98%, transparent 100%)',
              maskImage:
                'linear-gradient(to right, transparent 0%, black 2.5%, black 97.5%, transparent 100%),' +
                'linear-gradient(to bottom, black 0%, black 93%, rgba(0,0,0,0.75) 98%, transparent 100%)',
              WebkitMaskComposite: 'source-in, source-in',
              maskComposite: 'intersect, intersect',
              WebkitMaskRepeat: 'no-repeat',
              maskRepeat: 'no-repeat',
              WebkitMaskSize: '100% 100%',
              maskSize: '100% 100%',
            }}
          >
            {hasRenderedValidFrame && fallbackSrc ? (
              <Image
                src={fallbackSrc}
                alt=""
                fill
                aria-hidden="true"
                sizes="100vw"
                className="object-contain object-center select-none pointer-events-none"
                style={{
                  filter: 'blur(8px) saturate(1.04)',
                  WebkitFilter: 'blur(8px) saturate(1.04)',
                  opacity: 0.18,
                  transform: 'scale(1.015)',
                  transformOrigin: 'center center',
                  zIndex: 0,
                }}
              />
            ) : null}

            {reducedMotionVideoSrc && prefersReducedMotion ? (
              <video
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                className="relative z-[1] block h-auto max-h-[56vh] w-full object-contain object-center select-none pointer-events-none sm:max-h-[60vh]"
                aria-hidden="true"
              >
                <source src={reducedMotionVideoSrc} type="video/mp4" />
              </video>
            ) : (
              <>
                {!hasRenderedValidFrame && fallbackSrc ? (
                  <Image
                    src={fallbackSrc}
                    alt=""
                    fill
                    sizes="100vw"
                    unoptimized={false}
                    aria-hidden="true"
                    className="object-contain object-center select-none pointer-events-none opacity-100 transition-opacity duration-500 relative z-[1]"
                  />
                ) : null}

                <canvas
                  ref={canvasRef}
                  width={width}
                  height={height}
                  style={{
                    mixBlendMode: blendMode,
                    imageRendering: 'auto',
                    willChange: 'transform',
                    zIndex: 1,
                  }}
                  className={`relative z-[1] block h-auto max-h-[56vh] w-full object-contain object-center select-none pointer-events-none transition-opacity duration-500 sm:max-h-[60vh] ${
                    hasRenderedValidFrame ? 'opacity-100' : 'opacity-0'
                  }`}
                  role="img"
                  aria-label="Animação 3D interativa controlada por rolagem"
                />

                {preloadProgress < 1 && (isReady || hasRenderedValidFrame) && !prefersReducedMotion ? (
                  <div
                    className="absolute bottom-1 left-1/2 h-0.5 w-16 -translate-x-1/2 overflow-hidden rounded-full bg-slate-200/60"
                    aria-hidden="true"
                    style={{
                      WebkitMaskImage: 'none',
                      maskImage: 'none',
                    }}
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

          {/* Overlays de integração seamless — SÓ NAS EXTREMIDADES.
              Gradientes neutros (branco → transparente) para funcionar em
              qualquer fundo claro. Topo REMOVIDO para preservar telhado / header.
              Todos os overlays são pointer-events-none. */}
          {/* Inferior: fade SÓ NA EXTREMIDADE (8% de altura max) */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'linear-gradient(0deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.45) 2.5%, rgba(255,255,255,0.10) 5.5%, transparent 8%)',
            }}
          />
          {/* Esquerda: feather pequeno na fronteira */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'linear-gradient(90deg, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.30) 3%, rgba(255,255,255,0.06) 6%, transparent 9%)',
            }}
          />
          {/* Direita: feather pequeno na fronteira */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'linear-gradient(270deg, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.30) 3%, rgba(255,255,255,0.06) 6%, transparent 9%)',
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default ScrollDrivenCanvas;
