import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
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
 */
export function CanvasViewport({ children, fitKey }: CanvasViewportProps) {
  return (
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
    >
      {(utils) => (
        <>
          <CanvasControls utils={utils} />
          <TransformComponent
            wrapperClass="!h-full !w-full"
            contentClass="!w-max"
          >
            {children}
          </TransformComponent>
        </>
      )}
    </TransformWrapper>
  );
}

interface ControlsApi {
  zoomIn(): void;
  zoomOut(): void;
  resetTransform(): void;
  centerView(scale?: number): void;
  instance: { transformState: { scale: number } };
}

function CanvasControls({ utils }: { utils: ReactZoomPanPinchContentRef }) {
  const api = utils as unknown as ControlsApi;
  const scale = api.instance.transformState.scale ?? 1;
  return (
    <div className="tk-canvas-tools" role="toolbar" aria-label="Canvas zoom controls">
      <ToolButton label="Zoom out" onClick={() => api.zoomOut()} icon={<Minus className="w-3.5 h-3.5" />} />
      <ToolButton label="Zoom in" onClick={() => api.zoomIn()} icon={<Plus className="w-3.5 h-3.5" />} />
      <span className="tk-canvas-zoom" aria-live="polite">
        {Math.round(scale * 100)}%
      </span>
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