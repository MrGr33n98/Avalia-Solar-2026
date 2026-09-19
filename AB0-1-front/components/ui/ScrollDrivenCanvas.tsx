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
          {reducedMotionVideoSrc && prefersReducedMotion ? (
            <video
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              className="block h-auto max-h-[56vh] w-full object-contain object-center select-none pointer-events-none sm:max-h-[60vh]"
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
                  className="object-contain object-center select-none pointer-events-none opacity-100 transition-opacity duration-500"
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
                }}
                className={`block h-auto max-h-[56vh] w-full object-contain object-center select-none pointer-events-none transition-opacity duration-500 sm:max-h-[60vh] ${
                  hasRenderedValidFrame ? 'opacity-100' : 'opacity-0'
                }`}
                role="img"
                aria-label="Animação 3D interativa controlada por rolagem"
              />

              {preloadProgress < 1 && (isReady || hasRenderedValidFrame) && !prefersReducedMotion ? (
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
