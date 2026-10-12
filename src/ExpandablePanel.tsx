import { useEffect, useRef, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';

export interface ExpandablePanelProps {
  section: 'architect' | 'yaml' | 'new' | 'theme' | null;
  title: string;
  blurb?: string;
  /** Current width for this section (the App owns per-section widths). */
  width: number;
  /** The section's default — double-click / Home resets to it. */
  defaultWidth: number;
  onWidthResize(width: number): void;
  onClose(): void;
  children: ReactNode;
}

export const PANEL_MIN = 280;
export const PANEL_MAX = 760;

/** Editor clamp for a dragged/keyboard-resized width (pure, unit-tested). */
export function clampPanelWidth(width: number): number {
  return Math.min(PANEL_MAX, Math.max(PANEL_MIN, Math.round(width)));
}

/**
 * ExpandablePanel — PUSHES the workspace instead of overlaying it (owner
 * direction). It is an in-flow flex child whose width animates 0 ↔ section
 * width; the canvas yields space and never hides underneath. Always mounted
 * (smooth animation), inert + aria-hidden when closed. Esc closes; there is
 * deliberately no click-outside-to-close — the panel is a persistent
 * workspace pane (VS Code sidebar model), and clicking the canvas means
 * "interact with the canvas", not "dismiss my editor".
 *
 * Width is USER-RESIZABLE: a right-edge separator (pointer drag; ArrowLeft/
 * ArrowRight for ±24px keyboard steps; double-click or Home resets). The
 * separator is a true ARIA separator with value semantics, so keyboard users
 * get the exact affordance pointer users do.
 */
export function ExpandablePanel({
  section,
  title,
  blurb,
  width,
  defaultWidth,
  onWidthResize,
  onClose,
  children,
}: ExpandablePanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const resizing = useRef(false);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    if (!section) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Esc closes one layer at a time: the card inspector and any open
        // modal dialog win first.
        if (document.querySelector('.tk-inspector.is-open') || document.querySelector('.tk-modal-dialog')) {
          return;
        }
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [section, onClose]);

  // While dragging, the animated width would lag the pointer: kill the
  // transition and lock the document's selection/cursor.
  useEffect(() => {
    if (!isResizing) return;
    document.body.classList.add('is-panel-resizing');
    return () => document.body.classList.remove('is-panel-resizing');
  }, [isResizing]);

  const open = section !== null;
  const resize = (next: number) => onWidthResize(clampPanelWidth(next));

  const endResize = () => {
    resizing.current = false;
    setIsResizing(false);
  };

  return (
    <div
      ref={panelRef}
      className={`h-full shrink-0 overflow-hidden relative flex flex-row ${
        isResizing
          ? 'transition-none'
          : 'transition-[width] duration-300 ease-out motion-reduce:transition-none'
      }`}
      style={{ width: open ? width : 0 }}
      role="complementary"
      aria-label={`${title} panel`}
      aria-hidden={!open}
      {...(!open ? { inert: 'true' } : {})}
    >
      {/* Content: the VISIBLE panel — it carries the paint (bg + border) and
          its own scrollbar, and stops `grip-width` short of the declared
          width. The resize separator then floats in the remaining air — a
          real gap between the panel and the workspace (the opencode model:
          the sash lives in positive space, never sharing pixels with the
          scrollbar), and the drag width the shell animates is unchanged. */}
      <div
        className={`h-full bg-gray-800 border-r border-gray-700 min-w-0 flex-1 flex flex-col transition-opacity duration-300 ease-out motion-reduce:transition-none ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
        aria-hidden={!open}
        {...(!open ? { inert: 'true' } : {})}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700 shrink-0">
          <div>
            <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              {title}
            </h2>
            {blurb && <p className="text-[9px] text-gray-500 mt-0.5 max-w-[280px]">{blurb}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className="tk-close shrink-0"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overflow-x-hidden">{children}</div>
      </div>

      {/* The resize separator: a first-class flex child on the panel's right —
          visually a scrollbar-like sliver at rest, the accent blob on
          hover/focus; drag/arrow/Home/dblclick live here */}
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label={`Resize ${title} width`}
        aria-valuenow={open ? width : undefined}
        aria-valuemin={PANEL_MIN}
        aria-valuemax={PANEL_MAX}
        tabIndex={open ? 0 : -1}
        data-testid="panel-resizer"
        className="tk-panel-grip"
        {...(!open ? { inert: 'true' } : {})}
        onPointerDown={(e) => {
          resizing.current = true;
          setIsResizing(true);
          (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!resizing.current || !panelRef.current) return;
          resize(clampPanelWidth(e.clientX - panelRef.current.getBoundingClientRect().left));
        }}
        onPointerUp={endResize}
        onPointerCancel={endResize}
        onDoubleClick={() => open && resize(defaultWidth)}
        onKeyDown={(e) => {
          if (!open) return;
          if (e.key === 'ArrowLeft') {
            e.preventDefault();
            resize(width - 24);
          } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            resize(width + 24);
          } else if (e.key === 'Home') {
            e.preventDefault();
            resize(defaultWidth);
          }
        }}
      />
    </div>
  );
}