'use client';

import { useEffect, useRef, useState, type MutableRefObject, type RefObject } from 'react';
import { useIsMobile } from '@/hooks/useIsMobile';

export type FrameLoadState = 'pending' | 'loaded' | 'failed';

export interface UseScrollDrivenFramesOptions {
  totalFrames: number;
  enabled?: boolean;
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
  travelRef?: RefObject<HTMLElement> | null;
  preloadReadyThreshold?: number;
  autoPlay?: {
    enabled?: boolean;
    durationMs?: number;
    direction?: 'forward' | 'pingpong';
    pauseOnScroll?: boolean;
    pauseOnHover?: boolean;
    resumeIdleAfterMs?: number;
  };
}

export interface UseScrollDrivenFramesResult {
  canvasRef: RefObject<HTMLCanvasElement>;
  progressRef: MutableRefObject<number>;
  currentFrameRef: MutableRefObject<number>;
  requestedFrameRef: MutableRefObject<number>;
  resolvedFrameRef: MutableRefObject<number>;
  preloadProgress: number;
  isReady: boolean;
  hasRenderedValidFrame: boolean;
  hasCriticalFailure: boolean;
  loadedFrameCount: number;
  failedFrameCount: number;
}

const RAF_THRESHOLD = 0.0002;
const INITIAL_FRAME_WINDOW = 16;
const BACKGROUND_BATCH_SIZE = 8;
const BACKGROUND_BATCH_DELAY_MS = 180;
const TARGET_WINDOW_RADIUS = 4;

export function clampProgress(progress: number): number {
  return Math.max(0, Math.min(1, progress));
}

export function getTargetFrameIndex(progress: number, totalFrames: number): number {
  if (totalFrames <= 1) return 0;
  return Math.min(
    totalFrames - 1,
    Math.max(0, Math.round(clampProgress(progress) * (totalFrames - 1)))
  );
}

export function resolveDrawableFrameIndex(
  requestedIndex: number,
  frameStates: FrameLoadState[]
): number | null {
  if (frameStates.length === 0) return null;

  const safeRequestedIndex = Math.min(frameStates.length - 1, Math.max(0, requestedIndex));

  if (frameStates[safeRequestedIndex] === 'loaded') {
    return safeRequestedIndex;
  }

  for (let index = safeRequestedIndex - 1; index >= 0; index -= 1) {
    if (frameStates[index] === 'loaded') {
      return index;
    }
  }

  for (let index = safeRequestedIndex + 1; index < frameStates.length; index += 1) {
    if (frameStates[index] === 'loaded') {
      return index;
    }
  }

  return frameStates[0] === 'loaded' ? 0 : null;
}

export function hasCriticalFrameFailure(
  frameStates: FrameLoadState[],
  criticalFrameCount = Math.min(INITIAL_FRAME_WINDOW, frameStates.length)
): boolean {
  if (criticalFrameCount === 0) return false;

  const criticalStates = frameStates.slice(0, criticalFrameCount);
  const allSettled = criticalStates.every((state) => state !== 'pending');
  const hasAnyLoaded = criticalStates.some((state) => state === 'loaded');

  return allSettled && !hasAnyLoaded;
}

export function useScrollDrivenFrames({
  totalFrames,
  enabled = true,
  framesPathDesktop,
  framesPathMobile,
  framePrefix = 'frame_',
  frameExtension = '.webp',
  canvasWidthDesktop = 1280,
  canvasHeightDesktop = 720,
  canvasWidthMobile = 800,
  canvasHeightMobile = 1200,
  smoothingDesktop = 0.22,
  smoothingMobile = 0.18,
  travelRef = null,
  preloadReadyThreshold = 0.25,
  autoPlay,
}: UseScrollDrivenFramesOptions): UseScrollDrivenFramesResult {
  const autoPlayEnabled = Boolean(autoPlay?.enabled);
  const autoPlayDurationMs = autoPlay?.durationMs ?? 10000;
  const autoPlayDirection = autoPlay?.direction ?? 'pingpong';
  const autoPauseOnScroll = autoPlay?.pauseOnScroll ?? true;
  const autoPauseOnHover = autoPlay?.pauseOnHover ?? true;
  const autoResumeIdleAfterMs = autoPlay?.resumeIdleAfterMs ?? 3500;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<(HTMLImageElement | null)[]>([]);
  const frameStatesRef = useRef<FrameLoadState[]>([]);
  const requestedFrameIndexesRef = useRef<Set<number>>(new Set());
  const backgroundTimeoutsRef = useRef<number[]>([]);
  const lastRenderedIndexRef = useRef<number>(-1);
  const targetFrameIndexRef = useRef<number>(0);
  const resolvedFrameRef = useRef<number>(-1);
  const requestedFrameRef = useRef<number>(0);
  const rafIdRef = useRef<number | null>(null);
  const targetProgressRef = useRef<number>(0);
  const currentProgressRef = useRef<number>(0);
  const scrollTargetProgressRef = useRef<number>(0);
  const isReducedMotionRef = useRef<boolean>(false);
  const loadedCountRef = useRef<number>(0);
  const failedCountRef = useRef<number>(0);
  const hasRenderedValidFrameRef = useRef<boolean>(false);
  const currentFrameRef = useRef<number>(0);
  const lastUserScrollAtRef = useRef<number>(-Infinity);
  const isHoveringCanvasRef = useRef<boolean>(false);
  const autoPlayStartRef = useRef<number>(0);
  const autoPlayPhaseRef = useRef<1 | -1>(1);

  const [preloadProgress, setPreloadProgress] = useState<number>(0);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [hasRenderedValidFrame, setHasRenderedValidFrame] = useState<boolean>(false);
  const [hasCriticalFailure, setHasCriticalFailure] = useState<boolean>(false);
  const [loadedFrameCount, setLoadedFrameCount] = useState<number>(0);
  const [failedFrameCount, setFailedFrameCount] = useState<number>(0);

  const isMobile = useIsMobile();

  useEffect(() => {
    const effectiveFramesPath =
      isMobile && framesPathMobile ? framesPathMobile : framesPathDesktop;
    const effectiveWidth = isMobile ? canvasWidthMobile : canvasWidthDesktop;
    const effectiveHeight = isMobile ? canvasHeightMobile : canvasHeightDesktop;
    const effectiveSmoothing = isMobile ? smoothingMobile : smoothingDesktop;
    const criticalFrameCount = Math.min(INITIAL_FRAME_WINDOW, totalFrames);

    backgroundTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    backgroundTimeoutsRef.current = [];

    setPreloadProgress(0);
    setIsReady(false);
    setHasRenderedValidFrame(false);
    setHasCriticalFailure(false);
    setLoadedFrameCount(0);
    setFailedFrameCount(0);

    loadedCountRef.current = 0;
    failedCountRef.current = 0;
    hasRenderedValidFrameRef.current = false;
    lastRenderedIndexRef.current = -1;
    targetFrameIndexRef.current = 0;
    requestedFrameRef.current = 0;
    resolvedFrameRef.current = -1;
    currentFrameRef.current = 0;
    currentProgressRef.current = 0;
    targetProgressRef.current = 0;
    requestedFrameIndexesRef.current = new Set();
    imagesRef.current = Array.from({ length: totalFrames }, () => null);
    frameStatesRef.current = Array.from({ length: totalFrames }, () => 'pending');

    if (!enabled || totalFrames <= 0) {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    isReducedMotionRef.current = mediaQuery.matches;
    const handleMotionChange = (event: MediaQueryListEvent) => {
      isReducedMotionRef.current = event.matches;
    };
    mediaQuery.addEventListener('change', handleMotionChange);

    const canvas = canvasRef.current;
    if (!canvas) {
      mediaQuery.removeEventListener('change', handleMotionChange);
      return;
    }

    const context = canvas.getContext('2d', { alpha: true });
    if (!context) {
      mediaQuery.removeEventListener('change', handleMotionChange);
      return;
    }

    const syncCanvasSize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(effectiveWidth * dpr);
      canvas.height = Math.round(effectiveHeight * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.imageSmoothingEnabled = true;
    };

    syncCanvasSize();

    const updateReadiness = () => {
      const ratio = totalFrames > 0 ? loadedCountRef.current / totalFrames : 0;
      setPreloadProgress(ratio);
      setLoadedFrameCount(loadedCountRef.current);
      setFailedFrameCount(failedCountRef.current);
      setIsReady(ratio >= preloadReadyThreshold && frameStatesRef.current[0] === 'loaded');
      setHasCriticalFailure(hasCriticalFrameFailure(frameStatesRef.current, criticalFrameCount));
    };

    const drawFrame = (requestedIndex: number): boolean => {
      const resolvedIndex = resolveDrawableFrameIndex(requestedIndex, frameStatesRef.current);
      if (resolvedIndex === null) {
        return false;
      }

      const image = imagesRef.current[resolvedIndex];
      if (!image || !image.complete || image.naturalWidth === 0) {
        return false;
      }

      context.clearRect(0, 0, effectiveWidth, effectiveHeight);
      context.drawImage(image, 0, 0, effectiveWidth, effectiveHeight);

      lastRenderedIndexRef.current = resolvedIndex;
      resolvedFrameRef.current = resolvedIndex;
      currentFrameRef.current = resolvedIndex;

      if (!hasRenderedValidFrameRef.current) {
        hasRenderedValidFrameRef.current = true;
        setHasRenderedValidFrame(true);
      }

      return true;
    };

    const requestFrame = (index: number, priority: 'high' | 'low' = 'low') => {
      if (index < 0 || index >= totalFrames) return;
      if (requestedFrameIndexesRef.current.has(index)) return;

      requestedFrameIndexesRef.current.add(index);

      const image = new Image();
      image.decoding = 'async';
      image.loading = priority === 'high' ? 'eager' : 'lazy';

      try {
        (image as HTMLImageElement & { fetchPriority?: 'high' | 'low' | 'auto' }).fetchPriority =
          priority;
      } catch {
        // Nem todos os navegadores expõem fetchPriority no HTMLImageElement.
      }

      const paddedIndex = String(index).padStart(3, '0');
      image.src = `${effectiveFramesPath}/${framePrefix}${paddedIndex}${frameExtension}`;

      image.onload = () => {
        if (frameStatesRef.current[index] !== 'loaded') {
          frameStatesRef.current[index] = 'loaded';
          loadedCountRef.current += 1;
          updateReadiness();
        }

        if (
          index === 0 ||
          index === targetFrameIndexRef.current ||
          lastRenderedIndexRef.current === -1
        ) {
          drawFrame(targetFrameIndexRef.current);
        }
      };

      image.onerror = () => {
        if (frameStatesRef.current[index] !== 'failed') {
          frameStatesRef.current[index] = 'failed';
          failedCountRef.current += 1;
          updateReadiness();
        }
      };

      imagesRef.current[index] = image;
    };

    const primeInitialFrames = () => {
      for (let index = 0; index < criticalFrameCount; index += 1) {
        requestFrame(index, 'high');
      }
    };

    const primeTargetWindow = (centerIndex: number) => {
      requestFrame(centerIndex, 'high');

      for (let offset = 1; offset <= TARGET_WINDOW_RADIUS; offset += 1) {
        requestFrame(centerIndex - offset, 'high');
        requestFrame(centerIndex + offset, 'high');
      }
    };

    const scheduleBackgroundPreload = () => {
      let nextIndex = criticalFrameCount;

      const loadNextBatch = () => {
        const batchEnd = Math.min(totalFrames, nextIndex + BACKGROUND_BATCH_SIZE);
        for (let index = nextIndex; index < batchEnd; index += 1) {
          requestFrame(index, 'low');
        }

        nextIndex = batchEnd;

        if (nextIndex < totalFrames) {
          const timeoutId = window.setTimeout(loadNextBatch, BACKGROUND_BATCH_DELAY_MS);
          backgroundTimeoutsRef.current.push(timeoutId);
        }
      };

      const timeoutId = window.setTimeout(loadNextBatch, BACKGROUND_BATCH_DELAY_MS);
      backgroundTimeoutsRef.current.push(timeoutId);
    };

    const calculateScrollProgress = () => {
      const travelElement =
        (travelRef?.current as HTMLElement | null) ??
        (canvasRef.current?.closest('[data-scroll-travel]') as HTMLElement | null);

      if (!travelElement) {
        scrollTargetProgressRef.current = 0;
        return;
      }

      const rect = travelElement.getBoundingClientRect();
      const windowHeight = window.innerHeight || document.documentElement.clientHeight;
      const scrollDistance = rect.height - windowHeight;

      if (scrollDistance <= 0) {
        scrollTargetProgressRef.current = isReducedMotionRef.current ? 1 : 0;
        return;
      }

      const rawProgress = -rect.top / scrollDistance;
      const clampedProgress = clampProgress(rawProgress);
      scrollTargetProgressRef.current =
        isReducedMotionRef.current && clampedProgress >= 0.5 ? 1 : clampedProgress;

      if (autoPauseOnScroll) {
        lastUserScrollAtRef.current = performance.now();
      }
    };

    primeInitialFrames();
    scheduleBackgroundPreload();
    calculateScrollProgress();
    autoPlayStartRef.current = performance.now();

    const handleScroll = () => calculateScrollProgress();
    const handleResize = () => {
      syncCanvasSize();
      calculateScrollProgress();
    };

    const handleMouseEnter = () => {
      if (autoPauseOnHover) {
        isHoveringCanvasRef.current = true;
      }
    };
    const handleMouseLeave = () => {
      if (autoPauseOnHover) {
        isHoveringCanvasRef.current = false;
        autoPlayStartRef.current =
          performance.now() -
          getAutoPlayElapsedFromProgress(currentProgressRef.current);
      }
    };

    const getAutoPlayElapsedFromProgress = (progress: number): number => {
      const duration = Math.max(100, autoPlayDurationMs);
      if (autoPlayDirection === 'forward') {
        return progress * duration;
      }
      const half = duration / 2;
      if (progress >= 0.5) {
        return (1 - progress) * half + half;
      }
      return progress * half;
    };

    const calculateAutoPlayProgress = (now: number): number | null => {
      if (!autoPlayEnabled) return null;
      if (isReducedMotionRef.current) return null;

      if (autoPauseOnScroll) {
        const idleMs = now - lastUserScrollAtRef.current;
        if (idleMs < autoResumeIdleAfterMs) return null;
      }
      if (autoPauseOnHover && isHoveringCanvasRef.current) return null;

      const duration = Math.max(100, autoPlayDurationMs);
      let elapsed = now - autoPlayStartRef.current;
      if (elapsed < 0) elapsed = 0;

      if (autoPlayDirection === 'forward') {
        const mod = elapsed % duration;
        const phase = Math.sign(autoPlayPhaseRef.current);
        if (phase === 1) return clampProgress(mod / duration);
        return clampProgress(1 - mod / duration);
      }

      const cycle = (elapsed % duration);
      const half = duration / 2;
      if (cycle < half) {
        autoPlayPhaseRef.current = 1;
        return clampProgress(cycle / half);
      }
      autoPlayPhaseRef.current = -1;
      return clampProgress(1 - (cycle - half) / half);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });
    canvas.addEventListener('mouseenter', handleMouseEnter, { passive: true });
    canvas.addEventListener('mouseleave', handleMouseLeave, { passive: true });

    const loop = () => {
      const now = performance.now();
      const autoProgress = calculateAutoPlayProgress(now);
      if (autoProgress !== null) {
        targetProgressRef.current = autoProgress;
      } else {
        targetProgressRef.current = scrollTargetProgressRef.current;
      }

      const currentProgress = currentProgressRef.current;
      const targetProgress = targetProgressRef.current;
      const diff = targetProgress - currentProgress;

      const nextProgress =
        Math.abs(diff) < RAF_THRESHOLD
          ? targetProgress
          : currentProgress + diff * effectiveSmoothing;

      currentProgressRef.current = nextProgress;

      const targetFrameIndex = getTargetFrameIndex(nextProgress, totalFrames);
      targetFrameIndexRef.current = targetFrameIndex;
      requestedFrameRef.current = targetFrameIndex;

      primeTargetWindow(targetFrameIndex);

      if (targetFrameIndex !== lastRenderedIndexRef.current) {
        drawFrame(targetFrameIndex);
      }

      rafIdRef.current = window.requestAnimationFrame(loop);
    };

    rafIdRef.current = window.requestAnimationFrame(loop);

    return () => {
      mediaQuery.removeEventListener('change', handleMotionChange);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mouseenter', handleMouseEnter);
      canvas.removeEventListener('mouseleave', handleMouseLeave);

      if (rafIdRef.current !== null) {
        window.cancelAnimationFrame(rafIdRef.current);
      }

      backgroundTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
      backgroundTimeoutsRef.current = [];

      imagesRef.current.forEach((image) => {
        if (!image) return;
        image.onload = null;
        image.onerror = null;
        image.src = '';
      });

      imagesRef.current = [];
      requestedFrameIndexesRef.current.clear();
      frameStatesRef.current = [];
    };
  }, [
    totalFrames,
    enabled,
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
    autoPlayEnabled,
    autoPlayDurationMs,
    autoPlayDirection,
    autoPauseOnScroll,
    autoPauseOnHover,
    autoResumeIdleAfterMs,
  ]);

  return {
    canvasRef,
    progressRef: currentProgressRef,
    currentFrameRef,
    requestedFrameRef,
    resolvedFrameRef,
    preloadProgress,
    isReady,
    hasRenderedValidFrame,
    hasCriticalFailure,
    loadedFrameCount,
    failedFrameCount,
  };
}

export default useScrollDrivenFrames;
