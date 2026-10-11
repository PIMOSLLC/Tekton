import { useState } from 'react';
import {
  TransformWrapper,
  TransformComponent,
  useControls,
} from 'react-zoom-pan-pinch';
import type { ReactZoomPanPinchContentRef } from 'react-zoom-pan-pinch';
import { Minus, Plus, Maximize, RotateCcw } from 'lucide-react';
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
 * overlaid top-right, Figma-style. Isolated to the editor layer — the engine's
 * rendered output (Preview mode) keeps its normal page scroll behavior.
 *
 * Scale tracking: read from `onZoom` (+ initial state) — the instance's
 * transform state is NOT populated on first render, which crashed the first
 * version of this component (the white-screen report).
 */
export function CanvasViewport({ children, fitKey }: CanvasViewportProps) {
  const [scale, setScale] = useState(1);

  return (
    <div className="relative h-full w-full tk-panzoom">
      <TransformWrapper
        key={String(fitKey ?? '')}
        initialScale={1}
        minScale={0.15}
        maxScale={3}
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
        <CanvasTools scale={scale} initial={1} />
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
function CanvasTools({ scale, initial }: { scale: number; initial: number }) {
  const api = useControls();
  return (
    <div className="tk-canvas-tools" role="toolbar" aria-label="Canvas zoom controls">
      <ToolButton label="Zoom out" onClick={() => api.zoomOut()} icon={<Minus className="w-3.5 h-3.5" />} />
      <span className="tk-canvas-zoom" aria-live="polite">
        {Math.round((scale ?? initial) * 100)}%
      </span>
      <ToolButton label="Zoom in" onClick={() => api.zoomIn()} icon={<Plus className="w-3.5 h-3.5" />} />
      <ToolButton label="Fit blueprint (see all lanes and cards)" onClick={() => api.centerView(1)} icon={<Maximize className="w-3.5 h-3.5" />} />
      <ToolButton label="Reset view (100%)" onClick={() => api.resetTransform()} icon={<RotateCcw className="w-3.5 h-3.5" />} />
    </div>
  );
}

function ToolButton({
  label,
  onClick,
  icon,
}: {
  label: string;
  onClick(): void;
  icon: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="tk-canvas-tool"
    >
      {icon}
    </button>
  );
}