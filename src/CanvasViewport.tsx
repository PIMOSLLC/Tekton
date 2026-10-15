import { useEffect, useRef, useState } from 'react';
import {
  TransformWrapper,
  TransformComponent,
} from 'react-zoom-pan-pinch';
import type { ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';
import { Minus, Plus, Maximize, RotateCcw, Grid3x3 } from 'lucide-react';
import type { ReactNode } from 'react';

export interface CanvasViewportProps {
  /** The canvas content — rendered at its natural layout size and scaled. */
  children: ReactNode;
  /** Re-fit when this changes (e.g. stage/lane counts reshape the grid). */
  fitKey?: string | number;
}

/**
 * The zoom family — every affordance reads like one language of deliberate
 * amounts (owner direction: movement must be DETERMINED and precise):
 *
 *   wheel notch     ×1.07^(±1) anchored at the cursor  (~10 notches ≈ 2×)
 *   button press    ±0.15 scale, anchored at the view center
 *   double-click    ±0.20 scale, the zoom-in direction
 *
 * The wheel channel is owned HERE, quantized to whole notches. The
 * library's own wheel zoom couples the step to the raw delta magnitude
 * (`scale += step × |deltaY|`) — with a Chrome notch's ≈±100px delta and a
 * 0.15 step, one tick asked for +15 and clamped instantly into the ceiling:
 * the momentum-rocket the owner reported. Instead, scroll accumulates into
 * a residue (micro-ripples bank; each crossing of one notch's worth fires
 * exactly one multiplicative step, cursor-anchored, clamped to the range).
 */
const MIN_SCALE = 0.15;
const MAX_SCALE = 3;
const WHEEL_NOTCH_PX = 100;
const WHEEL_STEP_RATIO = 0.07;
/** Firefox reports line-mode wheel deltas (≈1/3 of a notch per line). */
export const LINE_PX = 33;
const WHEEL_ANIMATION_MS = 100;
const BUTTON_STEP = 0.15;
const DOUBLE_CLICK_STEP = 0.2;

export function CanvasViewport({ children, fitKey }: CanvasViewportProps) {
  const [scale, setScale] = useState(1);
  // View state: the dot-grid backdrop (design-tool feel; decorative, pointer-transparent).
  const [gridOn, setGridOn] = useState(true);
  // The pan/zoom API via a ref object (never setState during commit — React
  // forbids that ref-callback pattern); an effect re-renders once after
  // mount/reshape so the tools receive the filled api. The tools live OUTSIDE
  // the transform (stable in the band — never panned, zoomed, or clipped).
  const apiRef = useRef<ReactZoomPanPinchRef | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const residueRef = useRef(0);
  /** The last requested zoom target — while an animation runs, further
   * compounding chains from the SETTLED value, not the interpolated frame. */
  const targetRef = useRef<number | null>(null);
  const [wired, setWired] = useState(0);
  useEffect(() => {
    residueRef.current = 0;
    targetRef.current = null;
    setWired((w) => w + 1);
  }, [fitKey]);

  const liveScale = (): number => {
    const target = targetRef.current;
    if (target !== null) return target;
    const live = apiRef.current?.state?.scale;
    return typeof live === 'number' && Number.isFinite(live) ? live : 1;
  };

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const wheel = (e: WheelEvent) => {
      // The canvas owns the wheel — never the page (the app shell has no
      // page scroll, but an embedded frame or a resized band might).
      e.preventDefault();
      const api = apiRef.current;
      if (!api) return;
      // A horizontal-dominant wheel (Magic Mouse swipe) pans nothing here —
      // pan is by drag; it must never masquerade as zoom.
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      const lineHeight = root.clientHeight || 720;
      const delta = e.deltaMode === 1 ? e.deltaY * LINE_PX : e.deltaMode === 2 ? e.deltaY * lineHeight : e.deltaY;
      residueRef.current += delta;
      const notches = Math.trunc(residueRef.current / WHEEL_NOTCH_PX);
      if (notches === 0) return;
      residueRef.current -= notches * WHEEL_NOTCH_PX;
      // Scroll up (deltaY < 0) zooms in — the library's own convention.
      const target = Math.min(
        MAX_SCALE,
        Math.max(MIN_SCALE, Math.round(liveScale() * Math.pow(1 + WHEEL_STEP_RATIO, -notches) * 100) / 100),
      );
      if (Math.abs(target - liveScale()) < 0.005) {
        targetRef.current = null;
        return;
      }
      targetRef.current = target;
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      void api
        .zoomToPoint(target, e.clientX, e.clientY, reduced ? 0 : WHEEL_ANIMATION_MS, 'easeOut')
        .finally(() => {
          if (targetRef.current === target) targetRef.current = null;
        });
    };
    root.addEventListener('wheel', wheel, { passive: false });
    return () => root.removeEventListener('wheel', wheel);
  }, []);

  return (
    <div
      ref={rootRef}
      className={`relative h-full w-full tk-panzoom ${gridOn ? 'tk-canvas-dotgrid' : ''}`}
    >
      <TransformWrapper
        ref={(r: ReactZoomPanPinchRef | null) => {
          apiRef.current = r;
        }}
        key={String(fitKey ?? '')}
        initialScale={1}
        minScale={MIN_SCALE}
        maxScale={MAX_SCALE}
        fitOnInit="contain"
        centerOnInit
        centerZoomedOut
        wheel={{ disabled: true }}
        doubleClick={{ mode: 'zoomIn', step: DOUBLE_CLICK_STEP }}
        limitToBounds={false}
        onTransform={(_ref: ReactZoomPanPinchRef, state: { scale: number; positionX: number; positionY: number }) => {
          // Every library setState (native pan, pinch, button/double-click
          // animation frames) lands here — the readout is always live truth.
          if (Number.isFinite(state.scale)) setScale(state.scale);
        }}
      >
        <TransformComponent wrapperClass="!h-full !w-full" contentClass="!w-max">
          {children}
        </TransformComponent>
      </TransformWrapper>
      <CanvasTools api={wired ? apiRef.current : null} scale={scale} initial={1} gridOn={gridOn} onToggleGrid={() => setGridOn((v) => !v)} />
    </div>
  );
}

/**
 * Control cluster — a SIBLING of the transform (positioned bottom-center of
 * the canvas band, never panned or clipped), driving the transform via the
 * wrapper ref. The ref fills on mount; before that the buttons no-op.
 */
function CanvasTools({
  api,
  scale,
  initial,
  gridOn,
  onToggleGrid,
}: {
  api: ReactZoomPanPinchRef | null;
  scale: number;
  initial: number;
  gridOn: boolean;
  onToggleGrid(): void;
}) {
  const run = <A extends unknown[]>(fn: ((...a: A) => Promise<unknown>) | undefined, ...a: A) => {
    return () => {
      void (fn as ((...x: A) => Promise<unknown>) | undefined)?.(...a);
    };
  };
  return (
    <div className="tk-canvas-tools" role="toolbar" aria-label="Canvas zoom controls">
      <ToolButton label="Zoom out" onClick={run(api?.zoomOut, BUTTON_STEP)} icon={<Minus className="w-3.5 h-3.5" />} />
      <span className="tk-canvas-zoom" aria-live="polite">
        {Math.round((scale ?? initial) * 100)}%
      </span>
      <ToolButton label="Zoom in" onClick={run(api?.zoomIn, BUTTON_STEP)} icon={<Plus className="w-3.5 h-3.5" />} />
      <ToolButton
        label="Fit blueprint (see all lanes and cards)"
        onClick={run(api?.fitToView, { mode: 'contain', minScale: MIN_SCALE, maxScale: 1 })}
        icon={<Maximize className="w-3.5 h-3.5" />}
      />
      <ToolButton label="Reset view (100%)" onClick={run(api?.resetTransform)} icon={<RotateCcw className="w-3.5 h-3.5" />} />
      <ToolButton
        label={gridOn ? 'Hide grid' : 'Show grid'}
        onClick={onToggleGrid}
        icon={<Grid3x3 className="w-3.5 h-3.5" />}
        pressed={gridOn}
      />
    </div>
  );
}

function ToolButton({
  label,
  onClick,
  icon,
  pressed,
}: {
  label: string;
  onClick(): void;
  icon: ReactNode;
  pressed?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      {...(pressed !== undefined ? { 'aria-pressed': pressed } : {})}
      className={`tk-canvas-tool ${pressed ? 'is-armed' : ''}`}
    >
      {icon}
    </button>
  );
}