import { useState } from 'react';
import {
  TransformWrapper,
  TransformComponent,
  useControls,
} from 'react-zoom-pan-pinch';
import type { ReactZoomPanPinchContentRef } from 'react-zoom-pan-pinch';
import { Minus, Plus, Maximize, RotateCcw, Grid3x3 } from 'lucide-react';
import type { ReactNode } from 'react';

export interface CanvasViewportProps {
  /** The canvas content — rendered at its natural layout size and scaled. */
  children: ReactNode;
  /** Re-fit when this changes (e.g. stage/lane counts reshape the grid). */
  fitKey?: string | number;
}

/**
 * CanvasViewport — the design-tool canvas for Build mode (owner direction):
 * pan by drag, zoom toward the cursor (wheel / trackpad pinch), and a
 * keyboard-accessible control cluster (zoom in / out / fit / reset + readout)
 * floating bottom-center, Figma-style. "Fit blueprint" = the library's native
 * contain-fit (scale capped at 100% — fit never enlarges), and `fitOnInit`
 * makes every grid reshape (the remount via `fitKey`) come out fitted, not
 * merely centered. Isolated to the editor layer — the engine's rendered
 * output (Preview mode) keeps its normal page scroll.
 */
export function CanvasViewport({ children, fitKey }: CanvasViewportProps) {
  const [scale, setScale] = useState(1);
  // View state: the dot-grid backdrop (design-tool feel; decorative, pointer-transparent).
  const [gridOn, setGridOn] = useState(true);

  return (
    <div className={`relative h-full w-full tk-panzoom ${gridOn ? 'tk-canvas-dotgrid' : ''}`}>
      <TransformWrapper
        key={String(fitKey ?? '')}
        initialScale={1}
        minScale={0.15}
        maxScale={3}
        fitOnInit="contain"
        centerOnInit
        centerZoomedOut
        wheel={{ step: 0.15 }}
        doubleClick={{ mode: 'zoomIn', step: 0.4 }}
        limitToBounds={false}
        onZoom={(ref: ReactZoomPanPinchContentRef) => {
          // v4 exposes the live transform under instance.state (scale/positionX/…).
          const s = (ref.instance as unknown as { state?: { scale?: number } })?.state?.scale;
          if (typeof s === 'number' && Number.isFinite(s)) setScale(s);
        }}
      >
        <CanvasTools scale={scale} initial={1} gridOn={gridOn} onToggleGrid={() => setGridOn((v) => !v)} />
        <TransformComponent wrapperClass="!h-full !w-full" contentClass="!w-max">
          {children}
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
}

/**
 * Control cluster — must live INSIDE TransformWrapper for `useControls` to
 * bind to it (library-idiomatic; the render-prop instance read crashed).
 */
function CanvasTools({
  scale,
  initial,
  gridOn,
  onToggleGrid,
}: {
  scale: number;
  initial: number;
  gridOn: boolean;
  onToggleGrid(): void;
}) {
  const api = useControls();
  return (
    <div className="tk-canvas-tools" role="toolbar" aria-label="Canvas zoom controls">
      <ToolButton label="Zoom out" onClick={() => api.zoomOut()} icon={<Minus className="w-3.5 h-3.5" />} />
      <span className="tk-canvas-zoom" aria-live="polite">
        {Math.round((scale ?? initial) * 100)}%
      </span>
      <ToolButton label="Zoom in" onClick={() => api.zoomIn()} icon={<Plus className="w-3.5 h-3.5" />} />
      <ToolButton
        label="Fit blueprint (see all lanes and cards)"
        onClick={() =>
          // contain: show the whole grid, scaled BELOW 100% at most — a real
          // fit, not a re-centering at fixed scale (which was a no-op when
          // already centered, the bug the owner reported).
          api.fitToView({ mode: 'contain', minScale: 0.15, maxScale: 1 }).catch(() => {
            /* zero-rect environments (headless test DOM) have nothing to fit */
          })
        }
        icon={<Maximize className="w-3.5 h-3.5" />}
      />
      <ToolButton label="Reset view (100%)" onClick={() => api.resetTransform()} icon={<RotateCcw className="w-3.5 h-3.5" />} />
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