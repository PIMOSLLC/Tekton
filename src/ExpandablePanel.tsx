import { useEffect, useRef, type ReactNode } from 'react';

export interface ExpandablePanelProps {
  section: 'architect' | 'yaml' | null;
  title: string;
  blurb?: string;
  onClose(): void;
  children: ReactNode;
}

const SECTION_WIDTH = 340;
const YAML_WIDTH = 460;

/**
 * ExpandablePanel — PUSHES the workspace instead of overlaying it (owner
 * direction). It is an in-flow flex child whose width animates 0 ↔ section
 * width; the canvas yields space and never hides underneath. Always mounted
 * (smooth animation), inert + aria-hidden when closed. Esc closes; there is
 * deliberately no click-outside-to-close — the panel is a persistent
 * workspace pane (VS Code sidebar model), and clicking the canvas means
 * "interact with the canvas", not "dismiss my editor".
 *
 * The YAML section is wider: YAML is the headless authoring format — a
 * blueprint can be written entirely without the visual editor (by hand or via
 * the tekton CLI) — so its panel gets real estate, with the framing note.
 */
export function ExpandablePanel({ section, title, blurb, onClose, children }: ExpandablePanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!section) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Esc closes one layer at a time: the card inspector wins first.
        if (document.querySelector('.tk-inspector.is-open')) return;
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [section, onClose]);

  const open = section !== null;
  const width = section === 'yaml' ? YAML_WIDTH : SECTION_WIDTH;

  return (
    <div
      ref={panelRef}
      className="h-full bg-gray-800 border-r border-gray-700 shrink-0 overflow-hidden transition-[width] duration-200 motion-reduce:transition-none flex flex-col"
      style={{ width: open ? width : 0 }}
      role="complementary"
      aria-label={`${title} panel`}
      aria-hidden={!open}
      {...(!open ? { inert: true } : {})}
    >
      {/* Inner content is fixed-width so form fields never reflow mid-animation */}
      <div
        className="flex flex-col h-full"
        style={{ width, minWidth: width }}
        aria-hidden={!open}
        {...(!open ? { inert: true } : {})}
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
            className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-gray-200 hover:bg-gray-700 transition-colors shrink-0"
          >
            ×
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overflow-x-hidden">{children}</div>
      </div>
    </div>
  );
}