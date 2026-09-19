'use client';

import { useEffect, useRef, useState } from 'react';
import { useIsMobile } from '@/hooks/useIsMobile';

export interface UseScrollDrivenFramesOptions {
  totalFrames: number;
  framesPathDesktop: string;
  framesPathMobile?: string;
  framePrefix?: string;
  frameExtension?: string;
  canvasWidthDesktop?: number;
  canvasHeightDesktop?: number;
  canvasWidthMobile?: number;
  canvasHeightMobile?: number;
  smoothingDesktop?: number;
  smoothingMobile?: number;
  travelRef?: React.RefObject<HTMLElement> | null;
  preloadReadyThreshold?: number;
}

export interface UseScrollDrivenFramesResult {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  progressRef: React.MutableRefObject<number>;
  currentFrameRef: React.MutableRefObject<number>;
  preloadProgress: number;
  isReady: boolean;
}

const RAF_THRESHOLD = 0.0002;

export function useScrollDrivenFrames({
  totalFrames,
  framesPathDesktop,
  framesPathMobile,
  framePrefix = "frame_",
  frameExtension = ".webp",
  canvasWidthDesktop = 1280,
  canvasHeightDesktop = 720,
  canvasWidthMobile = 800,
  canvasHeightMobile = 1200,
  smoothingDesktop = 0.22,
  smoothingMobile = 0.18,
  travelRef = null,
  preloadReadyThreshold = 0.25,
}: UseScrollDrivenFramesOptions): UseScrollDrivenFramesResult {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const lastRenderedIndexRef = useRef<number>(-1);
  const targetFrameIndexRef = useRef<number>(0);
  const rafIdRef = useRef<number | null>(null);

  const targetProgressRef = useRef<number>(0);
  const currentProgressRef = useRef<number>(0);
  const isReducedMotionRef = useRef<boolean>(false);
  const preloadedCountRef = useRef<number>(0);

  const currentFrameRef = useRef<number>(0);

  const [preloadProgress, setPreloadProgress] = useState<number>(0);
  const [isReady, setIsReady] = useState<boolean>(false);

  const isMobile = useIsMobile();

  useEffect(() => {
    const effectiveFramesPath =
      isMobile && framesPathMobile ? framesPathMobile : framesPathDesktop;
    const effectiveWidth = isMobile ? canvasWidthMobile : canvasWidthDesktop;
    const effectiveHeight = isMobile ? canvasHeightMobile : canvasHeightDesktop;
    const effectiveSmoothing = isMobile ? smoothingMobile : smoothingDesktop;

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

    const markOnePreloaded = () => {
      preloadedCountRef.current += 1;
      const ratio = preloadedCountRef.current / totalFrames;
      setPreloadProgress(ratio);
      if (ratio >= preloadReadyThreshold && !isReady) {
        setIsReady(true);
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
      img.loading = i < 24 ? "eager" : "lazy";
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
      const travelEl =
        (travelRef?.current as HTMLElement | null) ??
        (canvasRef.current?.closest("[data-scroll-travel]") as HTMLElement | null);

      if (!travelEl) {
        targetProgressRef.current = 0.5;
        return;
      }

      const rect = travelEl.getBoundingClientRect();
      const windowHeight = window.innerHeight || document.documentElement.clientHeight;
      const scrollDistance = rect.height - windowHeight;

      if (scrollDistance <= 0) {
        targetProgressRef.current = isReducedMotionRef.current ? 1 : 0;
        return;
      }

      const rawProgress = -rect.top / scrollDistance;
      const clamped = Math.max(0, Math.min(1, rawProgress));
      targetProgressRef.current = isReducedMotionRef.current && clamped >= 0.5 ? 1 : clamped;
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
      currentFrameRef.current = targetFrame;

      if (targetFrame !== lastRenderedIndexRef.current) {
        drawFrame(targetFrame);
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
    totalFrames,
    framesPathDesktop,
    framesPathMobile,
    framePrefix,
    frameExtension,
    canvasWidthDesktop,
    canvasHeightDesktop,
    canvasWidthMobile,
    canvasHeightMobile,
    smoothingDesktop,
    smoothingMobile,
    travelRef,
    preloadReadyThreshold,
    isMobile,
  ]);

  return {
    canvasRef,
    progressRef: currentProgressRef,
    currentFrameRef,
    preloadProgress,
    isReady,
  };
}

export default useScrollDrivenFrames;
