import { useEffect, useRef, type ReactNode } from 'react';

export interface ExpandablePanelProps {
  section: 'architect' | 'yaml' | null;
  title: string;
  onClose(): void;
  children: ReactNode;
}

/**
 * ExpandablePanel — the 260px PIM-family side panel (adapted from Phoenix
 * Insight Nexus): slides open beside the rail, Esc + click-outside closes,
 * 10px uppercase section header.
 */
export function ExpandablePanel({ section, title, onClose, children }: ExpandablePanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!section) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [section, onClose]);

  if (!section) return null;

  return (
    <div
      ref={panelRef}
      className="fixed left-14 top-0 h-full w-[260px] bg-gray-800 border-r border-gray-700 z-[60] shadow-xl flex flex-col"
      role="complementary"
      aria-label={`${title} panel`}
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700 shrink-0">
        <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-400">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close panel"
          className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-gray-200 hover:bg-gray-700 transition-colors"
        >
          ×
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}