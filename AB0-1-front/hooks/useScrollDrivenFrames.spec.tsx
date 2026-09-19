import { beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, render, screen, waitFor } from '@testing-library/react';
import useScrollDrivenFrames, {
  clampProgress,
  getTargetFrameIndex,
  resolveDrawableFrameIndex,
} from './useScrollDrivenFrames';

jest.mock('@/hooks/useIsMobile', () => ({
  useIsMobile: () => false,
}));

type FrameOutcome = 'load' | 'error';

const drawImageMock = jest.fn();
const clearRectMock = jest.fn();
const setTransformMock = jest.fn();
const imageRegistry = new Map<number, MockImage>();
let autoResolve = true;
let frameOutcomes: Record<number, FrameOutcome> = {};

class MockImage {
  onload: ((event?: Event) => void) | null = null;
  onerror: ((event?: Event) => void) | null = null;
  decoding = 'async';
  loading: 'eager' | 'lazy' = 'lazy';
  fetchPriority: 'high' | 'low' | 'auto' = 'auto';
  complete = false;
  naturalWidth = 0;
  naturalHeight = 0;
  private frameIndex = -1;
  private currentSrc = '';

  set src(value: string) {
    this.currentSrc = value;
    const match = value.match(/frame_(\d+)\./);
    this.frameIndex = match ? Number(match[1]) : -1;
    imageRegistry.set(this.frameIndex, this);

    if (!autoResolve) return;

    queueMicrotask(() => {
      const outcome = frameOutcomes[this.frameIndex] ?? 'load';
      if (outcome === 'error') {
        this.emitError();
        return;
      }

      this.emitLoad();
    });
  }

  get src() {
    return this.currentSrc;
  }

  emitLoad() {
    this.complete = true;
    this.naturalWidth = 1280;
    this.naturalHeight = 720;
    this.onload?.(new Event('load'));
  }

  emitError() {
    this.complete = false;
    this.naturalWidth = 0;
    this.naturalHeight = 0;
    this.onerror?.(new Event('error'));
  }
}

const readState = () =>
  JSON.parse(screen.getByTestId('hook-state').textContent || '{}') as {
    preloadProgress: number;
    isReady: boolean;
    hasRenderedValidFrame: boolean;
    hasCriticalFailure: boolean;
    loadedFrameCount: number;
    failedFrameCount: number;
    requestedFrame: number;
    resolvedFrame: number;
    currentFrame: number;
  };

function HookProbe({
  totalFrames = 4,
  enabled = true,
}: {
  totalFrames?: number;
  enabled?: boolean;
}) {
  const {
    canvasRef,
    preloadProgress,
    isReady,
    hasRenderedValidFrame,
    hasCriticalFailure,
    loadedFrameCount,
    failedFrameCount,
    requestedFrameRef,
    resolvedFrameRef,
    currentFrameRef,
  } = useScrollDrivenFrames({
    totalFrames,
    enabled,
    framesPathDesktop: '/videos/frames',
    preloadReadyThreshold: 0.25,
  });

  return (
    <div>
      <canvas ref={canvasRef} />
      <output data-testid="hook-state">
        {JSON.stringify({
          preloadProgress,
          isReady,
          hasRenderedValidFrame,
          hasCriticalFailure,
          loadedFrameCount,
          failedFrameCount,
          requestedFrame: requestedFrameRef.current,
          resolvedFrame: resolvedFrameRef.current,
          currentFrame: currentFrameRef.current,
        })}
      </output>
    </div>
  );
}

const triggerFrame = (index: number, outcome: FrameOutcome) => {
  const image = imageRegistry.get(index);
  if (!image) {
    throw new Error(`Frame ${index} ainda não foi solicitado pelo hook.`);
  }

  if (outcome === 'error') {
    image.emitError();
    return;
  }

  image.emitLoad();
};

describe('useScrollDrivenFrames', () => {
  beforeAll(() => {
    Object.defineProperty(global, 'Image', {
      configurable: true,
      writable: true,
      value: MockImage,
    });

    Object.defineProperty(window, 'requestAnimationFrame', {
      configurable: true,
      writable: true,
      value: jest.fn(() => 1),
    });

    Object.defineProperty(window, 'cancelAnimationFrame', {
      configurable: true,
      writable: true,
      value: jest.fn(),
    });

    Object.defineProperty(window, 'devicePixelRatio', {
      configurable: true,
      writable: true,
      value: 1,
    });

    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      configurable: true,
      value: jest.fn(() => ({
        clearRect: clearRectMock,
        drawImage: drawImageMock,
        setTransform: setTransformMock,
        imageSmoothingEnabled: true,
      })),
    });
  });

  beforeEach(() => {
    autoResolve = true;
    frameOutcomes = {};
    imageRegistry.clear();
    drawImageMock.mockClear();
    clearRectMock.mockClear();
    setTransformMock.mockClear();
  });

  it('faz clamp do progresso e calcula o frame alvo corretamente', () => {
    expect(clampProgress(-0.4)).toBe(0);
    expect(clampProgress(0.5)).toBe(0.5);
    expect(clampProgress(1.4)).toBe(1);

    expect(getTargetFrameIndex(0, 120)).toBe(0);
    expect(getTargetFrameIndex(0.5, 120)).toBe(60);
    expect(getTargetFrameIndex(1, 120)).toBe(119);
  });

  it('resolve o frame desenhavel usando fallback proximo', () => {
    expect(resolveDrawableFrameIndex(2, ['loaded', 'loaded', 'failed', 'pending'])).toBe(1);
    expect(resolveDrawableFrameIndex(0, ['failed', 'loaded', 'pending'])).toBe(1);
    expect(resolveDrawableFrameIndex(3, ['failed', 'pending', 'loaded', 'failed'])).toBe(2);
  });

  it('nao conta onerror como frame carregado nem marca readiness prematuro', async () => {
    frameOutcomes = {
      0: 'error',
      1: 'load',
      2: 'error',
      3: 'error',
    };

    render(<HookProbe totalFrames={4} />);

    await waitFor(() => {
      const state = readState();
      expect(state.loadedFrameCount).toBe(1);
      expect(state.failedFrameCount).toBe(3);
    });

    const state = readState();
    expect(state.isReady).toBe(false);
    expect(state.hasRenderedValidFrame).toBe(true);
    expect(state.requestedFrame).toBe(0);
    expect(state.resolvedFrame).toBe(1);
    expect(state.currentFrame).toBe(1);
  });

  it('mantem o fallback ate existir um frame realmente desenhado', async () => {
    autoResolve = false;

    render(<HookProbe totalFrames={2} />);

    expect(readState().hasRenderedValidFrame).toBe(false);
    expect(drawImageMock).not.toHaveBeenCalled();

    act(() => {
      triggerFrame(0, 'load');
    });

    await waitFor(() => {
      expect(readState().hasRenderedValidFrame).toBe(true);
    });

    expect(drawImageMock).toHaveBeenCalled();
  });

  it('sinaliza fail-safe quando todos os frames criticos falham', async () => {
    frameOutcomes = {
      0: 'error',
      1: 'error',
      2: 'error',
      3: 'error',
    };

    render(<HookProbe totalFrames={4} />);

    await waitFor(() => {
      expect(readState().hasCriticalFailure).toBe(true);
    });

    expect(readState().hasRenderedValidFrame).toBe(false);
    expect(drawImageMock).not.toHaveBeenCalled();
  });

  it('nao solicita frames quando a animacao esta desabilitada', () => {
    render(<HookProbe totalFrames={4} enabled={false} />);

    expect(imageRegistry.size).toBe(0);
    expect(readState().loadedFrameCount).toBe(0);
    expect(readState().failedFrameCount).toBe(0);
  });
});
